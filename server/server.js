const express = require('express');
const path = require('path');
const app = express( );
const cors = require('cors');

require('dotenv').config({path: path.join( __dirname, '.env' )});

const port = process.env.port;
const host = process.env.host;
const corsOptions = {
  origin: host,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

app.use( express.static( path.join( __dirname, '../client/dist' ) ) );

const routes = require('./routes/sc.routes.js')(app);

app.get( '/', function ( req, res ) {
	res.sendFile( path.join( __dirname, '../client/dist/index.html') );
} );

app.listen( port, function ( ) {
	console.log( 'listening on localhost:' + port );
} );
