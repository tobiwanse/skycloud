"use strict";

import "./js/config";
import "./css/style.css";
import * as bootstrap from 'bootstrap';
import { Map, View } from "ol";
import * as Proj from "ol/proj";
import { createEmpty, containsCoordinate, extend, getHeight, getWidth } from 'ol/extent';
import { createStringXY } from "ol/coordinate";
import {
	Control,
	MousePosition,
	OverviewMap,
	Attribution,
	ScaleLine,
	Zoom,
	Rotate,
	defaults as defaultControls,
} from "ol/control";
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LayerGroup from "ol/layer/Group";
import LayerTile from "ol/layer/Tile";
import SourceOSM from "ol/source/OSM";
import SourceBing from "ol/source/BingMaps";
import LayerSwitcher from "ol-layerswitcher";
import Collection from "ol/Collection";
import {
	CreateBaseLayerGroup,
	CreateOverLayerGroup,
	CreateWindMarker,
	CreatePoiLayerGroup,
} from "./js/layers";
import { io } from 'socket.io-client';
import * as SKYAWARE from './skyaware/script';
import * as COMPASS from './js/compass';
import * as JUMPRUN from './js/jumprun';
import * as WINDS from './js/winds';
import * as POI from './js/poi';
import * as Func from './js/functions';
import { SideBarControl, AltitudeChartControl } from './js/custom-control';
import { WChart } from './js/windchart.js';


var ADSB_Enabled = true;
var UAT_Enabled = false;
var SkyAwareVersion = "unknown version";
var RefreshInterval = 1000;
var PositionHistorySize = 0;
var UatPositionHistorySize = 0;

var FetchWindsPending = null;
var FetchWindsTimer = null;
var FetchCumulusPending = null;
var FetchCumulusTimer = null;
var FetchJumprunPending = null;
var FetchJumprunTimer = null;
var FetchWDirDataPending = null;

var wchart = null;
var SelectedStation = null;
const getPointsOfIntrest = ( ) => {
	var requestTime = new Date( ).getTime( );
	return $.ajax( {
			url: "/api/poi",
			timeout: 10000,
			startTime: performance.now( ),
			cache: false,
			contentType: "application/json",
			dataType: "json",
		} )
		.done( function ( res ) {
			var time = performance.now( ) - this.startTime;
			var seconds = time / 1000;
			seconds = seconds.toFixed( 3 );
		} )
		.fail( function ( data ) {
			console.warn( "Error getting all POI!" );
		} )
};
const getPointOfIntrest = ( id ) => {
	var requestTime = new Date( ).getTime( );
	return $.ajax( {
			url: '/api/poi/' + id,
			timeout: 10000,
			startTime: performance.now( ),
			cache: false,
			contentType: "application/json",
			dataType: "json",
		} )
		.done( function ( res ) {
			var time = performance.now( ) - this.startTime;
			var seconds = time / 1000;
			seconds = seconds.toFixed( 3 );
			if ( res === null ) {
				return;
			}
			setPointOfIntrest( res );
		} )
		.fail( function ( data ) {
			console.warn( "Error getting POI!" );
		} )
};
const getJumprun = ( id ) => {
	var requestTime = new Date( ).getTime( );
	if ( FetchJumprunPending !== null && FetchJumprunPending.state( ) == 'pending' ) {
		return;
	}
	FetchJumprunPending = $.ajax( {
		url: `/api/jumprun/${id}`,
		startTime: performance.now( ),
		timeout: 10000,
		cache: false,
		dataType: "json",
	} )
	FetchJumprunPending.done( function ( res ) {
		var time = performance.now( ) - this.startTime;
		var seconds = time / 1000;
		seconds = seconds.toFixed( 3 );
	} )
	FetchJumprunPending.fail( function ( res ) {
		console.warn( "Error getting jumprun!" );
	} )
	return FetchJumprunPending;
};
const saveJumprun = ( id ) => {
	const requestTime = new Date( ).getTime( );
	if ( typeof PointOfIntrest.id === 'undefined' ) {
		return;
	}
	const data = {
		direction: Jumprun.direction,
		greenlight: Jumprun.greenlight,
		redlight: Jumprun.redlight,
		offset: Jumprun.offset,
		separation: Jumprun.separation,
		timestamp: Jumprun.timestamp
	}

	return $.ajax( {
			type: "PUT",
			url: `/api/jumprun/${PointOfIntrest.id}`,
			data: data,
			timeout: 10000,
			startTime: performance.now( ),
			cache: false,
			dataType: "json",
		} )
		.done( function ( res ) {
			var time = performance.now( ) - this.startTime;
			var seconds = time / 1000;
			seconds = seconds.toFixed( 3 );
		} )
		.fail( function ( data ) {
			console.warn( "Error setting jumprun!", data );
		} )
};
const getWinds = ( lonlat, hour = 0 ) => {
	var requestTime = new Date( ).getTime( );
	lonlat = lonlat.join( ',' );
	if ( FetchWindsPending !== null && FetchWindsPending.state( ) == 'pending' ) {
		return;
	}
	FetchWindsPending = $.ajax( {
		url: `./api/openmeteo/${lonlat}/${hour}/`,
		startTime: performance.now( ),
		timeout: 10000,
		cache: false,
		dataType: "json",
	} )
	FetchWindsPending.done( function ( res ) {
		var time = performance.now( ) - this.startTime;
		var seconds = time / 1000;
		seconds = seconds.toFixed( 3 );
	} )
	FetchWindsPending.fail( function ( res ) {
		console.warn( "Error getting openmeteo winds!" , res);
	} )
	return FetchWindsPending;
};
const getCumulus = ( id ) => {
	var requestTime = new Date( ).getTime( );
	if ( FetchCumulusPending !== null && FetchCumulusPending.state( ) == 'pending' ) {
		return;
	}
	
	FetchCumulusPending = $.ajax( {
		url: `./api/cumulus/windchartdata/`,
		startTime: performance.now( ),
		timeout: 10000,
		cache: false,
		dataType: "json",
	} )
	FetchCumulusPending.done( function ( res ) {
		var time = performance.now( ) - this.startTime;
		var seconds = time / 1000;
		seconds = seconds.toFixed( 3 );
	} )
	FetchCumulusPending.fail( function ( res ) {
		console.warn( "Error FetchCumulus!", res );
	} )
	return FetchCumulusPending;
};
const getSkyawareReceiver = () => {
	return $.ajax( { url: `./api/skyaware/receiver`,
	 timeout: 5000,
	 cache: false,
	 dataType: 'json' })
	
	.done(function(data) {
			console.log('dump1090-fa enabled');
	})
	.fail( function( data ) {
			console.warn('Error reading dump1090-fa receiver.json. dump1090-fa may be disabled');
			ADSB_Enabled = false;
	})
	.always( function() {
	});
};
const getSkyawareAircraft = () => {
	return $.ajax( { url: `./api/skyaware/aircraft`,
	 timeout: 5000,
	 cache: false,
	 dataType: 'json' })
	.done(function(data) {
			console.log('dump1090-fa enabled');
	})
	.fail( function( data ) {
			console.warn('Error reading dump1090-fa receiver.json. dump1090-fa may be disabled');
			ADSB_Enabled = false;
	})
	.always( function() {
	});
};
const getLayerByName = function ( layers, name ) {
	let layer = null;
	layers.forEach( function ( lyr ) {
		if ( lyr.get( "name" ) === name ) {
			layer = lyr
		}
	} );
	return layer;
};
const isInArray = ( search, arr ) => {
	for ( let i = 0; i < arr.length; i++ ) {
		if ( arr[ i ] == search ) {
			return true;
		}
	}
	return false;
}
const initialize = function ( callback ) {
	CenterLat = Number( localStorage[ 'CenterLat' ] ) || DefaultCenterLat;
	CenterLon = Number( localStorage[ 'CenterLon' ] ) || DefaultCenterLon;
	ZoomLvl = Number( localStorage[ "ZoomLvl" ] ) || DefaultZoomLvl;
	DisplayWindUnit = localStorage[ "DisplayWindUnit" ] || DefaultDisplayWindUnit;
	DisplayTempUnit = localStorage[ "DisplayTempUnit" ] || DefaultDisplayTempUnit;
	DisplayDistUnit = localStorage[ "DisplayDistUnit" ] || DefaultDisplayDistUnit;
	DisplayAltiUnit = localStorage[ "DisplayAltiUnit" ] || DefaultDisplayAltiUnit;
	MapType = localStorage[ "MapType" ] || DefaultMapType;
	MapRotation = Number( localStorage[ "MapRotation" ] ) || DefaultMapRotation;
	CompassCirclesCount = Number( localStorage[ 'CompassCirclesCount' ] ) || DefaultCompassCirclesCount;
	CompassCirclesBaseDistance = Number( localStorage[ 'CompassCirclesBaseDistance' ] ) || DefaultCompassCirclesBaseDistance;
	CompassCirclesInterval = Number( localStorage[ 'CompassCirclesInterval' ] ) || DefaultCompassCirclesInterval;
	SelectedPointOfIntrest = Number( localStorage[ "SelectedPointOfIntrest" ] ) || DefaultPointOfIntrest;
	DisplayWindType = localStorage[ "DisplayWindType" ] || DefaultDisplayWindType;
	DisplaySidebar = localStorage[ "DisplaySidebar" ] || DefaultDisplaySidebar;
	DisplaySelectedPanel = localStorage[ "DisplaySelectedPanel" ] || DefaultDisplaySelectedPanel;
	FilterWindsImperial = localStorage[ 'FilterWindsImperial' ] || DefaultFilterWindsImperial;
	FilterWindsMetric = localStorage[ 'FilterWindsMetric' ] || DefaultFilterWindsMetric;
	DisplayLayers = localStorage[ 'DisplayLayers' ] || DefaultDisplayLayers;
	PoiType = localStorage[ 'PoiType' ] || DefaultPoiType;

	wchart = new WChart( 'bottom-panel' );
	$( 'input[name=wind-units][value=' + DisplayWindUnit + ']' ).prop( 'checked', true );
	$( 'input[name=temp-units][value=' + DisplayTempUnit + ']' ).prop( 'checked', true );
	$( 'input[name=dist-units][value=' + DisplayDistUnit + ']' ).prop( 'checked', true );
	$( 'input[name=alti-units][value=' + DisplayAltiUnit + ']' ).prop( 'checked', true );
	$( 'input[name=circlesCount]' ).prop( 'value', CompassCirclesCount );
	$( 'input[name=baseDistance]' ).prop( 'value', CompassCirclesBaseDistance );
	$( 'input[name=intervalDistance]' ).prop( 'value', CompassCirclesInterval );
	$( 'input[name=wind-type][value=' + DisplayWindType + ']' ).prop( 'checked', true );
	$( 'input[name=menu][value=' + DisplaySelectedPanel + ']' ).prop( 'checked', true );
	$( 'input[name=poi-type][value=' + DisplayWindUnit + ']' ).prop( 'checked', true );
	$( '.displayaltiunit' ).html( Func.get_unit_label( 'altitude', DisplayAltiUnit ) );
	$( '.displaydistunit' ).html( Func.get_unit_label( 'distance', DisplayDistUnit ) );
	$( '.displaytempunit' ).html( Func.get_unit_label( 'temperature', DisplayTempUnit ) );
	$( '.displayspdunit' ).html( Func.get_unit_label( 'windspeed', DisplayWindUnit ) );
	$( '.timeunit' ).html( 'sec' );

	toggleAltiChartControl( false );
	toggleSidebarControl( false );
	toggleSidebarPanel( false );
	setSettings( false );

	$( '.sidebar-control button' ).on( 'click', toggleSidebarControl );
	$( '.sidebar-panel .close' ).on( 'click', toggleSidebarControl );
	$( 'input[name=menu]' ).on( 'change', toggleSidebarPanel );
	$( 'input[name=wind-units]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=temp-units]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=dist-units]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=alti-units]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=circlesCount]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=baseDistance]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=intervalDistance]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=wind-type]' ).on( 'change', toggleDisplayUnits );
	$( 'input[name=jumprun-settings]' ).on( 'change', onChangeJumprunSettings );
	$( '#resetmap' ).on( 'click', resetMap );
	$( '#save-jumprun' ).on( 'click', saveJumprun );
	$( '#reset-jumprun' ).on( 'click', setJumprunSettings );
	$( 'input[name=selectedwinds]' ).on( 'change', onChangeFilterWinds );

	$( window ).on( 'resize', function ( ) {
		const height = $( '#bottom-panel.shown' ).height( );
		const vh = $( window ).height( );
		$( '#map' ).css( { height: `calc(${vh}px - ${height}px)` } );
	} )

	getPointsOfIntrest( ).then( ( res ) => {
			setPointsOfIntrest( res );
		} )
		.always( ( ) => {
			initialize_map( );
			applyUrlQueryStrings( );
			if ( SelectedPointOfIntrest !== null ) {
				selectPointOfIntrest( SelectedPointOfIntrest );
			}
		} );
	
	// Get receiver metadata, reconfigure using it, then continue
	// with initialization
	getSkyawareReceiver( ).then( ( res ) => {} )
	.always( ( ) => {
		SKYAWARE.init_skyaware( );
	} );		
};
const applyUrlQueryStrings = ( ) => {
	let url = new URL( window.location.href );
	let params = new URLSearchParams( url.search );
	let allOptions = [
		'ringCount',
		'ringBaseDistance',
		'ringInterval',
		'rotation',
		'distUnit',
		'altiUnit',
		'tempUnit',
		'speedUnit',
		'mapType',
		'hideSidebar',
		'hideZoom',
		'hideLayerSwitcher',
		'hideAltiChart',
		'hideScaleLine',
		'hideMousePosition',
		'showLayers',
		'winds',
		'station',
		'charts',
		'zoom'
	];
	var needReset = false;
	for ( var option of allOptions ) {
		if ( params.has( option ) ) {
			needReset = true;
			break;
		}
	}
	if ( needReset ) {
		resetMap( );
	}
	if ( params.get( 'reset' ) === 'true' ) {
		resetMap( params.get( 'reset' ) );
	}
	if ( params.get( 'layers' ) ) {
		setLayers( params.get( 'layers' ) );
	}
	if ( params.get( 'zoom' ) ) {
		setZoom( params.get( 'zoom' ) );
	}
	if ( params.get( 'hideMousePosition' ) ) {
		$( '.ol-mouse-position' ).hide( );
	}
	if ( params.get( 'hideLayerSwitcher' ) ) {
		$( '.layer-switcher' ).hide( );
	}
	if ( params.get( 'hideZoom' ) ) {
		$( '.ol-zoom' ).hide( );
	}
	if ( params.get( 'hideSidebar' ) ) {
		$( '.sidebar-control' ).hide( );
		$( '.sidebar-panel' ).removeClass( 'shown' );
	}
	if ( params.get( 'hideAltiChart' ) ) {
		$( '#altitude_chart' ).hide( );
	}
	if ( params.get( 'ringCount' ) ) {
		setRingCount( params.get( 'ringCount' ) );
	}
	if ( params.get( 'ringBaseDistance' ) ) {
		setRingBaseDistance( params.get( 'ringBaseDistance' ) );
	}
	if ( params.get( 'ringInterval' ) ) {
		setRingInterval( params.get( 'ringInterval' ) );
	}
	if ( params.get( 'hideScaleLine' ) ) {
		toggleScaleLineVisibility( false );
	}
	if ( params.get( 'scaleLine' ) == 'show' ) {
		toggleScaleLineVisibility( true );
	}
	if ( params.get( 'rotate' ) ) {
		setMapRotation( params.get( 'rotate' ) );
	}
	if ( params.get( 'type' ) ) {
		setMapType( params.get( 'type' ) );
	}
	if ( params.get( 'distUnit' ) ) {
		setDisplayDistUnits( params.get( 'distUnit' ) );
	}
	if ( params.get( 'altiUnit' ) ) {
		setDisplayAltiUnits( params.get( 'altiUnit' ) );
	}
	if ( params.get( 'winds' ) ) {
		filterWinds( params.get( 'winds' ) );
	}
	if ( params.get( 'speedUnit' ) ) {
		setDisplaySpeedUnits( params.get( 'speedUnit' ) );
	}
	if ( params.get( 'tempUnit' ) ) {
		setDisplayTempUnits( params.get( 'tempUnit' ) );
	}
	if ( params.get( 'charts' ) === 'show' ) {
		toggleGrafs( 'show' );
	}
	if ( params.get( 'cumulus' ) ) {
		setCumulus( params.get( 'cumulus' ) );
	}
	if ( params.get( 'poi' ) ) {
		setSelectedPointOfIntrest( params.get( 'poi' ) );
	}
	if ( params.get( 'display' ) === 'true' ) {
		setDisplay( params.get( 'display' ) );
	}
}
const filterWinds = ( filter ) => {
	if ( DisplayAltiUnit === 'metric' ) {
		FilterWindsMetric = localStorage[ 'FilterWindsMetric' ] = filter;
	} else {
		FilterWindsImperial = localStorage[ 'FilterWindsImperial' ] = filter;
	}
	WINDS.update( );
	updateWindTable( );
}
const setDisplay = ( ) => {
	toggleGrafs( 'show' );
	toggleWidgets( 'show' );
	toggleAltiChartControl( false );
	$( '.layer-switcher' ).hide( );
	$( '.ol-zoom' ).hide( );
	$( '.sidebar-control' ).hide( );
	$( '.sidebar-panel' ).hide( );
	$( '.ol-rotate-reset' ).hide( );
	$( '.ol-mouse-position' ).hide( );
}
const toggleWidgets = ( show ) => {
	if ( show == 'show' ) {
		$( '#left-widget-wrapper' ).addClass( 'shown' );
	} else {
		$( '#left-widget-wrapper' ).removeClass( 'shown' );
	}
}
const setCumulus = ( id ) => {
	SelectedStation = id;
	FetchCumulusTimer = null;
	getCumulus( id ).then( ( res ) => {
			if ( typeof res !== 'undefined' ) {
				wchart.update( res );
			}
		} )
		.catch( ( err ) => {
			console.log( err )
		} )
	FetchCumulusTimer = setInterval( ( ) => {
		getCumulus( id ).then( ( res ) => {
				if ( typeof res !== 'undefined' ) {
					wchart.update( res );
				}
			} )
			.catch( ( err ) => {
				console.log( err )
			} )
	}, 30000 );
}
const toggleGrafs = ( show ) => {
	if ( show == 'show' ) {
		$( '#bottom-panel' ).addClass( 'shown' );
		const height = $( '#bottom-panel' ).height( );
		const vh = $( window ).height( );
		$( '#map' ).css( { height: `calc(${vh}px - ${height}px)` } );
	} else {
		$( '#bottom-panel' ).removeClass( 'shown' );
	}
}
const setZoom = ( zoom ) => {
	ZoomLvl = localStorage[ "ZoomLvl" ] = Number( zoom );
}
const setLayers = ( layers ) => {
	layers = layers.split( ',' );
	LayerSwitcher.forEachRecursive( BaseOverLayers, function ( lyr ) {
		if ( isInArray( lyr.get( 'name' ), layers ) ) {
			lyr.setVisible( true );
		} else {
			lyr.setVisible( false );
		}
	} )
}
const setPoiLayers = ( layer ) => {
	LayerSwitcher.forEachRecursive( PoiLayers, function ( lyr ) {
		if ( lyr.get( 'name' ) === layer ) {
			lyr.setVisible( true );
		} else {
			lyr.setVisible( false );
		}
	} )
}
const setPointsOfIntrest = ( res ) => {
	res.forEach( ( poi, index ) => {
		var obj = {};
		obj.id = poi.id;
		obj.type = poi.type;
		obj.name = poi.name;
		obj.title = poi.title;
		obj.lonlat = JSON.parse( poi.lonlat );
		obj.description = poi.description;
		PointsOfIntrest.push( obj );
	} );
}
const setPointOfIntrest = ( res ) => {
	SelectedPointOfIntrest = localStorage[ 'SelectedPointOfIntrest' ] = res.id;
	PointOfIntrest.id = res.id;
	PointOfIntrest.type = res.type;
	PointOfIntrest.name = res.name;
	PointOfIntrest.title = res.title;
	PointOfIntrest.lonlat = JSON.parse( res.lonlat );
	PointOfIntrest.planes = JSON.parse( res.planes );
	PointOfIntrest.description = res.description;
	PointOfIntrest.jumprun = JSON.parse( res.jumprun );
	PointOfIntrest.display = JSON.parse( res.display );
}
const setRingInterval = ( distance ) => {
	CompassCirclesInterval = localStorage[ 'CompassCirclesInterval' ] = Number( distance );
	$( 'input[name=intervalDistance]' ).prop( 'value', CompassCirclesInterval );
}
const setRingBaseDistance = ( distance ) => {
	CompassCirclesBaseDistance = localStorage[ 'CompassCirclesBaseDistance' ] = Number( distance );
	$( 'input[name=baseDistance]' ).prop( 'value', CompassCirclesBaseDistance );
}
const setRingCount = ( count ) => {
	CompassCirclesCount = localStorage[ 'CompassCirclesCount' ] = Number( count );
	$( 'input[name=circlesCount]' ).prop( 'value', CompassCirclesCount );
}
const setMapType = ( type ) => {
	MapType = localStorage[ "MapType" ] = type;
	LayerSwitcher.forEachRecursive( BaseLayers, function ( lyr ) {
		if ( lyr instanceof LayerGroup ) {
			return;
		}
		if ( MapType === lyr.get( "name" ) ) {
			lyr.setVisible( true );
		} else {
			lyr.setVisible( false );
		}
	} );
}
const setDisplayDistUnits = ( units ) => {
	DisplayDistUnit = localStorage[ 'DisplayDistUnit' ] = units;
	$( 'input[name=dist-units][value=' + DisplayDistUnit + ']' ).prop( 'checked', true );
}
const setDisplayAltiUnits = ( units ) => {
	DisplayAltiUnit = localStorage[ 'DisplayAltiUnit' ] = units;
	$( 'input[name=alti-units][value=' + DisplayAltiUnit + ']' ).prop( 'checked', true );
}
const setDisplaySpeedUnits = ( units ) => {
	DisplayWindUnit = localStorage[ "DisplayWindUnit" ] = units;
	$( 'input[name=wind-units][value=' + DisplayWindUnit + ']' ).prop( 'checked', true );
}
const setDisplayTempUnits = ( units ) => {
	DisplayTempUnit = localStorage[ "DisplayTempUnit" ] = units;
	$( 'input[name=temp-units][value=' + DisplayTempUnit + ']' ).prop( 'checked', true );
}
const setMapRotation = ( deg ) => {
	MapRotation = localStorage[ "MapRotation" ] = Number( Func.toRadians( deg ) );
	OLView.setRotation( MapRotation );
}
const setSelectedPointOfIntrest = ( id ) => {
	SelectedPointOfIntrest = localStorage[ "SelectedPointOfIntrest" ] = id;
}
const setJumprun = ( data ) => {

	Jumprun = {
		direction: isNaN( parseInt( data.direction ) ) ? '' : Number(data.direction),
		greenlight: isNaN( parseInt( data.greenlight ) ) ? '' : Number(data.greenlight).toFixed(4),
		redlight: isNaN( parseInt( data.redlight ) ) ? '' : Number(data.redlight).toFixed(4),
		offset: isNaN( parseInt( data.offset ) ) ? '' : Number(data.offset).toFixed(4),
		separation: isNaN( parseInt( data.separation ) ) ? '' : Number(data.separation),
		timestamp: data.timestamp
	}


	var direction = Jumprun.direction || '--';
	var greenlight = Func.convert_distance_km( data.greenlight, DisplayDistUnit ) || '--'; //km to DisplayDistUnit
	var redlight = Func.convert_distance_km( data.redlight, DisplayDistUnit ) || '--'; //km to DisplayDistUnit
	var offset = Func.convert_distance_km( data.offset, DisplayDistUnit ) || '--'; //km to DisplayDistUnit
	var separation = data.separation || '--';
	var timestamp = new Date( +data.timestamp ).toLocaleString( ) || '--';

	$( '.jumprun-direction' ).html( `<i class="bi bi-compass fs-6"></i>&nbsp;${direction}°` );
	$( '.jumprun-greenlight' ).html( `<i class="bi bi-lightbulb" style="color:green;"></i>${greenlight}<span class="displaydistunit"></span>` );
	$( '.jumprun-redlight' ).html( `<i class="bi bi-lightbulb" style="color:red;"></i>${redlight}<span class="displaydistunit"></span>` );
	$( '.jumprun-offset' ).html( `<i class="bi bi-lightbulb"></i>${offset}<span class="displaydistunit"></span>` );
	$( '.jumprun-separation' ).html( Icons.separate + `${separation}<span class="displaytimeunit"></span>` );
	$( '.jumprun-timestamp' ).html( `Last updated:&nbsp;${timestamp}` );
	$( '.displayaltiunit' ).html( Func.get_unit_label( 'altitude', DisplayAltiUnit ) );
	$( '.displaydistunit' ).html( Func.get_unit_label( 'distance', DisplayDistUnit ) );
	$( '.displaytempunit' ).html( Func.get_unit_label( 'temperature', DisplayTempUnit ) );
	$( '.displayspdunit' ).html( Func.get_unit_label( 'windspeed', DisplayWindUnit ) );
	$( '.displaytimeunit' ).html( Func.get_unit_label( 'time', 's' ) );
	setJumprunSettings( );
	JUMPRUN.update( );
}
const setJumprunSettings = ( ) => {
	var direction = Jumprun.direction;

	var greenlight = Func.convert_distance_km( Jumprun.greenlight, DisplayDistUnit ); //km to DisplayDistUnit
	var redlight = Func.convert_distance_km( Jumprun.redlight, DisplayDistUnit ); //km to DisplayDistUnit
	var offset = Func.convert_distance_km( Jumprun.offset, DisplayDistUnit ); //km to DisplayDistUnit
	var separation = Jumprun.separation;

	$( '#jumprun-direction' ).val( direction );
	$( '#jumprun-greenlight' ).val( greenlight );
	$( '#jumprun-redlight' ).val( redlight );
	$( '#jumprun-offset' ).val( offset );
	$( '#jumprun-separation' ).val( separation );
}
const onChangeJumprunSettings = ( event ) => {
	clearInterval( FetchJumprunTimer );
	if ( event.target.id === 'jumprun-direction' ) {
		if ( event.target.value > 360 ) event.target.value = 15;
		if ( event.target.value < 0 ) event.target.value = 345;
	}
	//var direction = $( '#jumprun-direction' ).val( ) ? Number( $( '#jumprun-direction' ).val( ) ) : "";
	var greenlight = $( '#jumprun-greenlight' ).val( ) ? Func.convert_distance_to_km( $( '#jumprun-greenlight' ).val( ), DisplayDistUnit ) : ""; //DisplayDistUnit to km
	var redlight = $( '#jumprun-redlight' ).val( ) ? Func.convert_distance_to_km( $( '#jumprun-redlight' ).val( ), DisplayDistUnit ) : ""; //DisplayDistUnit to km
	var offset = $( '#jumprun-offset' ).val( ) ? Func.convert_distance_to_km( $( '#jumprun-offset' ).val( ), DisplayDistUnit ) : ""; //DisplayDistUnit to km
	var separation = $( '#jumprun-separation' ).val( ) ? Number( $( '#jumprun-separation' ).val( ) ) : "";
	var timestamp = Math.floor( Date.now( ) );
	var data = {};

	data.direction = $( '#jumprun-direction' ).val( );
	data.greenlight = greenlight;
	data.redlight = redlight;
	data.offset = offset;
	data.separation = separation;
	data.timestamp = timestamp;

	setJumprun( data )
}
const toggleDisplayUnits = ( event ) => {
	DisplayWindUnit = localStorage[ 'DisplayWindUnit' ] = $( 'input[name=wind-units]:checked' ).val( );
	DisplayTempUnit = localStorage[ 'DisplayTempUnit' ] = $( 'input[name=temp-units]:checked' ).val( );
	DisplayDistUnit = localStorage[ 'DisplayDistUnit' ] = $( 'input[name=dist-units]:checked' ).val( );
	DisplayAltiUnit = localStorage[ 'DisplayAltiUnit' ] = $( 'input[name=alti-units]:checked' ).val( );
	CompassCirclesCount = localStorage[ 'CompassCirclesCount' ] = Number( $( 'input[name=circlesCount]' ).val( ) );
	CompassCirclesBaseDistance = localStorage[ 'CompassCirclesBaseDistance' ] = Number( $( 'input[name=baseDistance]' ).val( ) );
	CompassCirclesInterval = localStorage[ 'CompassCirclesInterval' ] = Number( $( 'input[name=intervalDistance]' ).val( ) );
	DisplayWindType = localStorage[ 'DisplayWindType' ] = $( 'input[name=wind-type]:checked' ).val( );

	const distUnitLabel = Func.get_unit_label( 'distance', DisplayDistUnit );
	const tempUnitLabel = Func.get_unit_label( 'temperature', DisplayTempUnit );
	const spdUnitLabel = Func.get_unit_label( 'windspeed', DisplayWindUnit );
	const altiUnitLabel = Func.get_unit_label( 'altitude', DisplayAltiUnit );

	$( '.displaydistunit' ).html( distUnitLabel );
	$( '.displaytempunit' ).html( tempUnitLabel );
	$( '.displayspdunit' ).html( spdUnitLabel );
	$( '.displayaltiunit' ).html( altiUnitLabel );
	$( '.timeunit' ).html( 'sec' );

	toggleAltiChartControl( );
	toggleScaleLineControl( );
	updateWindTable( );
	setJumprunSettings( );
	setSettings( );

	COMPASS.update( );
	JUMPRUN.update( );
	WINDS.update( );
}
const onChangeFilterWinds = ( event ) => {
	var val = document.getElementsByName( 'selectedwinds' );
	var arr = [ ];
	for ( var i = 0; i < val.length; i++ ) {
		if ( val[ i ].checked ) {
			arr.push( val[ i ].value );
		}
	}
	if ( DisplayAltiUnit == 'metric' ) {
		FilterWindsMetric = localStorage[ 'FilterWindsMetric' ] = arr.toString( );
	} else {
		FilterWindsImperial = localStorage[ 'FilterWindsImperial' ] = arr.toString( );
	}
	WINDS.update( );
	updateWindTable( );
}
const setSettings = ( ) => {
	if ( DisplayWindType == 'raw' ) {
		$( '#displayWinds' ).hide( );
		return;
	} else {
		$( '#displayWinds' ).show( );
	}
	var altitudes = [ ];
	var filtered = [ ];

	if ( DisplayAltiUnit === 'metric' ) {
		altitudes = DefaultFilterWindsMetric.split( ',' );
		filtered = FilterWindsMetric.split( ',' );
	} else {
		altitudes = DefaultFilterWindsImperial.split( ',' );
		filtered = FilterWindsImperial.split( ',' );
	}

	var col = 0;
	var maxCol = 3;
	var table = document.createElement( 'table' );
	var html = '';
	for ( let i = 0; i < altitudes.length; i++ ) {
		col++;
		var altitude = altitudes[ i ];
		var checked = isInArray( altitude, filtered ) ? 'checked' : '';
		html += `<input class="form-check-input" name="selectedwinds" id="selected_${altitude}" type="checkbox" value="${altitude}" ${checked}>`;
		html += `&nbsp;<label for="selected_${altitude}" style="width:60px">${altitude}</label>`;
		if ( col == maxCol ) {
			col = 0;
			html += `<br>`;
		}
		$( '#displayWinds' ).html( html );
	}
	$( 'input[name=selectedwinds]' ).on( 'change', onChangeFilterWinds );
	$( 'input[name=wind-units][value=' + DisplayWindUnit + ']' ).prop( 'checked', true );
	$( 'input[name=temp-units][value=' + DisplayTempUnit + ']' ).prop( 'checked', true );
	$( 'input[name=dist-units][value=' + DisplayDistUnit + ']' ).prop( 'checked', true );
	$( 'input[name=alti-units][value=' + DisplayAltiUnit + ']' ).prop( 'checked', true );
	$( 'input[name=circlesCount]' ).prop( 'value', CompassCirclesCount );
	$( 'input[name=baseDistance]' ).prop( 'value', CompassCirclesBaseDistance );
	$( 'input[name=intervalDistance]' ).prop( 'value', CompassCirclesInterval );
	$( 'input[name=wind-type][value=' + DisplayWindType + ']' ).prop( 'checked', true );
};
const updateWindTable = ( ) => {
	var winds = [ ];
	var filterWinds = [ ];
	var windIsFound = false;
	if ( DisplayWindType == 'raw' && typeof Winds.raw !== 'undefined' ) {
		winds = Winds.raw;
		filterWinds = [ ];
	} else if ( DisplayWindType == 'int' ) {
		if ( DisplayAltiUnit == 'imperial' && typeof Winds.imperial !== 'undefined' ) {
			winds = Winds.imperial;
			filterWinds = FilterWindsImperial.split( ',' );
		} else if ( DisplayAltiUnit == 'metric' && typeof Winds.metric !== 'undefined' ) {
			winds = Winds.metric;
			filterWinds = FilterWindsMetric.split( ',' );
		}
	}
	if ( winds.length === 0 ) {
		return;
	}
	var winds_table = document.createElement( 'table' );
	winds_table.style.width = '100%';
	var table_body = document.createElement( 'tbody' );

	winds_table.appendChild( table_body );

	var row = winds_table.insertRow( 0 );
	var cell0 = row.insertCell( 0 );
	var cell1 = row.insertCell( 1 );
	var cell2 = row.insertCell( 2 );
	var cell3 = row.insertCell( 3 );
	var alt = 0;
	var curr = Winds.current_weather;
	var spd = Func.convert_windspeed( curr.windspeed, DisplayWindUnit );
	var tmp = Func.convert_temperature( curr.temperature, DisplayTempUnit );
	var stroke = '';
	var fill = Func.getAltitudeColor( alt );
	var svg = Func.svgPathToSvg( Icons.mountain, stroke, fill );
	cell0.innerHTML = svg + ' ' + alt.toFixed( ) + Func.get_unit_label( 'alt', DisplayAltiUnit );
	cell1.innerHTML = Icons.compass + ' ' + curr.winddirection + '°';
	cell2.innerHTML = '<i class="bi bi-wind icon-flipped fs-6"></i>' + ' ' + spd.toFixed( ) + Func.get_unit_label( 'windspeed', DisplayWindUnit );
	cell3.innerHTML = Icons.thermometer + ' ' + tmp.toFixed( ) + Func.get_unit_label( 'temperature', DisplayTempUnit );
	table_body.appendChild( row );
	var rowIndex = 1;
	winds.forEach( ( wind, index, array ) => {
		var isFound = false;
		filterWinds.forEach( ( elm ) => {
			if ( elm == wind.altitude ) {
				isFound = true;
			}
		} )
		if ( DisplayWindType == 'raw' ) {
			isFound = true;
		}
		if ( isFound ) {
			var row = winds_table.insertRow( rowIndex );
			var cell0 = row.insertCell( 0 );
			var cell1 = row.insertCell( 1 );
			var cell2 = row.insertCell( 2 );
			var cell3 = row.insertCell( 3 );
			var alt = wind.altitude;
			if ( DisplayWindType === 'raw' && DisplayAltiUnit === 'imperial' ) {
				alt = Func.convert_altitude( wind.altitude, DisplayAltiUnit );
			}
			var dir = wind.direction;
			var spd = Func.convert_windspeed( wind.speed, DisplayWindUnit );
			var tmp = Func.convert_temperature( wind.temperature, DisplayTempUnit );
			var stroke = '';

			if ( DisplayAltiUnit == 'imperial' ) {
				var fill = Func.getAltitudeColor( Func.convert_altitude( alt, 'metric' ) );
			} else {
				var fill = Func.getAltitudeColor( alt );
			}

			var svg = Func.svgPathToSvg( Icons.mountain, stroke, fill );
			cell0.innerHTML = svg + ' ' + alt.toFixed( ) + Func.get_unit_label( 'alt', DisplayAltiUnit );
			cell1.innerHTML = Icons.compass + ' ' + dir.toFixed( ) + '°';
			cell2.innerHTML = '<i class="bi bi-wind icon-flipped fs-6"></i>' + ' ' + spd.toFixed( ) + Func.get_unit_label( 'windspeed', DisplayWindUnit );
			cell3.innerHTML = Icons.thermometer + ' ' + tmp.toFixed( ) + Func.get_unit_label( 'temperature', DisplayTempUnit );
			table_body.appendChild( row );
			rowIndex++;
		}
	} );

	var qnh = `<i class="bi bi-speedometer2">&nbsp;</i>QNH: ${Winds.pressure_msl}`;
	var qfe = `<i class="bi bi-speedometer2">&nbsp;</i>QFE: ${Winds.surface_pressure}`;

	$( '.openmeteo-table' ).html( winds_table );
	$( '.qnh' ).html( qnh );
	$( '.qfe' ).html( qfe );
	$( '.openmeteo-valid' ).html( Winds.valid_time + Winds.timezone );
	$( '.openmeteo-cred' ).html( '<a href="https://open-meteo.com">open-meteo.com</a>' );
}
const initialize_map = ( ) => {
	const alticontrol = new AltitudeChartControl( DisplayAltiUnit, toggleDisplayUnits );
	OLMap = new Map( {
		target: "map",
		controls: defaultControls( ).extend( [
			alticontrol,
			new SideBarControl( false, toggleSidebarControl ),
			new Zoom( ),
			new Rotate( ),
			new Attribution( { collapsed: false } ),
			new ScaleLine( { units: DisplayDistUnit, bar: false, text: true } ),
			new MousePosition( {
				coordinateFormat: createStringXY( 4 ),
				projection: "EPSG:4326",
			} ),
		] ),
		loadTilesWhileAnimating: true,
		loadTilesWhileInteracting: true,
		view: new View( {
			extent: [ -20037508.34, -20048966.1, 20037508.34, 20048966.1 ],
			center: Proj.fromLonLat( [ CenterLon, CenterLat ] ),
			zoom: ZoomLvl,
			rotation: MapRotation
		} ),
	} );
	OLView = OLMap.getView( );
	AcLayers = SKYAWARE.CreateACLayers( );
	BaseLayers = CreateBaseLayerGroup( );
	BaseOverLayers = CreateOverLayerGroup( );
	PoiLayers = CreatePoiLayerGroup( );
	
	OLMap.addLayer( BaseLayers );
	OLMap.addLayer( BaseOverLayers );
	OLMap.addLayer( PoiLayers );
	
	let foundType = false;
	let baseCount = 0;

	setPoiLayers(PoiType);

	LayerSwitcher.forEachRecursive( BaseLayers, function ( lyr ) {
		if ( lyr instanceof LayerGroup ) {
			return;
		}
		baseCount++;
		if ( MapType === lyr.get( "name" ) ) {
			foundType = true;
			lyr.setVisible( true );
		} else {
			lyr.setVisible( false );
		}
		lyr.on( "change:visible", function ( evt, lyr, target ) {
			if ( evt.target.getVisible( ) ) {
				MapType = localStorage[ 'MapType' ] = evt.target.get( 'name' );
			}
		} );
	} );

	if ( !foundType ) {
		LayerSwitcher.forEachRecursive( BaseLayers, function ( lyr ) {
			if ( lyr instanceof LayerGroup || foundType ) {
				return;
			}
			lyr.setVisible( true );
			foundType = true;
		} )
	}

	LayerSwitcher.forEachRecursive( BaseOverLayers, function ( lyr ) {
		let visible = localStorage[ 'layer_' + lyr.get( 'name' ) ];
		baseCount++;
		if ( visible !== 'undefined' ) {
			lyr.setVisible( visible === "true" );
		}
		lyr.on( 'change:visible', function ( evt ) {
			localStorage[ 'layer_' + evt.target.get( 'name' ) ] = evt.target.getVisible( );
		} );
	} );

	const layerSwitcher = new LayerSwitcher( { tipLabel: 'Layers', activationMode: "click", groupSelectStyle: 'none' } );

	if ( baseCount > 0 ) {
		OLMap.addControl( layerSwitcher );
	}

	OLMap.once( "postrender", function ( evt ) { } );
	OLMap.on( "singleclick", function ( evt ) {
		let featureIsFound = false;
		let poi = evt.map.forEachFeatureAtPixel( evt.pixel, function ( feature, layer ) {
			const layername = layer.get( "name" );
			featureIsFound = true;
			return feature.get( 'id' );
		} );
		if ( poi ) {
			handlePOIClick( poi );
			evt.stopPropagation( );
		}

		var isInsideCompass = containsCoordinate( Extent, evt.coordinate );
		if ( !featureIsFound && SelectedPointOfIntrest === null ) {
			;
		}
		if ( !isInsideCompass && SelectedPointOfIntrest !== null ) {
			unsetPOI( );
		}
	} );
	OLMap.on( "pointermove", function ( evt ) {} );
	OLView.on( "change:center", function ( evt ) {
		let center = Proj.toLonLat( evt.target.getCenter( ), evt.target.getProjection( ) );
		localStorage[ 'CenterLon' ] = center[ 0 ];
		localStorage[ 'CenterLat' ] = center[ 1 ];
	} );
	OLView.on( "change:resolution", function ( evt ) {
		ZoomLvl = localStorage[ 'ZoomLvl' ] = evt.target.getZoom( );
	} );
	OLView.on( "change:rotation", function ( evt ) {
		MapRotation = localStorage[ 'MapRotation' ] = evt.target.getRotation( );
	} );
};
const selectPointOfIntrest = ( id ) => {
	if ( SelectedPointOfIntrest !== null ) {
		unsetPOI( id );
	}
	return getPointOfIntrest( id ).then( ( res ) => {
			setPOI( );
		} )
		.catch( ( err ) => {
			console.log( 'Error:', err );
		} );
}
const handlePOIClick = function ( id ) {
	if ( SelectedPointOfIntrest !== null ) {
		unsetPOI( id );
	}
	return getPointOfIntrest( id ).then( ( res ) => {
			setPOI( );
		} )
		.catch( ( err ) => {
			console.log( err );
		} );
};
const FetchJumprun = ( ) => {
	FetchJumprunTimer = setInterval( ( ) => {
		getJumprun( PointOfIntrest.id ).then( res => {
				setJumprun( res );
			} )
			.catch( ( err ) => {
				console.log( 'Could not get jumprun', err );
			} );
	}, 30000 );
	if ( PointOfIntrest.jumprun ) {
		setJumprun( PointOfIntrest.jumprun );
	}
}
const FetchWinds = ( ) => {
	FetchWindsTimer = setInterval( ( ) => {
		getWinds( PointOfIntrest.lonlat ).then( ( res ) => {
				Winds = res;
				WINDS.update( );
				updateWindTable( );
			} )
			.catch( ( err ) => {
				console.log( 'err:', err );
			} );
	}, 60000 );

	getWinds( PointOfIntrest.lonlat ).then( ( res ) => {
			Winds = res;
			WINDS.update( );
			updateWindTable( );
		} )
		.catch( ( err ) => {
			console.log( 'err:', err );
		} );
}
const setPOI = ( ) => {
	const poi = PointOfIntrest;
	const center = Proj.fromLonLat( poi.lonlat );
	$( '#poi-switcher' ).hide( );
	setPoiLayers( '' );
	COMPASS.update( );

	FetchWinds( );

	if ( !SelectedStation ) {
		setCumulus( poi.id );
	}

	if ( PointOfIntrest.type === 'dropzone' ) {
		FetchJumprun( );
	}

	var extent = createEmpty( );
	LayerSwitcher.forEachRecursive( BaseOverLayers, function ( lyr ) {
		let visible = localStorage[ 'layer_' + lyr.get( 'name' ) ];
		const src = lyr.getSource( );
		if ( lyr.get( 'name' ) == 'compass' || lyr.get( 'name' ) == 'jumprun' ) {
			extend( extent, src.getExtent( ) );
		}
		if ( visible !== undefined ) {
			lyr.setVisible( visible === "true" );
		}
		if ( lyr.get( 'name' ) == 'dropzones' || lyr.get( 'name' ) == 'stations' ) {
			lyr.setVisible( false );
		}
		lyr.on( 'change:visible', function ( evt ) {
			localStorage[ 'layer_' + evt.target.get( 'name' ) ] = evt.target.getVisible( );
		} )
	} )

	if ( DisplayZoomLvl === null ) {
		Extent = extent;
		OLView.fit( extent, { padding: [ 30, 30, 30, 30 ], rotation: MapRotation } );
	} else {
		OLView.setCenter( center );
		OLView.setZoom( DisplayZoomLvl );
	}
};
const unsetPOI = function ( evt ) {
	localStorage[ "SelectedPointOfIntrest" ] = SelectedPointOfIntrest = DefaultPointOfIntrest;
	clearInterval( FetchWindsTimer );
	clearInterval( FetchJumprunTimer );
	clearInterval( FetchCumulusTimer );
	PointOfIntrest = {};
	Winds = {};
	COMPASS.update( );
	WINDS.update( );
	updateWindTable( );
	setPoiLayers(PoiType);
	const jumprun = {
		direction: "",
		greenlight: "",
		redlight: "",
		offset: "",
		seperation: "",
		timestamp: ""
	}
	setJumprun( jumprun );
	LayerSwitcher.forEachRecursive( BaseOverLayers, function ( lyr ) {
		if ( lyr.get( 'name' ) == 'poi' ) {
			lyr.setVisible( true );
		}
	} )
};
const resetMap = ( ) => {
	localStorage[ 'CenterLat' ] = CenterLat = DefaultCenterLat;
	localStorage[ 'CenterLon' ] = CenterLon = DefaultCenterLon;
	localStorage[ "ZoomLvl" ] = ZoomLvl = DefaultZoomLvl;
	localStorage[ "DisplayZoomLvl" ] = DisplayZoomLvl = DefaultDisplayZoomLvl;
	localStorage[ "DisplayUnits" ] = DisplayUnits = DefaultDisplayUnits;
	localStorage[ "DisplayWindUnit" ] = DisplayWindUnit = DefaultDisplayWindUnit;
	localStorage[ "DisplayTempUnit" ] = DisplayTempUnit = DefaultDisplayTempUnit;
	localStorage[ "DisplayDistUnit" ] = DisplayDistUnit = DefaultDisplayDistUnit;
	localStorage[ "DisplayAltiUnit" ] = DisplayAltiUnit = DefaultDisplayAltiUnit;
	localStorage[ "MapType" ] = MapType = DefaultMapType;
	localStorage[ "MapRotation" ] = MapRotation = DefaultMapRotation;
	localStorage[ 'CompassCirclesCount' ] = CompassCirclesCount = DefaultCompassCirclesCount;
	localStorage[ 'CompassCirclesBaseDistance' ] = CompassCirclesBaseDistance = DefaultCompassCirclesBaseDistance;
	localStorage[ 'CompassCirclesInterval' ] = CompassCirclesInterval = DefaultCompassCirclesInterval;
	localStorage[ "DisplayWindType" ] = DisplayWindType = DefaultDisplayWindType;
	localStorage[ "DisplaySidebar" ] = DisplaySidebar = DefaultDisplaySidebar;
	localStorage[ "DisplaySelectedPanel" ] = DisplaySelectedPanel = DefaultDisplaySelectedPanel;
	localStorage[ "FilterWindsImperial" ] = FilterWindsImperial = DefaultFilterWindsImperial;
	localStorage[ "FilterWindsMetric" ] = FilterWindsMetric = DefaultFilterWindsMetric;
	localStorage[ "PoiType" ] = PoiType = DefaultPoiType;

	OLView.setRotation( MapRotation );

	var extent = null;

	OLMap.getAllLayers( ).forEach( ( lyr ) => {
		if ( lyr.get( 'name' ) == 'poi' ) {
			const src = lyr.getSource( );
			extent = src.getExtent( );
		}
	} );

	//OLView.fit( extent, { padding: [ 50, 50, 50, 50 ], duration: 300 } );

	toggleAltiChartControl( );
	unsetPOI( );
	setSettings( );
}
const toggleSidebarPanel = ( event ) => {
	$( '.sidebar-panel .panel' ).removeClass( 'active' );
	var displaySelectedPanel = null;
	if ( event ) {
		displaySelectedPanel = event.target.value;
	} else {
		displaySelectedPanel = DisplaySelectedPanel;
	}
	if ( displaySelectedPanel == 'winds' ) {
		$( '.sidebar-panel .winds-container' ).addClass( 'active' );
	} else if ( displaySelectedPanel == 'settings' ) {
		$( '.sidebar-panel .settings-container' ).addClass( 'active' );
	} else if ( displaySelectedPanel == 'jumprun' ) {
		$( '.sidebar-panel .jumprun-container' ).addClass( 'active' );
	}
	DisplaySelectedPanel = localStorage[ 'DisplaySelectedPanel' ] = displaySelectedPanel;
}
const toggleSidebarControl = ( event ) => {
	if ( event ) {
		$( ' .sidebar-panel ' ).toggleClass( "shown" );
	} else {
		$( ' .sidebar-panel ' ).toggleClass( "shown", DisplaySidebar == 'true' );
	}
	DisplaySidebar = localStorage[ 'DisplaySidebar' ] = $( ' .sidebar-panel ' ).hasClass( "shown" );
}
const toggleAltiChartControl = ( event ) => {
	if ( DisplayAltiUnit == 'metric' ) {
		$( '#altitude_chart_button' ).addClass( 'altitudeMeters' );
	} else {
		$( '#altitude_chart_button' ).removeClass( 'altitudeMeters' );
	}
}
const toggleScaleLineControl = ( visible ) => {
	if ( OLMap ) {
		OLMap.getControls( ).forEach( function ( control ) {
			if ( control instanceof ScaleLine ) {
				control.setUnits( DisplayDistUnit );
			}
		} );
	}
}
const toggleScaleLineVisibility = ( visible ) => {
	if ( visible ) {
		$( '.ol-scale-bar' ).removeClass( 'hidden' );
	} else {
		$( '.ol-scale-bar' ).addClass( 'hidden' );
	}
}
const togglePoiSwtcher = ( visible ) => {
	if ( visible ) {
		$( '#poi-switcher' ).removeClass( 'hidden' );
	} else {
		$( '#poi-switcher' ).addClass( 'hidden' );
	}
}

initialize( );
