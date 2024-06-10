
import Highcharts from 'highcharts';
import exporting from 'highcharts/modules/exporting';
import windbarb from 'highcharts/modules/windbarb';
import accessibility from 'highcharts/modules/accessibility';
//import stock from 'highcharts/modules/stock';
exporting(Highcharts)
windbarb(Highcharts)
accessibility(Highcharts);
//stock(Highcharts);

function WindChart(container) {
	this.container = container || null;
	this.speed = [];
	this.gusts = [];
	this.bearing = [];
	this.container = container;
	this.createChart();
}

WindChart.prototype.getConfig = function(){
	var self = this;
	return {
		chart: {
			renderTo: this.container,
			zoomType: 'x',
			plotBorderWidth: 1,
			events: {
				redraw: function () {
					self.onChartLoad(self.chart);
				}
			}
		},
		title: {
			text: 'Winds For FKAros',
			align: 'left',
			textAlign: 'high',
			marginLeft: 30,
			x: 10,
		},
		credits: {
			enabled: true,
			text: 'FKAROS local station',
			href: '',
			position: {
				x: -40
			}
		},
		tooltip: {
			style:{
				 opacity: 0.8,
			},
			useHTML: true,
			shared: true,
		},
		plotOptions: {
			series: {
				pointPlacement: 'between',
				marker: {
					enabled: false,
				},
			},
			windbarb:{
				pointPlacement: 'between',
			}
		},
		legend: {
			align: 'right',
			verticalAlign: 'top',
			backgroundColor: null,
			minPadding: 0,
			maxPadding: 0,
			x: -40,
			y: -40,
		},
		xAxis: [{
			type: 'datetime',
			offset: 30,
			gridLineWidth: 1,
			startOnTick: false,
			endOnTick: false,
			minPadding: 0,
			maxPadding: 0,
			crosshair: true,
		}],
		yAxis: [{
			title: {
				text: null
			},
			labels: {
				style: {
					fontSize: '10px'
				},
				x: 0,
			},
			tickInterval: 1,
			tickLength: 0,
			gridLineWidth: 1,
			gridLineColor: 'rgba(128, 128, 128, 0.1)',
			min: 0,
		},{
			linkedTo: 0,
			opposite: true,
			title: {
				text: null
			},
			labels: {
				style: {
					fontSize: '10px'
				},
				x: 0,
			},
		}],
		series: [{
			type: 'line',
			name: 'Speed',
			tooltip: {
				valueSuffix: ' m/s',
			}
		},{
			type: 'line',
			name: 'Gust',
			color: Highcharts.getOptions().colors[2],
			tooltip: {
				valueSuffix: ' m/s',
			}
		},{
			name: 'Wind',
			type: 'windbarb',
			id: 'wbarb',
			turboThreshold: 0,
			color: Highcharts.getOptions().colors[1],
			lineWidth: 1.5,
			yOffset: -15,
			showInLegend: false,
			enabled: false,
			tooltip: {
				pointFormat: '<span style="color:{point.color}">●</span> {series.name}: <b>{point.value} m/s</b> ({point.direction}&deg;)<br/',
			}
		}]
	}
};

WindChart.prototype.drawBlocksForWindArrows = function (chart) {

	chart.get('wbarb').markerGroup.attr({
		translateX: chart.get('wbarb').markerGroup.translateX + 2
	});
};

WindChart.prototype.onChartLoad = function (chart) {
	this.drawBlocksForWindArrows(chart);
};

WindChart.prototype.createChart = function () {
	this.chart = new Highcharts.Chart(this.getConfig(), chart => {
		this.onChartLoad(chart);
	});
};

WindChart.prototype.parseData = function (data) {
	this.speed = data.wspeed;
	this.gusts = data.wgust;
	this.bearing = [];

	for(var i = 0; i < this.speed.length; i++ ) {
		if(i % 3 === 0 ){
			this.bearing.push([ data.bearing[i][0], data.wspeed[i][1], data.bearing[i][1] ]);
		}
	}
	return this.bearing;
}

 WindChart.prototype.update = function (data) {
	if(typeof data.wspeed === 'undefined'){
		return;
	}
	var max = data.wspeed[data.wspeed.length -1][0];
	var min = max - 3600*1000*2;
	const wbarb = this.parseData(data);
		
	this.chart.xAxis[0].update({
		min: min,
		max: max
	});
	
	this.chart.series[0].setData( this.speed );
	this.chart.series[1].setData( this.gusts );
	this.chart.series[2].setData( wbarb );
}

export const WChart = WindChart;

