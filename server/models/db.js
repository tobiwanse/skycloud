const mysql = require('mysql');
const dbConfig = require('../config/db.config.js');

const connection = mysql.createConnection(dbConfig);

connection.connect( (err) => {
	if ( err ) throw err;
	console.log("Successfully connected to the database.");
});

module.exports = connection;
