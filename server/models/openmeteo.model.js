const sql = require( './db.js' );
const axios = require( 'axios' );

const OPENMETEO = function (lonlat, offset) {
	this.lonlat = lonlat;
	this.offset = offset;
	this.winds = {};
}

OPENMETEO.convertMetersToFeet = ( val ) => {
	return ( val * 3.2808399 );
}
OPENMETEO.interpolate = ( alt, elevation, raw, system ) => {
	var obj = {};
	if ( system == 'imperial' ) {
		elevation = OPENMETEO.convertMetersToFeet( elevation );
	}
	const specificAltitude = alt;
	const groundAltitude = elevation;
	const absoluteAltitude = specificAltitude //elevation;
	const altitudeAboveGround = raw.map( ( wind ) => {
		if ( system == 'imperial' ) {
			return OPENMETEO.convertMetersToFeet( Math.round( wind.altitude ) );
		}
		return Math.round( wind.altitude );
	} );
	var index = altitudeAboveGround.findIndex( ( alt ) => alt > absoluteAltitude );
	var lowerIndex = index - 1;
	var upperIndex = index;
	if ( index < 0 ) {
		return false;
	}
	if ( index == 0 ) {
		lowerIndex = 0;
		upperIndex = 1;
	}
	const fraction = ( absoluteAltitude - altitudeAboveGround[ lowerIndex ] ) / ( altitudeAboveGround[ upperIndex ] - altitudeAboveGround[ lowerIndex ] );
	const altitudeAtAbsoluteAltitude = raw[ lowerIndex ].altitude + fraction * ( raw[ upperIndex ].altitude - raw[ lowerIndex ].altitude );
	const pressureAtAbsoluteAltitude = raw[ lowerIndex ].pressure + fraction * ( raw[ upperIndex ].pressure - raw[ lowerIndex ].pressure );
	const windspeedAtAbsoluteAltitude = raw[ lowerIndex ].speed + fraction * ( raw[ upperIndex ].speed - raw[ lowerIndex ].speed );
	const windDirectionAtAbsoluteAltitude = raw[ lowerIndex ].direction + fraction * ( raw[ upperIndex ].direction - raw[ lowerIndex ].direction );
	const temperatureAtAbsoluteAltitude = raw[ lowerIndex ].temperature + fraction * ( raw[ upperIndex ].temperature - raw[ lowerIndex ].temperature );
	obj.pressure = Number( pressureAtAbsoluteAltitude.toFixed( 1 ) );
	obj.altitude = Number( alt.toFixed( ) );
	obj.direction = Number( windDirectionAtAbsoluteAltitude.toFixed( ) );
	obj.speed = Number( windspeedAtAbsoluteAltitude.toFixed( 1 ) );
	obj.temperature = Number( temperatureAtAbsoluteAltitude.toFixed( 1 ) );
	return obj;
}
OPENMETEO.get = function( lonlat, offset, result ) {
	const model = 'best_match';
	const lon = lonlat.split( ',' )[ 0 ];
	const lat = lonlat.split( ',' )[ 1 ];
	const raw = [ ];
	const winds = {};
	const pressures = [ 1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150, 100, 70, 50, 30 ];
	const altim = [ 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400, 5700, 6000 ];
	const altft = [ 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000 ];
	var dateTime = new Date( );
	if ( offset !== 0 ) {
		dateTime.setHours( dateTime.getHours( ) + Number( offset ) );
	}
	var isoDateTime = dateTime.toISOString( );
	var date = isoDateTime.split( 'T' )[ 0 ];
	var time = isoDateTime.split( 'T' )[ 1 ];
	var HH = time.split( ':' )[ 0 ];
	var MM = time.split( ':' )[ 1 ];
	var filterDateTime = date + 'T' + HH + ':00';
	var temperatures = 'temperature_1000hPa,temperature_975hPa,temperature_950hPa,temperature_925hPa,temperature_900hPa,temperature_875hPa,temperature_850hPa,temperature_800hPa,temperature_700hPa,temperature_600hPa,temperature_500hPa,temperature_400hPa,temperature_300hPa,temperature_250hPa,temperature_200hPa,temperature_150hPa,temperature_100hPa,temperature_70hPa,temperature_50hPa,temperature_30hPa';
	var windspeeds = 'windspeed_1000hPa,windspeed_975hPa,windspeed_950hPa,windspeed_925hPa,windspeed_900hPa,windspeed_875hPa,windspeed_850hPa,windspeed_800hPa,windspeed_700hPa,windspeed_600hPa,windspeed_500hPa,windspeed_400hPa,windspeed_300hPa,windspeed_250hPa,windspeed_200hPa,windspeed_150hPa,windspeed_100hPa,windspeed_70hPa,windspeed_50hPa,windspeed_30hPa';
	var winddirections = 'winddirection_1000hPa,winddirection_975hPa,winddirection_950hPa,winddirection_925hPa,winddirection_900hPa,winddirection_875hPa,winddirection_850hPa,winddirection_800hPa,winddirection_700hPa,winddirection_600hPa,winddirection_500hPa,winddirection_400hPa,winddirection_300hPa,winddirection_250hPa,winddirection_200hPa,winddirection_150hPa,winddirection_100hPa,winddirection_70hPa,winddirection_50hPa,winddirection_30hPa';
	var geopotential_heights = 'geopotential_height_1000hPa,geopotential_height_975hPa,geopotential_height_950hPa,geopotential_height_925hPa,geopotential_height_900hPa,geopotential_height_875hPa,geopotential_height_850hPa,geopotential_height_825hPa,geopotential_height_800hPa,geopotential_height_775hPa,geopotential_height_750hPa,geopotential_height_725hPa,geopotential_height_700hPa,geopotential_height_675hPa,geopotential_height_650hPa,geopotential_height_625hPa,geopotential_height_600hPa,geopotential_height_500hPa,geopotential_height_400hPa,geopotential_height_300hPa,geopotential_height_250hPa,geopotential_height_200hPa,geopotential_height_150hPa,geopotential_height_100hPa,geopotential_height_70hPa,geopotential_height_50hPa,geopotential_height_30hPa';
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&hourly=pressure_msl,surface_pressure,${temperatures},${windspeeds},${winddirections},${geopotential_heights}&current_weather=true&windspeed_unit=ms&models=${model}`;

	axios.get( url, { timeout: 10000 } )
		.then( ( response ) => {
			var data = response.data;
			if ( typeof data === 'undefined' ) {
				console.log( 'Could not get open-meteo.', response );
				result( data, null );
			}
			winds.latitude = data.latitude;
			winds.longitude = data.longitude;
			winds.generationtime_ms = data.generationtime_ms;
			winds.timezone = data.timezone;
			winds.current_weather = data.current_weather;
			winds.elevation = data.elevation;
			winds.org = data;
			data.hourly.time.forEach( ( time, time_index, array ) => {
				if ( time === filterDateTime ) {
					winds.pressure_msl = data.hourly.pressure_msl[ time_index ];
					winds.surface_pressure = data.hourly.surface_pressure[ time_index ];
					winds.valid_time = data.hourly.time[ time_index ];

					pressures.forEach( ( hpa, hpa_index, array ) => {
						raw.push( {
							pressure: hpa,
							altitude: data.hourly[ `geopotential_height_${hpa}hPa` ][ time_index ],
							direction: data.hourly[ `winddirection_${hpa}hPa` ][ time_index ],
							speed: data.hourly[ `windspeed_${hpa}hPa` ][ time_index ],
							temperature: data.hourly[ `temperature_${hpa}hPa` ][ time_index ],
						} );
					} );
					winds.raw = [ ];
					winds.metric = [ ];
					winds.imperial = [ ];
					var elevation = winds.elevation
					raw.forEach( ( wind, wind_index, array ) => {
						var alt_agl = ( wind.altitude - elevation );
						wind.altitude = alt_agl;
						winds.raw.push( wind );
					} )
					altim.forEach( ( altim, altm_index, array ) => {
						var altinm = this.interpolate( altim, elevation, winds.raw );
						if ( altinm ) {
							winds.metric.push( altinm );
						}
					} );
					altft.forEach( ( altift, altft_index, array ) => {
						var altinft = this.interpolate( altift, elevation, winds.raw, "imperial" );
						if ( altinft ) {
							winds.imperial.push( altinft );
						}
					} );
				}
			} );
			result( null, winds );
		} )
		.catch( function ( error ) {
			console.log( 'Could not get open-meteo.', error.message );
			result( error, null );
		} )
};
module.exports = OPENMETEO;
