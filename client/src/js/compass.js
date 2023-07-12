import {circular} from 'ol/geom/Polygon';
import { Circle as CircleStyle, Fill, Stroke, Text, Style, Icon } from 'ol/style';
import { Point, Circle, LineString, GeometryCollection } from 'ol/geom';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import * as Proj from "ol/proj";
import LayerTile from 'ol/layer/Tile';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import * as Func from './functions';

var points = [360,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240,255,270,285,300,315,330,345];
var Points = null;
var LonLat = null;
var CenterPoint = null;
var PointResolution = null;
var ConversionFactor = null;

export const CreateLayer = function () {
	CompassFeatures = new Collection( );
	var layer = new VectorLayer( {
		name: 'compass',
		type: 'overlay',
		title: 'Compass',
		visible: false,
		source: new VectorSource( {
			features: CompassFeatures,
		} ),
		zIndex: 10,
	} )
	return layer;
}

const CircleFeatures = function ( ) {
	for ( var i = 0; i < CompassCirclesCount; ++i ) {
		var distance = ( CompassCirclesBaseDistance + ( CompassCirclesInterval * i ) ) * ConversionFactor;
		var circle = Func.make_geodesic_circle( LonLat, distance, 360 );
		circle.transform( 'EPSG:4326', 'EPSG:3857' );
		var feature = new Feature( {
			geometry: circle,
			distance: distance,
			name: 'compasscircle'
		} );
		feature.setStyle( ( feature, resolution ) => {
			return [
				new Style({
					stroke: new Stroke( {
						color: '#000',
						width: 3
					} )
				}),
				new Style({
					stroke: new Stroke( {
						color: '#FFF',
						width: 2
					} )
				})
			]
		})
		CompassFeatures.push( feature );
		var rotation = 330 * Math.PI / 180;
		var point = Func.get_compass_point( LonLat, distance, rotation );
		var feature = new Feature( {
			geometry: new Point( Proj.fromLonLat( point ) ),
			name: 'compassdistance',
			text: Func.format_distance_long( distance, DisplayDistUnit, 1 ),
			size: 5,
			rotation: rotation
		} );
		feature.setStyle( ( feature, resolution ) => {
			var scaleFactor = ( ( ( distance/2000 ) / (resolution*PointResolution) ) * ZoomLvl )
			return new Style( {
				text: new Text( {
					font: feature.get( 'size' ) + 'px Helvetica Neue, sans-serif',
					text: feature.get( 'text' ),
					fill: new Fill( {
						color: '#FFFFFF',
					} ),
					scale: scaleFactor,
					textBaseline: 'bottom',
					rotation: 360 * Math.PI / 180,
					stroke: new Stroke( {
						color: '#000000',
						width: 1,
					} ),
				} )
			} )
		} );
		CompassFeatures.push( feature );
	}
}

const OuterDialsFeatures = function ( ) {
	var distance = ( CompassCirclesBaseDistance + ( CompassCirclesInterval * ( CompassCirclesCount - 1 ) ) ) * ConversionFactor;
	var points = [ 360, 45, 90, 135, 180, 225, 270, 315 ];
	var text = [ "N", "NE", "E", "SE", "S", "SW", "W", "NW" ];
	for ( var i = 0; i < points.length; i++ ) {
		var rotation = points[ i ] * Math.PI / 180;
		var point = Func.get_compass_point( LonLat, distance, rotation );
		var val = Math.floor( ( points[ i ] / 45 ) );
		var feature = new Feature( {
			geometry: new Point( Proj.fromLonLat( point ) ),
			name: 'compasspoint',
			text: text[ ( val % 8 ) ],
			size: 10,
			rotation: rotation
		} );

		feature.setStyle( ( feature, resolution ) =>{
			var scaleFactor = ( ( distance/2000 ) / (resolution*PointResolution) ) * ZoomLvl
			return new Style( {
				text: new Text( {
					font: feature.get( 'size' ) + 'px Helvetica Neue, sans-serif',
					text: feature.get( 'text' ),
					rotateWithView: true,
					overflow: false,
					fill: new Fill( {
						color: '#FFFFFF',
					} ),
					scale: (scaleFactor),
					offsetY: -(feature.get( 'size' )*scaleFactor),
					rotation: feature.get( 'rotation' ),
					stroke: new Stroke( {
						color: '#000000',
						width: 1,
					} ),
				} )
			} )
		} );
		CompassFeatures.push( feature );
	}
}

const InnerDialsFeatures = function ( ) {
	var distance = ( CompassCirclesBaseDistance + ( CompassCirclesInterval * ( CompassCirclesCount - 1 ) ) ) * ConversionFactor;
	for ( var i = 0; i < points.length; i++ ) {
		var rotation = points[ i ] * Math.PI / 180;
		var point = Func.get_compass_point( LonLat, distance, rotation );
		var feature = new Feature( {
			geometry: new Point( Proj.fromLonLat( point ) ),
			name: 'compasspoint',
			size: 10,
			text: points[ i ],
			rotation: rotation,
		} );
		feature.setStyle( ( feature, resolution ) => {
			var scaleFactor = ( ( ( distance/2000 ) / (resolution*PointResolution) ) * ZoomLvl )
			return new Style( {
				text: new Text( {
					font: feature.get( 'size' ) + 'px Helvetica Neue, sans-serif',
					text: feature.get( 'text' ) + '\xB0',
					rotateWithView: true,
					fill: new Fill( {
						color: '#FFFFFF',
					} ),
					scale: scaleFactor,
					offsetY: (feature.get( 'size' )*scaleFactor),
					rotation: feature.get( 'rotation' ),
					stroke: new Stroke( {
						color: '#000000',
						width: 1,
					} ),
				} )
			} )
		} )
		CompassFeatures.push( feature );
	}
}

const CenterMarkerFeatures = function ( ) {
	var feature = new Feature( CenterPoint );
	feature.setStyle( ( feature, resolution ) => {
		return new Style( {
			image: new CircleStyle( {
				radius: 3,
				snapToPixel: false,
				fill: new Fill( { color: 'black' } ),
				stroke: new Stroke( { color: 'white', width: 1 } )
			} ),
		} )
	} );
	CompassFeatures.push( feature );
}
export const update = () => {
	CreateFeatures();
}
const CreateFeatures = function ( ) {
	CompassFeatures.clear( );

	if(typeof PointOfIntrest.lonlat === 'undefined'){
		return;
	}

	LonLat = PointOfIntrest.lonlat;
	CenterPoint = new Point( Proj.fromLonLat( LonLat ) );
	ConversionFactor = Func.GetConversionFactor(DisplayDistUnit);
	PointResolution = Proj.getPointResolution(
		OLView.getProjection(),
		1,
		Proj.fromLonLat( LonLat ),
		'm'
	);
	CircleFeatures( );
	InnerDialsFeatures( );
	OuterDialsFeatures( );
}
