﻿// # C3 Timelines
// _Demonstrate timelines that use a time scale and JavaScript Date objects as x values._

// This example also demonstrates a mechanism of dynamically adding charts to a table
// instead of attaching to already existing div elements in the DOM.
var table_selection = d3.select('#timeline_example_table');
var timelines = [];

// The time scale that will be shared among all charts in this example.
var time_scale = d3.time.scale().domain([new Date(2014, 6, 1), new Date(2014, 7, 1)]);

// Create a month's worth of daily sample random **data** for this timeline.
type TimelineDatum = { date: Date, num: number }
var timeline_data: TimelineDatum[] = [];
for (let day = 1; day <= 30; day++)
    timeline_data.push({
        date: new Date(2014, 6, day, Math.random() * 24),
        num: Math.round(Math.random() * 10),
    });

// ## Create c3 timeline charts

// Append two example rows in the table and attach a new `c3.Plot.horiz_zoom` to each one.
// Note that `.node()` is called on the D3 selection to pass in the actual DOM node element as the anchor.
for (let row_color of ['darkred', 'darkblue']) {
    let row = table_selection.append('tr');
    row.append('td').text(row_color)
        .style('font-weight', 'bold')
        .style('background-color', 'lightgray')
        .style('text-align', 'center');

    timelines.push( new c3.Plot.Zoomable<TimelineDatum>({
        anchor: <HTMLElement>row.append('td').append('div').node(),
        width: '100%',
        zoomable: 'h',

        // Create a month's worth of daily sample random **data** for this timeline.
        data: timeline_data,

        // Setup the user **scales ** for the plot.The horizontal scale will be the time scale we created
        // above and the vertical scale will go from 0- 11 to accomodate the random `num` values.
        h: time_scale,
        v: d3.scale.linear().domain([0, 11]),

        // **accessor functions** to get the x and y values of the data points.
        x: (d) => d.date,
        y: (d) => d.num,

        // The maximum **zoom factor** that the user is allowed to zoom in.  The user cannot zoom out more
        // than the original defined domain.
        zoom_extent: 16,

        // Add an **axis ** so that grid lines are drawn, but not the scale itself.
        axes: [
            new c3.Axis.X({
                grid: true,
                ticks: false,
                axis_size: 0,
            }),
        ],

        // **Color ** this chart based on the example color for this row
        content_options: {
            styles: {
                'stroke': row_color,
                'fill': row_color,
            },
        },

        // Add `line` **layer**.
        // The `r` option will create a circle at each data point.
        // The `label_options.text` will provide a text label for each data point circle.
        layers: [
            new c3.Plot.Layer.Line<TimelineDatum>({
                interpolate: 'cardinal',
                r: 12, // radius for circles at datapoints
                label_options: {
                    text: (d) => d.num,
                    styles: {
                        'fill': 'white',
                        'stroke': 'none',
                        'font-weight': 'bold',
                    },
                },
            }),
        ],
    }));
}

// ## Create c3 Axis

// Create an additional row in the table for the time scale
var row = table_selection.append('tr');
row.append('td').text("Time")
    .style('font-weight', 'bold')
    .style('background-color', 'lightgray')
    .style('text-align', 'center');

// Create a `c3.Axis.x` **axis **.  c3 axis objects may be created independently from 
// plots for increased flexibility in layout options
var timeline_axis_example = new c3.Axis.X({
    anchor: <HTMLElement>row.append('td').node(),
    scale: time_scale,
    height: 30,
    tick_count: 4,
});

// ## Synchronize Zooming

// Setup event handlers so zooming in one of the timeline charts will zoom the other timeline charts.
timelines.forEach((timeline) => {
    timeline.on('zoom', (extent) => {
        for (let other_timeline of timelines.filter((t) => t !== timeline))
            other_timeline.focus(extent);
        timeline_axis_example.redraw()
    });
});

// ## Resize the timelines

// Resize the timelines to fit the window
window.onresize = function () {
    for (let timeline of timelines)
        timeline.resize();
    timeline_axis_example.resize();
}

// ## Render the timelines!

// Perform the initial rendering of the charts and add them to the global examples array.
for (let timeline of timelines)
    timeline.render();
timeline_axis_example.render();
