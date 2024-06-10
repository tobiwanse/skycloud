import {Circle as CircleStyle, Fill, Stroke, Text, Style, Icon} from 'ol/style';
import {Point, Circle, LineString} from 'ol/geom';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import Graticule from "ol/layer/Graticule";
import Layer from 'ol/layer/Layer';
import LayerTile from 'ol/layer/Tile';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import SourceXYZ from 'ol/source/XYZ';
import SourceOSM from 'ol/source/OSM';
import SourceStamen from 'ol/source/Stamen';
import SourceBing from 'ol/source/BingMaps';
import GeoJSON from 'ol/format/GeoJSON';
import LfvSeGeoJson from "../geojson/lfvse.json";
import * as Proj from "ol/proj";
import * as COMPASS from './compass';
import * as JUMPRUN from './jumprun';
import * as WINDS from './winds';
import * as POI from './poi';
import * as AIRCRAFT from './aircraft';

BaseLayerCollection = new Collection();
OverLayerCollection = new Collection();
PoiLayerCollection = new Collection();
AircraftLayerCollection = new Collection();

export const CreateBaseLayerGroup = ( map ) => {
	BaseLayerCollection.push(CreateOsmLayer());
	BaseLayerCollection.push(CreateArcGisLayer());
	CreateGoogleMapsLayers();

	const group = new LayerGroup({
		name: 'worldmaps',
		title: 'World Maps',
		fold: 'open',
		layers: BaseLayerCollection
	})

	return group;
};
export const CreateOverLayerGroup = () => {
	OverLayerCollection.push(CreateGraticuleLayer());
	OverLayerCollection.push(COMPASS.CreateLayer());
	OverLayerCollection.push(JUMPRUN.CreateLayer());
	OverLayerCollection.push(WINDS.CreateLayer());
	//OverLayerCollection.push(AIRCRAFT.CreateLayer());
	
	const layer = new LayerGroup({
		name: 'overlays',
		title: 'Overlays',
		fold: 'open',
		layers: OverLayerCollection,
	});
	return layer;
};
export const CreatePoiLayerGroup = () => {
	PoiLayerCollection.push(POI.CreateLayer('dropzones', 'Dropzones', 'dropzone', true));
	PoiLayerCollection.push(POI.CreateLayer('stations', 'Stations', 'cumulus', true));
	const layer = new LayerGroup({
		//name: 'poi',
		//title: 'Point of intrests',
		//fold: 'open',
		layers: PoiLayerCollection
	} );
	return layer;
}
const CreateGoogleMapsLayers = ( map ) => {
	const layers = [];
	const gMaps = [
		{id:'m', title:'Google Roadmap', name:'roadmap'},
		{id:'y', title:'Google Hybrid', name:'hybrid'}
	];
	for(let i = 0; i<gMaps.length; i++){
		BaseLayerCollection.push(CreateGMapLayer(gMaps[i]));
	}
}
const CreateGMapLayer = function(mapType){
	return new LayerTile({
		name: mapType.name,
		title: mapType.title,
		type: 'base',
		visible: false,
		source: new SourceXYZ({
			url: 'http://mt0.google.com/vt/lyrs='+mapType.id+'&hl=en&x={x}&y={y}&z={z}',
			attributions: 'Tiles © <a href="https://maps.google.com">2023 google</a>',
			attributionsCollapsible: false
		})
	});
}
const CreateArcGisLayer = function(){
	return new LayerTile({
		name: 'arcgis',
		title: 'ArcGIS World Imagery',
		type: 'base',
		visible: false,
		source: new SourceXYZ({
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
			attributionsCollapsible: false
		})
	});
}
const CreateOsmLayer = function(){
	return new LayerTile({
		name: 'osm',
		title: 'Openstreetmap',
		type: 'base',
		visible: false,
		source: new SourceOSM({
			attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
			attributionsCollapsible: false
		})
	});
}
const CreateLfvGeoJsonLayer = function(map){
	const geojson = new GeoJSON({
		dataProjection: 'EPSG:4326',
		featureProjection: 'EPSG:3857'
	}).readFeatures(LfvSeGeoJson);

	return new VectorLayer({
		name: 'lfv',
		title: 'LFV SE',
		type: 'overlay',
		visible: true,
		source: new VectorSource({
			features: geojson
		}),
		style: function(feature){
			return new Style({
				fill: new Fill({
					color : "rgba(252, 186, 3, 0.3)"
				}),
				stroke: new Stroke({
					color: "rgba(252, 186, 3, 1)",
					width: 1
				}),
				text: new Text({
					text: feature.get("name"),
					scale: 1.5,
					overflow: false,
					fill: new Fill({
						color: '#000000'
					}),
					stroke: new Stroke({
						color: '#FFFFFF',
						width: 2
					})
				})
			})
		}
	})
}
const LfvGeoJsonLayerHoverStyle = function(feature){
	return new Style({
		fill: new Fill({
			color : "rgba(252, 186, 3, 0.3)"
		}),
		stroke: new Stroke({
			color: "#FFFFFF",
			width: 3
		}),
		text: new Text({
			text: feature.get("name"),
			scale: 1.35,
			overflow: false,
			fill: new Fill({
				color: '#000000'
			}),
			stroke: new Stroke({
				color: '#FFFFFF',
				width: 2
			})
		}),
		zIndex:10
	})
}
const CreateGraticuleLayer = function(){
	return new Graticule({
		name: "graticule",
		title: "Graticule",
		type: 'overlay',
		visible: false,
		strokeStyle: new Stroke({
			color: 'rgba(255,120,0,0.9)',
			width: 2,
			lineDash: [0.5, 4],
		}),
		showLabels: true,
		wrapX: false,
	});
}
export const CreateWindMarker = (lonlat) => {
	const feature = new Feature({geometry: new Point(Proj.fromLonLat(lonlat)), name: 'windmarkers'});

	feature.setStyle(new Style({
			image: new CircleStyle({
				radius: 5,
				snapToPixel: false,
				fill: new Fill({
					color: 'black'
				}),
				stroke: new Stroke({
					color: 'white',
					width: 1
				})
			})
		}))
	const layer = new VectorLayer({
		name: 'windpoint',
		title: 'Point Of Wind',
		type: 'overlay',
		visible: false,
		source: new VectorSource({
			features: [feature]
		})
	});
	 OLMap.addLayer(layer);
}
// export const CreatePOIMarkers = function (markers) {
// 	const features = [];
// 	POIMarkersFeatures = new Collection();
// 	markers.forEach( (marker, index) => {
// 		const feature = new Feature({geometry: new Point(Proj.fromLonLat(marker.lonlat)), name: 'markers'});
// 		console.log(marker);
// 		feature.setStyle((feature, resolution) => {
// 			return new Style({
// 				image: new CircleStyle({
// 					radius: 5,
// 					snapToPixel: false,
// 					fill: new Fill({
// 						color: 'black'
// 					}),
// 					stroke: new Stroke({
// 						color: 'white',
// 						width: 1
// 					})
// 				}),
// 				text: new Text({
// 					text: marker.title,
// 					scale: 1.5,
// 					overflow: false,
// 					fill: new Fill({
// 						color: '#000000'
// 					}),
// 					stroke: new Stroke({
// 						color: '#FFFFFF',
// 						width: 2
// 					})
// 				})
// 			})
// 		});
// 		POIMarkersFeatures.push(feature);
// 	})
// 	const layer = new VectorLayer({
// 		name: 'pointofintrests',
// 		title: 'Point Of Intrests',
// 		type: 'overlay',
// 		visible: false,
// 		source: new VectorSource({
// 			features: POIMarkersFeatures
// 		})
// 	});
//
// 	return new LayerGroup({
// 		name: 'markers',
// 		title: 'Markers',
// 		type: 'overlay',
// 		layers: layer
// 	});
//
// }

function transform() {
	//EX: [68.17665, 7.96553, 97.40256, 35.49401]
	return Proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}
