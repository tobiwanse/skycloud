import { Circle as CircleStyle, Fill, Stroke, Text, Style, Icon, RegularShape } from 'ol/style';
import { Point, Circle, LineString } from 'ol/geom';
import GeometryCollection from 'ol/geom/GeometryCollection';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import * as Proj from "ol/proj";
import LayerTile from 'ol/layer/Tile';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import * as Func from './functions';

var LonLat = null;
var CenterPoint = null;
var PointResolution = null;
var ConversionFactor = null;

export const CreateLayer = ( data ) => {
	WindsFeatures = new Collection( );
	var layer = new VectorLayer( {
		name: 'winds',
		title: 'Winds',
		type: 'overlay',
		visible: false,
		source: new VectorSource( {
			features: WindsFeatures,
		} ),
		zIndex: 0,
	} )
	return layer;
}

const ArrowGeometry = ( dir, index ) => {
	var distance = ( CompassCirclesBaseDistance + ( CompassCirclesInterval * ( CompassCirclesCount - 1 ) ) ) * ConversionFactor;
	var point = Func.get_compass_point( LonLat, distance+(index*200/19), dir * Math.PI / 180 );
	var geometry = new Point( Proj.fromLonLat( point ) );
	return geometry;
}

const style = (wind, index, feature, resolution) => {
	var distance = ( CompassCirclesBaseDistance + ( CompassCirclesInterval * ( CompassCirclesCount - 1 ) ) ) * ConversionFactor;
	var scaleFactor = ( ( ( (distance/5000) ) / (resolution*PointResolution) ) * ZoomLvl )
	var alt = wind.altitude;
	if (DisplayAltiUnit === "imperial" && DisplayWindType !== 'raw') {
		alt = wind.altitude / 3.2808;  // feet to meters
	}
	var stroke = '#000';
	var fill = Func.getAltitudeColor(alt);
	var stroke_width = 1;
	return new Style( {
		image: new Icon( {
			scale: ((1.8)*scaleFactor),
			rotateWithView: true,
			src: Func.svgPathToURI( Icons.arrow2, stroke, fill, stroke_width ),
			rotation: (wind.direction-180) * Math.PI / 180,
			opacity: 1,
			zIndex: 0,
		} ),
		zIndex: 0,
	} );
}

const ArrowFeatures = () => {
	if(typeof Winds.raw === 'undefined'){
		return;
	}
	var winds = [];
	var filterWinds = [];
	if (DisplayWindType == 'raw') {
		winds = Winds.raw;
		filterWinds = [];
	} else if (DisplayWindType == 'int') {
		if(DisplayAltiUnit == 'imperial'){
			winds = Winds.imperial;
			filterWinds = FilterWindsImperial.split(',');
		}else if(DisplayAltiUnit == 'metric'){
			winds = Winds.metric;
			filterWinds = FilterWindsMetric.split(',');
		}
	}

	var i = 0;

	winds.forEach( ( element, index ) => {
		var isFound = false;
		filterWinds.forEach((elm) =>{
			if(elm == element.altitude){
				isFound = true;
			}
		})
		if(DisplayWindType == 'raw'){
			isFound = true
		}

		if(isFound){
			const feature = new Feature( {geometry: ArrowGeometry( element.direction, i ), wind: element, id:i });
			i++;
			feature.setStyle( (feature, resolution) => {
				return style( element, i, feature, resolution );
			} );

			WindsFeatures.push( feature );
		}
	});
}

export const update = () => {
	CreateFeatures();
}

const CreateFeatures = ( ) => {
	WindsFeatures.clear( );
	if(typeof PointOfIntrest.lonlat === 'undefined'){
		return;
	}

	LonLat = PointOfIntrest.lonlat;
	CenterPoint = new Point( Proj.fromLonLat( LonLat ) );
	ConversionFactor = Func.GetConversionFactor(DisplayDistUnit);
	PointResolution = Proj.getPointResolution(OLView.getProjection(), 1, Proj.fromLonLat( LonLat ), 'm');
	ArrowFeatures( );
}
