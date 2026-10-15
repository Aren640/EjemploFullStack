FROM php:8.3-apache

RUN apt-get update \
	&& apt-get install -y --no-install-recommends $PHPIZE_DEPS libssl-dev \
	&& pecl install mongodb \
	&& docker-php-ext-enable mongodb \
	&& a2enmod rewrite \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY composer.json ./
RUN composer install --no-dev --no-interaction --prefer-dist --classmap-authoritative

COPY public/ ./
COPY .htaccess /var/www/html/.htaccess
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
