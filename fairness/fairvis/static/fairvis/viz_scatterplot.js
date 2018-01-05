// draw scatter plot


// var paramID = 14;
var selectedFeature;
var predictionID = "linear";
var colorIndex = 2;  
var data;
var margin, width, height;
var xValue, xScale, xMap, xAxis; 
var yValue, yScale, yMap, yAxis; 
var tValue;
var cValue, color; 
var svg, tooltip;
var cnt;
var colNames;


function initialize() {
	data = json.dataPoints;
	colNames = json.colNames;

	// Populate controls
	var newOpt;
	for (var i = 0; i < colNames.length; i++) {
		newOpt  = "<option class=\"featureSelectOption\" value=\"";
		newOpt += colNames[i];
		newOpt += "\">" + colNames[i];
		newOpt += "</option>";
		$("#featureSelection").append(newOpt);
	}
	$("#featureSelection").val(colNames[0]);

	$("#featureSelection").on("change", function() {
		$("svg").remove();
		setup();
		draw_plot();
	});
}


function setup() {
	selectedFeature = function() { return $("#featureSelection").val(); };

	// Setup viz
	margin = { top: 50, right: 30, left: 50, bottom: 30 };
	width = 800 - margin.left - margin.right;
	height = 600 - margin.top - margin.bottom;

	xValue = function (d) { return Number.parseFloat(d.data[selectedFeature()]); };
	xScale = d3.scale.linear().range([0, width - 150]);
	xMap = function (d) { return xScale(xValue(d)); };
	xAxis = d3.svg.axis().scale(xScale).orient("bottom");

	yValue = function (d) { return d.predictions[predictionID]; };
	yScale = d3.scale.linear().range([height, 0]);
	yMap = function (d) { return yScale(yValue(d)); };
	yAxis = d3.svg.axis().scale(yScale).orient("left");

	tValue = function (d) { return d.trueVal; };

	// set up fill color 
	// TODO: change the thresholds
	cValue = function (d) { 
		var diff = Math.abs(d.trueVal - d.predictions[predictionID]); 
		if (diff < 100) 
			return "diff < 100"; 
		else if (diff < 200) 
			return "100 <= diff < 200"; 
		else if (diff < 300) 
			return "200 <= diff < 300"; 
		else 
			return "diff >= 300";
	}; 
	color = d3.scale.category10(); 

	// add the graph canvas to the body of html 
	svg = d3.select("#viz-container").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

	// add tooltip feature 
	tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0); 

	xScale.domain([0, d3.max(data, xValue)+1]);
	yScale.domain([0, d3.max(data, yValue)+1]);
}


function draw_plot() {
	// x axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.append("text")
		.attr("class", "label")
		.attr("x", width)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text("chosen param");

	// y axis
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("prediction score"); 

	svg.selectAll(".dot")
		.data(data)
		.enter().append("circle")
		.attr("class", "dot")
		.attr("r", 3.5) 
		.attr("cx", xMap)
		.attr("cy", yMap)
		.style("fill", function(d) { 
			return color(cValue(d)); 
		})
		.on("mouseover", function(d) {
			tooltip.transition() 
				.duration(200)
				.style("opacity", .9); 
			tooltip.html("param value: "+ xValue(d) + 
				"<br/>" + "prediction value :" + yValue(d) + 
				"<br/>" + "true value: "+tValue(d))
				.style("left", (d3.event.pageX + 5) + "px")
				.style("top", (d3.event.pageY - 28) + "px"); 
		}) 
		.on("mouseout", function(d) {
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);
		}); 

  // draw legend
  var legend = svg.selectAll(".legend")
	  .data(color.domain())
	  .enter().append("g")
	  .attr("class", "legend")
	  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
	  .attr("x", width - 18)
	  .attr("width", 18)
	  .attr("height", 18)
	  .style("fill", color);

  // draw legend text
  legend.append("text")
	  .attr("x", width - 24)
	  .attr("y", 9)
	  .attr("dy", ".35em")
	  .style("text-anchor", "end")
	  .text(function(d) { return d;})
}