import { Point, Circle, LineString } from 'ol/geom';

export const convert_windspeed = function ( speed, displayUnits ) {
	if ( displayUnits === "kt" ) {
		return ( speed * 1.943844 ); // mps to kts
	} else if ( displayUnits === "kmph" ) {
		return ( speed * 3.6 ); // mps to kmph
	}else if( displayUnits === "mph" ){
		return ( speed * 2.23693629); // mps to mph
	}
	return speed;
}
export const convert_temperature = function(temp, displayUnit){
	if(displayUnit === 'f'){
		return ((temp*1.8)+32);
	}
	if(displayUnit === 'k'){
		return (temp+ 273.15);
	}
	return temp;
}
export const convert_distance = function ( dist, displayUnits ) {
	if ( displayUnits === "metric" ) {
		return ( dist / 1000 ); // meters to kilometers
	} else if ( displayUnits === "imperial" ) {
		return ( dist / 1609 ); // meters to miles
	}
	return ( dist / 1852 ); // meters to nautical miles
}
export const convert_distance_km = function ( dist, displayUnits ) {
	if(dist === null || dist === ''){
		return null;
	}

	if ( displayUnits === "metric" ) {
		return (dist*1).toFixed(2); // km to km
	} else if ( displayUnits === "imperial" ) {
		return ( dist * 0.621371192 ).toFixed(2); // km to miles
	}else if( displayUnits === "nautical" ){
		return ( dist / 1.85200 ).toFixed(2); // km to nm
	}
	return dist;
}
export const convert_distance_to_km = function ( dist, displayUnits ) {
	if ( displayUnits === "metric" ) {
		return ( dist / 1 ); // km to km
	} else if ( displayUnits === "imperial" ) {
		return ( dist / 0.621371192 ); // miles to km
	}else if( displayUnits === "nautical" ){
		return ( dist * 1.85200 ); // nm to km
	}
	return dist;
}
export const format_distance_long = function ( dist, displayUnits, fixed ) {
	if ( dist === null ) {
		return "n/a";
	}
	if ( typeof fixed === 'undefined' ) {
		fixed = 1;
	}
	var NBSP = '\u00a0';
	var dist_text = convert_distance( dist, displayUnits ).toFixed( fixed ) + NBSP + get_unit_label( "distance", displayUnits );
	return dist_text;
};
export const get_unit_label = function ( quantity, systemOfMeasurement ) {

	const UnitLabels = {
		'altitude': { metric: "m", imperial: "ft", nautical: "nm" },
		'speed': { metric: "km/h", imperial: "mph", nautical: "kt" },
		'distance': { metric: "km", imperial: "mi", nautical: "nm" },
		'verticalRate': { metric: "m/s", imperial: "ft/min", nautical: "ft/min" },
		'distanceShort': { metric: "m", imperial: "ft", nautical: "nm", miles:"mi" },
		'temperature': { c: "°C", f: "°F" },
		'windspeed': { mps: "m/s", kt: "kt", kmph: "km/h", mph:'mph' },
		'alt': {metric:'m', imperial:'ft', nautical: 'nm'},
		'time': {s:'sec', m:'min', h:'hrs'},
	};

	var labels = UnitLabels[ quantity ];
	if ( labels !== undefined && labels[ systemOfMeasurement ] !== undefined ) {
		return labels[ systemOfMeasurement ];
	}
	return "";
};
export const convert_altitude = (alt, displayUnits) => {
	if(displayUnits === 'imperial'){
		return (alt*3.2808399); //meters to feet
	}
	if (displayUnits === "metric") {
		return alt / 3.2808;  // feet to meters
	}

	return alt;
}
export const GetConversionFactor = function ( displayUnits ) {
	var conversionFactor = 1000.0;
	if ( displayUnits === "nautical" ) {
		conversionFactor = 1852.0;
	} else if ( displayUnits === "imperial" ) {
		conversionFactor = 1609.0;
	}
	return conversionFactor;
};
export const toRadians = function ( angleDegrees ) {
	return angleDegrees * Math.PI / 180;
};
export const toDegrees = function ( angleRadians ) {
	return angleRadians * 180 / Math.PI;
};
export const getAltitudeColor = function ( altitude ) {
	var h, s, l;
	altitude = altitude*3.2808;

	s = ColorByAlt.air.s;
	l = ColorByAlt.air.l;

	var hpoints = ColorByAlt.air.h;
	h = hpoints[ 0 ].val;
	for ( var i = hpoints.length - 1; i >= 0; --i ) {
		if ( altitude > hpoints[ i ].alt ) {
			if ( i == hpoints.length - 1 ) {
				h = hpoints[ i ].val;
			} else {
				h = hpoints[ i ].val + ( hpoints[ i + 1 ].val - hpoints[ i ].val ) * ( altitude - hpoints[ i ].alt ) / ( hpoints[ i + 1 ].alt - hpoints[ i ].alt )
			}
			break;
		}
	}

	if ( h < 0 ) {
		h = ( h % 360 ) + 360;
	} else if ( h >= 360 ) {
		h = h % 360;
	}

	if ( s < 5 ) s = 5;
	else if ( s > 95 ) s = 95;

	if ( l < 5 ) l = 5;
	else if ( l > 95 ) l = 95;

	return 'hsl(' + ( h / 5 ).toFixed( 0 ) * 5 + ',' + ( s / 5 ).toFixed( 0 ) * 5 + '%,' + ( l / 5 ).toFixed( 0 ) * 5 + '%)'
};
export const get_compass_point = function ( center, distance, bearing ) {
	var lat1 = toRadians( center[ 1 ] );
	var lon1 = toRadians( center[ 0 ] );
	var dByR = distance / 6378137.0;
	var lat = Math.asin( Math.sin( lat1 ) * Math.cos( dByR ) + Math.cos( lat1 ) * Math.sin( dByR ) * Math.cos( bearing ) );
	var lon = lon1 + Math.atan2( Math.sin( bearing ) * Math.sin( dByR ) * Math.cos( lat1 ), Math.cos( dByR ) - Math.sin( lat1 ) * Math.sin( lat ) );
	return [ toDegrees( lon ), toDegrees( lat ) ];
};
export const make_geodesic_circle = function ( center, radius, points ) {
	var angularDistance = radius / 6378137.0;
	var lon1 = center[ 0 ] * Math.PI / 180.0;
	var lat1 = center[ 1 ] * Math.PI / 180.0;
	var geom;
	for ( var i = 0; i <= points; ++i ) {
		var bearing = i * 2 * Math.PI / points;

		var lat2 = Math.asin( Math.sin( lat1 ) * Math.cos( angularDistance ) +
			Math.cos( lat1 ) * Math.sin( angularDistance ) * Math.cos( bearing ) );
		var lon2 = lon1 + Math.atan2( Math.sin( bearing ) * Math.sin( angularDistance ) * Math.cos( lat1 ),
			Math.cos( angularDistance ) - Math.sin( lat1 ) * Math.sin( lat2 ) );

		lat2 = lat2 * 180.0 / Math.PI;
		lon2 = lon2 * 180.0 / Math.PI;
		if ( !geom ) {
			geom = new LineString( [
				[ lon2, lat2 ]
			] );
		} else {
			geom.appendCoordinate( [ lon2, lat2 ] );
		}
	}
	return geom;
};
export const svgPathToSvg = (path, stroke, fill, stroke_width, selected_stroke) => {
	path = path.replace('color_fill', fill).replace('color_stroke', stroke).replace('add_stroke_selected', selected_stroke).replace('width_stroke', stroke_width);
	return path;
};
export const svgPathToURI = (path, stroke, fill, stroke_width, selected_stroke) => {
	const svg = svgPathToSvg(path, stroke, fill, stroke_width);
	return "data:image/svg+xml;base64," + btoa(svg);
};

