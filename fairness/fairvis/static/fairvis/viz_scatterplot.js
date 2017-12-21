// Scatter plot 
// create the scatter plot and attach to the DOM 

var dataPoints = JSON.parse(json);
var paramIndex = 1;

var scatter_plot = new c3.Plot({
	anchor: '#scatter_plot',
	height: 300, 
	width:'50%', 
	// TODO: change the scales to actual scale  
	h: d3.scale.linear().domain([0, 1000]), 
	v: d3.scale.linear().domain([0, 1000]), 
	// margin and disable cropping 
	margins: 10, 
	crop_margins: false, 

	// add axes and labels
	axes : [
		new c3.Axis.X({
			grid: true, 
			label: "param"
		}), 

		new c3.Axis.Y({
			grid: true, 
			label: "score", 
			// tick_values: []
			// option: create a quantize scale to translate numeric to groups/buckets 
			/*
			tick_label: d3.scale.quantize()
				.domain([0, 1000])
				.range(['high', 'med', 'low'])
			*/ 
		}),
	]

	// set up the plot
	
	layers: [
		new c3.Plot.Layer.Scatter({
			// bind with a param
			data: json,
			// TODO: change index
			x: function (index) { return dataFile[index][paramIndex]; }
			y: function (index) { return linregPredictions[index]; }
			// set radius of all dots to be 10 
			r: 10, 
			// TODO? filter:
			point_options: {
				animate: true, 
				duration: 1000
			}, 
			// labels
			label_options: {
				text: function (index) { return x(index); }, 
				styles: {
					// TODO: set different color for different groups 
					// 'fill': function (student) {}, 
					'font-size': "x-small"
				}
			}, 
			circle_options: {
				// TODO: set different classes/styles for different groups
				classes: {

				}. 

				styles: {

				}, 

				// add events to 1) expand the circle size when hovered over 
				// 2) display info for that data point
				events: {
					// TODO 
				}
			}

		})
	]
	
	
});