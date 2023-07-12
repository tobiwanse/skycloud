const sql = require( './db.js' );
const path = require('path');
const fs = require('fs');
const CUMULUS = function ( id, req, file, result ) {
	this.tmpFile = file.filepath;
	this.uploadDir = path.join( __dirname, `../cumulus/${id}` );
	this.file = req.headers.file;
	this.ts = req.headers.ts;
	this.signature = req.headers.signature;
	this.action = req.headers.action;
	this.binary = req.headers.binary;
	this.utf8 = req.headers.uf8;
	this.oldestTs = req.headers.oldest;
}

CUMULUS.getWindData = (id, result) => {
	const dir = path.join( __dirname, `../cumulus/${id}` );
	var data = {};
	if (!fs.existsSync(dir)) {
		return result(null, data);
	}
	try{
		var wdata = JSON.parse(fs.readFileSync(dir+'/winddata.json', "utf8"));
		var wdirdata = JSON.parse(fs.readFileSync(dir+'/wdirdata.json', "utf8"));
		var realtimegauges = JSON.parse(fs.readFileSync(dir+'/realtimegauges.txt', "utf8"));
		var data = {
			wchart: {
				wspeed: wdata.wspeed,
				wgust: wdata.wgust,
				bearing: wdirdata.bearing,
				avgbearing: wdirdata.avgbearing
			},
			realtime: realtimegauges
		}
		return result(null, data);
	} catch(err) {
		console.log(err)
		return result(null, {});
	}
}

CUMULUS.update = (data, result) => {
	var cwd = data.uploadDir+'/'+data.file;
	if(data.file == 'winddata.json'){
		var winddata = fs.readFileSync(data.tmpFile);
		try{
			fs.writeFileSync(cwd, winddata, {flags: 'a+'});
		}catch(err){
			result(err, null);
			return;
		}
	}
	if(data.file == 'wdirdata.json'){
		var wdirdata = fs.readFileSync(data.tmpFile);
		try{
			fs.writeFileSync(cwd, wdirdata, {flags: 'a+'});
		}catch(err){
			result(err, null);
			return;
		}
	}
	if(data.file === 'realtime.txt'){
		var realtime = fs.readFileSync(data.tmpFile);
		try{
			fs.writeFileSync(cwd, realtime, {flags: 'a+'});
		}catch(err){
			result(err, null);
			return;
		}
	}
	if(data.file === 'availabledata.json'){
		var availabledata = fs.readFileSync(data.tmpFile);
		try{
			fs.writeFileSync(cwd, availabledata, {flags: 'a+'});
		}catch(err){
			result(err, null);
			return;
		}
	}
	if(data.file === 'graphconfig.json'){
		var graphconfig = fs.readFileSync(data.tmpFile);
		try{
			fs.writeFileSync(cwd, graphconfig, {flags: 'a+'});
		}catch(err){
			result(err, null);
			return;
		}
	}
	if(data.file === 'realtimegauges.txt'){
		var realtimegauges = fs.readFileSync(data.tmpFile);
		try{
			fs.writeFileSync(cwd, realtimegauges, {flags: 'a+'});
		}catch(err){
			result(err, null);
			return;
		}
	}

	try{
		fs.unlinkSync(data.tmpFile);
	}catch(err){
		result(err, null);
		return;
	}
}

module.exports = CUMULUS;
