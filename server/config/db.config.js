require('dotenv').config();
const dbConfig = {
	host: process.env.dbHost,
	port: process.env.dbPort,
	user: process.env.dbUser,
	password: process.env.dbPassword,
	database: process.env.dbName,
}
module.exports = dbConfig;
