const sql = require( './db.js' );
const POI = function ( poi ) {
	this.type = poi.type;
	this.name = poi.name;
	this.title = poi.title;
	this.lonlat = poi.lonlat;
	this.planes = poi.planes;
	this.description = poi.description;
	this.jumprun = poi.jumprun;
	this.display = poi.display;
};
POI.createNewPoi = ( newPoi, result ) => {
	sql.query( "INSERT INTO pointofintrests SET ?", newPoi, ( err, res ) => {
		if ( err ) {
			console.log( "error: ", err );
			result( err, null );
			return;
		}
		console.log( "created poi: ", { id: res.insertId, ...newPoi } );
		result( null, { id: res.insertId, ...newPoi } );
	} );
};
POI.getAllPoi = ( title, result ) => {
	let query = "SELECT id, type, name, title, lonlat, description FROM pointofintrests";
	if ( title ) {
		query += ` WHERE title LIKE '%${title}%'`;
	}
	sql.query( query, ( err, res ) => {
		if ( err ) {
			console.log( "error: ", err );
			result( null, err );
			return;
		}
		console.log( "pois: ", res );
		result( null, res );
	} );
};
POI.getPoi = ( id, result ) => {
	sql.query( `SELECT * FROM pointofintrests WHERE id = ${id}`, ( err, res ) => {
		if ( err ) {
			console.log( "error: ", err );
			result( err, null );
			return;
		}
		if ( res.length ) {
			console.log( "found poi: ", res[ 0 ] );
			result( null, res[ 0 ] );
			return;
		}
		result( { kind: "not_found" }, null );
	} );
};
POI.updatePoi = ( id, sc, result ) => {
	sql.query(
		"UPDATE pointofintrests SET type = ?,name = ?, title = ?, lonlat = ?, planes = ?, description = ?, jumprun = ? WHERE id = ?",
		[ poi.type, poi.name, poi.title, poi.lonlat, poi.planes, poi.description, poi.jumprun, id ],
		( err, res ) => {
			if ( err ) {
				console.log( "error: ", err );
				result( null, err );
				return;
			}
			if ( res.affectedRows == 0 ) {
				result( { kind: "not_found" }, null );
				return;
			}
			console.log( "updated poi: ", { id: id, ...sc } );
			result( null, { id: id, ...sc } );
		}
	);
};
module.exports = POI;
