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

export const CreateLayer = () => {
	JumprunFeatures = new Collection();
	var layer = new VectorLayer( {
		name: 'jumprun',
		title: 'Jumprun',
		type: 'overlay',
		visible: false,
		source: new VectorSource( {
			features: JumprunFeatures,

		} ),
		zIndex: 20,
	} )
	return layer;
}
const LineGeometry = () => {
	var direction = Jumprun.direction * Math.PI / 180;
	var distance = (CompassCirclesBaseDistance + (CompassCirclesInterval * (CompassCirclesCount-1))) * ConversionFactor;
	var offsetDirection = (Jumprun.direction + 90) * (Math.PI / 180);
	var offset = (Jumprun.offset*1000)//km to m;
	var center = Func.get_compass_point(LonLat, offset, offsetDirection);
	var point1 = Func.get_compass_point(center, -distance, direction );
	var point2 = Func.get_compass_point(center, distance, direction );
	var line = new LineString( [point1, point2] );
	line.transform('EPSG:4326', 'EPSG:3857');
	return line;
}
const LightsGeometry = (pos) => {
	if(typeof pos === 'undefined' || pos === ""){
		return null;
	}
   var direction = Jumprun.direction * Math.PI / 180;
   var distance = (pos*1000); //km to m
   var offset = (Jumprun.offset*1000); //km to m
   var offsetDirection = (Jumprun.direction + 90) * (Math.PI / 180);
   var center = Func.get_compass_point(LonLat, offset, offsetDirection );
   var point = Func.get_compass_point(center, distance, direction);
   return new Point(Proj.fromLonLat(point));
}
const CenterMarkerGeometry = () => {
	var offsetDirection = (Jumprun.direction + 90) * (Math.PI / 180);
	var offset = (Jumprun.offset*1000);//km to m
	var center = Func.get_compass_point(LonLat, offset, offsetDirection );
	var point = new Point(Proj.fromLonLat(center));
	return point;
}
const LineFeatures = () => {
	var feature = new Feature({geometry: LineGeometry(), name: 'line'});
	feature.setStyle( (feature, resolution) => {
		var distance = ( CompassCirclesBaseDistance + ( CompassCirclesInterval * ( CompassCirclesCount - 1 ) ) ) * ConversionFactor;
		var scaleFactor = ( ( ( distance/2000 ) / (resolution*PointResolution) ) * ZoomLvl )
		var styles = [];
		styles.push(
			new Style({
				stroke: new Stroke({color: 'purple', width: (2*scaleFactor)}),
				zIndex: 10,
			})
		);
		styles.push(
			new Style({
				geometry: () => {
					return LineGeometry()
				},
				stroke: new Stroke({color: 'white', width: (1*scaleFactor)}),
				zIndex: 20
			})
		);
		styles.push(
			new Style({
				geometry: () => {
					var geometry = CenterMarkerGeometry();
					return geometry;
				},
				image: new Icon({
					scale: (0.3*scaleFactor),
					src: Func.svgPathToURI( Icons.arrow2, 'purple', 'white', 3),
					rotation: Jumprun.direction * Math.PI / 180,
					rotateWithView: true
				}),
				zIndex: 30
			})
		);
		styles.push(
			new Style({
				geometry: (feature) => {
					var geometries = [];
					feature.getGeometry().forEachSegment((start, end)=>{
						geometries.push(new Point(start));
						geometries.push(new Point(end));
					});
					var geometryCollection = new GeometryCollection(geometries);
					return geometryCollection;
				},
				image: new Icon({
					scale: (0.3*scaleFactor),
					src: Func.svgPathToURI( Icons.arrow2, 'purple', 'white', 3),
					rotation: Jumprun.direction * Math.PI / 180,
					rotateWithView: true
				}),
				zIndex: 40
			})
		);
		styles.push(
			new Style({
				geometry: (feature) => {
					var lights = LightsGeometry(Jumprun.greenlight);
					return  lights;
				},
				image: new Icon( {
					scale: (0.8*scaleFactor),
					src: Func.svgPathToURI( Icons.circle, 'black', 'lightgreen' ),
				} ),
				text: new Text( {
					font: '5px Helvetica Neue, sans-serif',
					text: Func.convert_distance_km( Number(Jumprun.greenlight).toFixed(2), DisplayDistUnit) + Func.get_unit_label('distance', DisplayDistUnit),
					fill: new Fill( {
						color: '#FFFFFF',
					} ),
					scale: scaleFactor,
					textAlign:'left',
					offsetX: 4*scaleFactor,
					stroke: new Stroke( {
						color: '#000000',
						width: 1,
					} ),
				} ),
				zIndex: 40
			})
		);

		styles.push(
			new Style({
				geometry: (feature) => {
					var lights = LightsGeometry(Jumprun.redlight);
					return  lights;
				},
				image: new Icon( {
					scale: (0.8*scaleFactor),
					src: Func.svgPathToURI( Icons.circle, 'black', 'red' ),
				} ),
				text: new Text( {
					font: '5px Helvetica Neue, sans-serif',
					text: Func.convert_distance_km( Number(Jumprun.redlight).toFixed(2), DisplayDistUnit) + Func.get_unit_label('distance', DisplayDistUnit),
					fill: new Fill( {
						color: '#FFFFFF',
					} ),
					scale: scaleFactor,
					textAlign:'left',
					offsetX: 4*scaleFactor,
					stroke: new Stroke( {
						color: '#000000',
						width: 1,
					} ),
				} ),
				zIndex: 40
			})
		);
		return styles;
	})
	JumprunFeatures.push(feature);
}

const CreateFeatures = () => {
	JumprunFeatures.clear();
	if(typeof Jumprun.direction === 'undefined' || Jumprun.direction === "" ){
		return;
	}
	LonLat = PointOfIntrest.lonlat;
	CenterPoint = new Point( Proj.fromLonLat( LonLat ) );
	ConversionFactor = Func.GetConversionFactor(DisplayDistUnit);
	PointResolution = Proj.getPointResolution(OLView.getProjection(), 1, Proj.fromLonLat( LonLat ), 'm');
	LineFeatures();
}

export const update = (jumprun) => {
	CreateFeatures();
}
