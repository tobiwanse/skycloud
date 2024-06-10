const sql = require( './db.js' );
const axios = require( 'axios' );
const path = require('path');
const fs = require('fs');
require('dotenv').config({path: path.join( __dirname, '../../.env' )});

function CUMULUS ( id, req, file, result ) {
	this.cumulus_url = process.env.cumulus_url;
}

CUMULUS.prototype.windChartData = ( id, result ) => {
	const cumulus_url = process.env.cumulus_url;
	
	const urls = [
		`${cumulus_url}graphdata/winddata.json`,
		`${cumulus_url}graphdata/wdirdata.json`
	];
	
	const requests = urls.map((url) => axios.get( url ));
	
	let obj = {};
	
	axios.all(requests).then((responses) => {
		responses.forEach((resp) => {
			let msg = {
				server: resp.headers.server,
				status: resp.status,
				fields: Object.keys(resp.data).toString(),
			};
			
			Object.keys(resp.data).forEach(key => obj[key] = resp.data[key]);
			
		});
		result(null, obj);
	});
	
	
}
CUMULUS.prototype.windData = ( result ) => {
	const url = 'http://172.19.1.67:8998/api/graphdata/winddata.json';
	axios.get(url, {timeout:5000})
		.then(function (response) {
			console.log(response.data);
			result( null, response.data );
		})
		.catch(function (error) {			
			console.log( 'Could not get wind chart data.', error.message );
			result( error, null );
		})
		.then(function () {
			
		});
};

CUMULUS.prototype.wDirData = ( result ) => {
	const url = 'http://172.19.1.67:8998/api/graphdata/wdirdata.json';
	
	axios.get(url, {timeout:5000})
		.then(function (response) {
			console.log(response.data);
			result( null, response.data );
		})
		.catch(function (error) {			
			console.log( 'Could not get wind chart data.', error.message );
			result( error, null );
		})
		.then(function () {
			
		});
};

// CUMULUS.getWindData = (id, result) => {
// 	console.log('getWindData');
// 	
// 	const dir = path.join( __dirname, `../cumulus/${id}` );
// 	var data = {};
// 	
// 	
// 	if (!fs.existsSync(dir)) {
// 		return result(null, data);
// 	}
// 	try{
// 		var wdata = JSON.parse(fs.readFileSync(dir+'/winddata.json', "utf8"));
// 		var wdirdata = JSON.parse(fs.readFileSync(dir+'/wdirdata.json', "utf8"));
// 		var realtimegauges = JSON.parse(fs.readFileSync(dir+'/realtimegauges.txt', "utf8"));
// 		var data = {
// 			wchart: {
// 				wspeed: wdata.wspeed,
// 				wgust: wdata.wgust,
// 				bearing: wdirdata.bearing,
// 				avgbearing: wdirdata.avgbearing
// 			},
// 			realtime: realtimegauges
// 		}
// 		return result(null, data);
// 	} catch(err) {
// 		console.log(err)
// 		return result(null, {});
// 	}
// 	
// }

CUMULUS.prototype.update = ( data, result ) => {
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
