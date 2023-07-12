const sql = require( './db.js' );

const Jumprun = function ( jr ) {
	this.direction = jr.direction;
	this.greenlight = jr.greenlight;
	this.redlight = jr.redlight;
	this.offset = jr.offset;
	this.separation = jr.separation;
	this.timestamp = jr.timestamp;
}

Jumprun.getJumprun = ( id, result ) => {
	sql.query( `SELECT jumprun FROM pointofintrests WHERE id = ${id}`, ( err, res, fields ) => {
		if ( err ) {
			console.log( "error: ", err );
			result( err, null );
			return;
		}

		if ( res.length ) {
			result( null, res[0].jumprun );
			return;
		}

		result( { kind: "not_found" }, null );
	} );
};

Jumprun.updateJumprun = ( id, data, result ) => {
	data = JSON.stringify(data);
	console.log(data);
	sql.query(
		"UPDATE pointofintrests SET jumprun = ? WHERE id = ?",
		[ data, id ],
		( err, res ) => {
			if ( err ) {
				console.log( "error: ", err );
				result( err, null );
				return;
			}

			if ( res.affectedRows == 0 ) {
				result( { kind: "not_found" }, null );
				return;
			}
			result( null, { id: id, ...res } );
		}
	);
};
module.exports = Jumprun;
