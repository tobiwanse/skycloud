const sc = require("../controllers/sc.controller.js");
const router = require("express").Router();
const bodyParser = require("body-parser");

module.exports = ( app ) => {
	console.log('dsdsddsdsds');
	router.get( "/skyaware/receiver", sc.getSkyawareReciever );
	router.get( "/skyaware/aircraft", sc.getSkyawareAircraft );
	router.get( "/skyaware/db/:id", sc.getSkyawareDb );
	router.get( "/poi", sc.getAllPoi );
	router.get( "/poi/:id", sc.getPoi );
	router.post( "/poi", sc.createNewPoi );
	router.put( "/poi/:id", sc.putPoi );
	router.get( "/jumprun/:id", sc.getJumprun );
	router.put( "/jumprun/:id", sc.updateJumprun );
	router.get( "/openmeteo/:lonlat/:offset?", sc.getOpenMeteo );
	router.get( "/cumulus/windchartdata", sc.windChartData );
	router.get( "/cumulus/winddata", sc.windData );
	router.get( "/cumulus/wdirdata", sc.wDirData );
	router.get( "/cumulus", sc.getCumulus );
	router.get( "/cumulus/:id", sc.getCumulus );
	router.get( "/cumulus/upload/:id", function(req, res){ res.writeHead(200, {'content-encoding': ['deflate', 'gzip']}) });
	router.post( "/cumulus/upload/:id", sc.putCumulus);
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use('/api', router);
}

