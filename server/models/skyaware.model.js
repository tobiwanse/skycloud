const sql = require( './db.js' );
const axios = require( 'axios' );
const path = require('path');
const fs = require('fs');
require('dotenv').config({path: path.join( __dirname, '../../.env' )});

function SKYAWARE() {
	this.skyaware_url = process.env.skyaware_url;
}

SKYAWARE.prototype.getReceiver = ( result ) => {
	const url = `${process.env.skyaware_url}data/receiver.json`;
	console.log(url);
	axios.get( url, { timeout: 10000 } )
		.then( ( response ) => {
			console.log( response.data );
			result( null, response.data );
		})
		.catch( function ( error ) {
			console.log( 'Could not get skyaware receiver.', error.message );
			console.log( error );
			result( error, null );
		} )
}

SKYAWARE.prototype.getAircraft = ( result ) => {
	console.log('get aircrafts');
	const url = `${process.env.skyaware_url}data/aircraft.json`;
	console.log(url);
	axios.get( url, { timeout: 10000 } )
	.then( ( response ) => {
		result( null, response.data );
	})
	.catch( function ( error ) {
		console.log( 'Could not get skyaware receiver.', error.message );
		result( error, null );
	} )
}

SKYAWARE.prototype.getDb = ( id, result ) => {
	console.log('get Db');
	const url = `${process.env.skyaware_url}db/${id}.json`;
	console.log(url);
	axios.get( url, { timeout: 10000 } )
	.then( ( response ) => {
		result( null, response.data );
	})
	.catch( function ( error ) {
		console.log( 'Could not get skyaware db.', error.message );
		result( error, null );
	} )
}

module.exports = SKYAWARE;