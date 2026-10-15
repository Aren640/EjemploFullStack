<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use MongoDB\Client;
use MongoDB\Driver\Exception\Exception as MongoException;
use MongoDB\Driver\ServerApi;
use MongoDB\BSON\UTCDateTime;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mongoCollection(): MongoDB\Collection
{
    $host = getenv('MONGO_HOST') ?: 'mongo';
    $port = getenv('MONGO_PORT') ?: '27017';
    $database = getenv('MONGO_DB_NAME') ?: 'autoescuela';
    $username = rawurlencode(getenv('MONGO_APP_USER') ?: 'autoescuela_app');
    $password = rawurlencode(getenv('MONGO_APP_PASSWORD') ?: '');
    $authSource = rawurlencode($database);
    $uri = "mongodb://{$username}:{$password}@{$host}:{$port}/?authSource={$authSource}";

    $client = new Client($uri, [], ['serverApi' => new ServerApi(ServerApi::V1)]);
    return $client->selectCollection($database, 'contactos');
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($path === '/api/health' && $method === 'GET') {
    try {
        mongoCollection()->getManager()->executeCommand(
            getenv('MONGO_DB_NAME') ?: 'autoescuela',
            new MongoDB\Driver\Command(['ping' => 1]),
        );
        respond(200, ['status' => 'ok']);
    } catch (Throwable $error) {
        error_log('MongoDB health check failed: ' . $error->getMessage());
        respond(503, ['status' => 'unavailable']);
    }
}

if ($path === '/api/contactos' && $method === 'POST') {
    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody ?: '', true);

    if (!is_array($input)) {
        respond(400, ['error' => 'El cuerpo de la solicitud debe ser JSON válido.']);
    }

    $nombre = is_string($input['nombre'] ?? null) ? trim($input['nombre']) : '';
    $apellidos = is_string($input['apellidos'] ?? null) ? trim($input['apellidos']) : '';
    $email = is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';

    if ($nombre === '' || $apellidos === '' || $email === '') {
        respond(400, ['error' => 'Completa todos los campos.']);
    }

    if (preg_match_all('/./us', $nombre) > 100 || preg_match_all('/./us', $apellidos) > 100 || strlen($email) > 254) {
        respond(400, ['error' => 'Uno o más campos superan la longitud permitida.']);
    }

    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        respond(400, ['error' => 'Introduce un correo electrónico válido.']);
    }

    try {
        mongoCollection()->insertOne([
            'nombre' => $nombre,
            'apellidos' => $apellidos,
            'email' => $email,
            'createdAt' => new UTCDateTime(),
        ]);
        respond(201, ['message' => 'Solicitud recibida correctamente.']);
    } catch (MongoException $error) {
        error_log('Could not save contact: ' . $error->getMessage());
        respond(500, ['error' => 'No se pudo guardar la solicitud. Inténtalo más tarde.']);
    } catch (Throwable $error) {
        error_log('Unexpected contact API error: ' . $error->getMessage());
        respond(500, ['error' => 'No se pudo procesar la solicitud. Inténtalo más tarde.']);
    }
}

if (str_starts_with($path ?? '', '/api/')) {
    respond(404, ['error' => 'Ruta API no encontrada.']);
}

respond(404, ['error' => 'Ruta no encontrada.']);
