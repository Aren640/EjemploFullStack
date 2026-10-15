const databaseName = process.env.MONGO_INITDB_DATABASE;
const appUser = process.env.MONGO_APP_USER;
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!databaseName || !appUser || !appPassword) {
  throw new Error('MongoDB application user environment variables are required.');
}

db.getSiblingDB(databaseName).createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: databaseName }],
});
