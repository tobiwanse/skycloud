import {Circle as CircleStyle, Fill, Stroke, Text, Style, Icon} from 'ol/style';
import { createEmpty, containsCoordinate, extend, getHeight, getWidth } from 'ol/extent';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Point, Circle, LineString} from 'ol/geom';
import  * as Proj from "ol/proj";
import * as Func from './functions';

var FeatureCollection = {};
var layer = {};
var extent = null;
export const CreateLayer = function (name, title, type, visible) {
	let featureCollection = CreateFeature(type);
	layer[type] = new VectorLayer( {
		name: name,
		title: title,
		visible: visible,
		source: new VectorSource( {
			features: featureCollection,
		} ),
		zIndex:10,
	})
	return layer[type];
}
export const getLayer = (type) => {
	return layer[type];
}
export const getExtent = () => {
	return extent;
}
export const setVisible = (visible) => {
	layer.setVisible(visible);
}
const PointGeometry = (index) => {
	return new Point(Proj.fromLonLat(PointsOfIntrest[index].lonlat))
}
const style = (index, element) => {
	let icon = null;
	switch (element.type) {
		case 'dropzone':
			icon = Icons.parachute;
			break;
		case 'station':
			icon = Icons.station;
		default:
			icon = Icons.standard;
	}
	return new Style({
		image: new Icon( {
			src: Func.svgPathToURI( icon ),
		} ),
		text: new Text( {
			font: '10px Helvetica Neue, sans-serif',
			text: element.title,
			offsetY: 24,
			fill: new Fill( {
				color: '#FFFFFF',
			} ),
			stroke: new Stroke( {
				color: '#000000',
				width: 1,
			} ),
		} )
	})
}
const DropPin = (type = 'droped') => {
	layer[type] = new VectorLayer( {
		name: name,
		title: title,
		visible: visible,
		source: new VectorSource( {
			features: featureCollection,
		} ),
		zIndex:10,
	} )
	return layer[type];

	// let featureCollection = new Collection();
	// const feature = new Feature({ geometry: PointGeometry(index), id: element.id });
	// feature.setStyle( (feature, resolution) => {
	// 	return style(index, element);
	// });
	// featureCollection.push(feature);
}
const CreateFeature = (type) => {
	let featureCollection = new Collection();
	PointsOfIntrest.forEach( (element, index, array) => {
		if(type !== element.type){
			return;
		}
		const geometry = PointGeometry(index);
		const feature = new Feature({ geometry: geometry, id: element.id });
		feature.setStyle( (feature, resolution) => {
			return style(index, element);
		});
		featureCollection.push(feature);
	});
	return featureCollection;
}

