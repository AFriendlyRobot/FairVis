// Scatter plot 
// create the scatter plot and attach to the DOM 

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
	],

	// set up the plot
	
	layers: [
		new c3.Plot.Layer.Scatter({
			// bind with a param
			data: json,
			// TODO: change index
			x: function (index) { return dataFile[index][paramIndex]; },
			y: function (index) { return linregPredictions[index]; },
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

				},

				styles: {

				}, 

				// add events to 1) expand the circle size when hovered over 
				// 2) display info for that data point
				events: {
					// TODO 
				}
			}
		}),

		new c3.Plot.Layer.Line.Horizontal ({
			data: [], 
			// assign the layer with the corresponding CSS class "average-score"
			class: 'average-score', 
			label_options: {
				text: function (score) { return "avg prediction score: " + score.toFixed(2); }
			},
			handlers: {
				redraw_start: function () {
					// var points = json.filter
				}
			}
		})
	],

	// TODO: set up handlers to extend custom functionality
	handlers: {
		// `render` is used for custom initialization and is only called once when the plot is first rendered.
        render: function () {
            this.content.all.append('line').attr('class', 'guideline x');
            this.content.all.append('line').attr('class', 'guideline y');
            this.content.all.selectAll('line.guideline')
                .style('display', 'none')
                .style('stroke', 'orange')
                .style('pointer-events', 'none')
                .style('shape-rendering', 'crispEdges');
        },
        // Add a **resize** callback to properly size the _guidelines_.
        // `resize` is called whenever the chart is resized.
        resize: function () {
            this.content.all.selectAll('line.guideline.x').attr('y2', this.content.height);
            this.content.all.selectAll('line.guideline.y').attr('x2', this.content.width);
        }
	}
});

// render the plot 
scatter_plot.render(); 
// resize the plot with window size


function redraw() {
	scatter_plot.redraw();
};

window.onresize = function () {
	scatter_plot.resize(); 
}; 

console.log("end");