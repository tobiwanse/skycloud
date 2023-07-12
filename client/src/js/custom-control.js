import { Control } from 'ol/control.js';

export class SideBarControl extends Control {
	/**
	 * @param {Object} [opt_options] Control options.
	 */
	constructor ( opt_options, callback ) {
		const options = opt_options || {};
		const button = document.createElement( 'button' );
		button.id = "sidebar-control-button";
		const element = document.createElement( 'div' );
		element.className = 'sidebar-control ol-unselectable ol-control';
		element.appendChild( button );
		super( {
			element: element,
			target: options.target,
		} );
		button.addEventListener( 'click', callback, false );
	}
}

export class AltitudeChartControl extends Control {
	constructor ( unit, callback ) {
		const button = document.createElement( 'button' );
		button.id = "altitude_chart_button";
		if ( unit == 'metric' ) {
			button.className = 'altitudeMeters';
		}
		const element = document.createElement( 'div' );
		element.id = 'altitude_chart';
		element.className = 'altitudeFeet ol-unselectable ol-control';
		element.appendChild( button );
		super( {
			element: element,
		} );
		button.addEventListener( 'click', this.toggleAltitudeChart.bind( this ), false );
	}
	toggleAltitudeChart (callback) {
		var val = null;
		if ( DisplayAltiUnit == 'metric' ) {
			val = 'imperial';
		} else {
			val = 'metric';
		}
		DisplayAltiUnit = val;
		$('input[name=alti-units][value='+val+']').prop('checked', true);
		$( 'input[name=alti-units]' ).trigger( 'change' );
	}
}
