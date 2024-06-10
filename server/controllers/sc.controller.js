const POI = require( "../models/poi.model.js" );
const JUMPRUN = require( "../models/jumprun.model.js" );
const OPENMETEO = require( "../models/openmeteo.model.js" );
const CUMULUS = require( "../models/cumulus.model.js" );
const SKYAWARE = require( "../models/skyaware.model.js" );
const path = require( 'path' );
const fs = require( 'fs' );
const formidable = require( 'formidable' );

exports.getOpenMeteo = ( req, res ) => {
	const lonlat = req.params.lonlat;
	let offset = req.params.offset;
	if ( typeof offset == 'undefined' ) {
		offset = 0;
	}
	OPENMETEO.get( lonlat, offset, ( err, data ) => {
		if ( err )
			res.status( 500 ).send( {
				message: err.message || "Some error occurred while retrieving winds."
			} );
		else res.send( data );
	} );
}
exports.getJumprun = ( req, res ) => {
	const jumprun = new JUMPRUN( req.params.id );
	
	jumprun.getJumprun( req.params.id, ( err, data ) => {
		
		if ( err ) {
			if ( err.kind === "not_found" ) {
				console.log( 'not_found' );
				res.status( 404 ).send( {
					message: `Not found Jumprun with id ${req.params.id}.`
				} );
			} else {
				res.status( 500 ).send( {
					message: `Error retrieving Jumprun with id ${req.params.id}.`
				} );
			}
		} else res.send( data );
	} );
};
exports.updateJumprun = ( req, res ) => {
	if ( !req.body ) {
		res.status( 400 ).send( {
			message: "Content can not be empty!"
		} );
		return;
	}
	var jumprun = new Jumprun( req.body );
	Jumprun.updateJumprun(
		req.params.id,
		jumprun,
		( err, data ) => {
			if ( err ) {
				if ( err.kind === "not_found" ) {
					res.status( 404 ).send( {
						message: `Not found jumprun with id ${req.params.id}.`
					} );
				} else {
					res.status( 500 ).send( {
						message: `Error updating jumprun with id ${req.params.id}`
					} );
				}
			} else res.send( data );
		}
	);
};
exports.createNewPoi = ( req, res ) => {
	if ( !req.body ) {
		res.status( 400 ).send( {
			message: "Content can not be empty!"
		} );
	}

	const poi = new POI( req.body );

	POI.createNewPoi( skycloud, ( err, data ) => {
		if ( err )
			res.status( 500 ).send( {
				message: err.message || "Some error occurred while creating the poi."
			} );
		else res.send( data );
	} );
};
exports.getAllPoi = ( req, res ) => {
	const title = req.query.title;
	POI.getAllPoi( title, ( err, data ) => {
		if ( err )
			res.status( 500 ).send( {
				message: err.message || "Some error occurred while retrieving pois."
			} );
		else res.send( data );
	} );
};
exports.getPoi = ( req, res ) => {
	POI.getPoi( req.params.id, ( err, data ) => {
		if ( err ) {
			if ( err.kind === "not_found" ) {
				res.status( 404 ).send( {
					message: `Not found Poi with id ${req.params.id}.`
				} );
			} else {
				res.status( 500 ).send( {
					message: "Error retrieving Poi with id " + req.params.id
				} );
			}
		} else res.send( data );
	} );
};
exports.putPoi = ( req, res ) => {
	if ( !req.body ) {
		res.status( 400 ).send( {
			message: "Content can not be empty!"
		} );
	}
		POI.updatePoi( req.params.id,
		new POI( req.body ),
		( err, data ) => {
			if ( err ) {
				if ( err.kind === "not_found" ) {
					res.status( 404 ).send( {
						message: `Not found Poi with id ${req.params.id}.`
					} );
				} else {
					res.status( 500 ).send( {
						message: "Error updating Poi with id " + req.params.id
					} );
				}
			} else res.send( data );
		} );
};
exports.windChartData = ( req, res ) => {
	const cumulus = new CUMULUS;
	
	cumulus.windChartData( req.params.id, ( err, data ) => {
		
		if ( err ) {
			if ( err.kind === "not_found" ) {
				res.status( 404 ).send( {
					message: "Not found windChartData with id."
				} );
			} else {
				res.status( 500 ).send( {
					message: "Error retrieving windChartData"
				} );
			}
		} else res.send( data );
	} );
}
exports.windData = ( req, res ) => {
	CUMULUS.windData( req.params.id, ( err, data ) => {
		if ( err ) {
			if ( err.kind === "not_found" ) {
				res.status( 404 ).send( {
					message: `Not found cumulus with id ${req.params.id}.`
				} );
			} else {
				res.status( 500 ).send( {
					message: "Error retrieving cumulus with id " + req.params.id
				} );
			}
		} else res.send( data );
	} );
}
exports.wDirData = ( req, res ) => {
	CUMULUS.wDirData( req.params.id, ( err, data ) => {
		if ( err ) {
			if ( err.kind === "not_found" ) {
				res.status( 404 ).send( {
					message: "Request wdirdata not found."
				} );
			} else {
				res.status( 500 ).send( {
					message: "Error retrieving wdirdata"
				} );
			}
		} else res.send( data );
	} );
}
exports.getCumulus = ( req, res ) => {
	
	// CUMULUS.getWindData( req.params.id, ( err, data ) => {
	// 	if ( err ) {
	// 		if ( err.kind === "not_found" ) {
	// 			res.status( 404 ).send( {
	// 				message: `Not found cumulus with id ${req.params.id}.`
	// 			} );
	// 		} else {
	// 			res.status( 500 ).send( {
	// 				message: "Error retrieving cumulus with id " + req.params.id
	// 			} );
	// 		}
	// 	} else res.send( data );
	// })
	
	// CUMULUS.get( req.params.id, ( err, data ) => {
	// 	if ( err ) {
	// 		if ( err.kind === "not_found" ) {
	// 			res.status( 404 ).send( {
	// 				message: `Not found cumulus with id ${req.params.id}.`
	// 			} );
	// 		} else {
	// 			res.status( 500 ).send( {
	// 				message: "Error retrieving cumulus with id " + req.params.id
	// 			} );
	// 		}
	// 	} else res.send( data );
	// } );
	
}
exports.putCumulus = ( req, res ) => {
	var uploadDir = path.join( __dirname, `../cumulus/${req.params.id}` );
	if (!fs.existsSync(uploadDir)){
		fs.mkdirSync(uploadDir);
	}

	var form = new formidable.IncomingForm( { uploadDir: uploadDir , keepExtensions: true} );

	form.parse( req, ( err, fields, files ) => {
		if ( err ) {
			res.status( 404 ).send( {
				message: `Cumulus File ${files.file} could not be uploaded.`
			} );
		}

		var data = new CUMULUS( req.params.id, req, files.file );

		CUMULUS.update( data, ( err, data ) => {
			if ( err ) {
				if ( err.kind === "not_found" ) {
					res.status( 404 ).send( {
						message: `Not found cumulus with id ${req.params.id}.`
					} );
				} else if ( err.kind === 'no_ts' ) {
					res.status( 404 ).send( {
						message: `Not found timestamp.`
					} );
				} else if ( err.kind === 'ts_out_of_date' ) {
					res.status( 404 ).send( {
						message: `${data}`
					} );
				} else {
					res.status( 500 ).send( {
						message: "Error updating cumulus with id " + req.params.id
					} );
				}
			} else {
				res.send( data );
			}
		} );
	} );
}
exports.getSkyawareReciever = ( req, res ) => {
	const skyaware = new SKYAWARE;
	skyaware.getReceiver( ( err, data ) => {
		if ( err )
			res.status( 500 ).send( {
				message: err.message || "Some error occurred while retrieving skyaware receiver."
			} );
		else res.send( data );
	} );
}
exports.getSkyawareAircraft = ( req, res ) => {
	const skyaware = new SKYAWARE;
	skyaware.getAircraft( ( err, data ) => {
		if ( err )
			res.status( 500 ).send( {
				message: err.message || "Some error occurred while retrieving skyaware aircraft."
			} );
		else res.send( data );
	} );
}
exports.getSkyawareDb = ( req, res ) => {
	const skyaware = new SKYAWARE;
	skyaware.getDb( req.params.id, ( err, data ) => {
		if ( err )
			res.status( 500 ).send( {
				message: err.message || "Some error occurred while retrieving skyaware db."
			} );
		else res.send( data );
	} );
}