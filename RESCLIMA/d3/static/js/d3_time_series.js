// ******************************************************************
// ************************* Simple function ************************
// ******************************************************************

function getTimeSeriesPluginSize(str) {
  return parseInt(str[str.length-1]);
}

function getTimeSeriesViewBox(size) {
	if (size == 4) { return "185 40 780 780" }
	else if (size == 5) { return "150 40 600 600" }
	else if (size == 6) { return "120 30 500 500" }
	else { return "120 25 450 450" }
}

function d3TimeSeriesSample(container, staticURL, size) {
  //I increased the bottom margin a little bit because the x label is tied to it; so I could lower the x label a little bit
  var margin = {top: 50, right: 20, bottom: 60, left: 90},
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
  	  .ticks(d3.time.hours,24)
      //makes the xAxis ticks a little longer than the xMinorAxis ticks
      .tickSize(10)
      .orient("bottom");

  var xMinorAxis = d3.svg.axis()
      .scale(x)
      .ticks(d3.time.hours,12)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var line = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.total_km); });

  var div = d3.select(container).append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  var svg = d3.select(container).append("svg")
      .attr("viewBox", getTimeSeriesViewBox(getTimeSeriesPluginSize(size)))
      .attr("perserveAspectRatio", "xMinYMid")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //The format in the CSV, which d3 will read
  var parseDate = d3.time.format("%Y-%m-%d %X");

  //format for tooltip
  //https://github.com/mbostock/d3/wiki/Time-Formatting
  //var formatTime = d3.time.format("%e %b");
  var formatTime = d3.time.format("%e %b %-I:%M %p");
  var formatCount = d3.format(",");

  // function for the y grid lines
  function make_y_axis() {
    return d3.svg.axis()
        .scale(y)
        .orient("left")
        //.ticks(5)
  }

  //reading in CSV which contains data
  d3.csv(staticURL + "sample/d3_time_series_flare.csv", function(error, data) {
    console.log(data)
    data.forEach(function(d) {
      //console.log(d.date_time)
      d.date = parseDate.parse(d.date_time);
	    console.log(d.date);
      d.total_km = +d.total_km;
      console.log(d.total_km);
  });

  //using imported data to define extent of x and y domains
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain(d3.extent(data, function(d) { return d.total_km; }));

  // Draw the y Grid lines
	svg.append("g")
	   .attr("class", "grid")
		 .call(make_y_axis()
		 .tickSize(-width, 0, 0)
	   .tickFormat(""))

  svg.append("path")
     .datum(data)
     .attr("class", "line")
     .attr("d", line);

  //taken from http://bl.ocks.org/mbostock/3887118
  //and http://www.d3noob.org/2013/01/change-line-chart-into-scatter-plot.html
  //creating a group(g) and will append a circle and 2 lines inside each group
  var g = svg.selectAll().data(data).enter().append("g");

  //The markers on the line
  g.append("circle")
   //circle radius is increased
   .attr("r", 4.5)
   .attr("cx", function(d) { return x(d.date); })
   .attr("cy", function(d) { return y(d.total_km); });

  //The horizontal dashed line that appears when a circle marker is moused over
  g.append("line")
       .attr("class", "x")
       .attr("id", "dashedLine")
       .style("stroke", "steelblue")
       .style("stroke-dasharray", "3,3")
       .style("opacity", 0)
       .attr("x1", function(d) { return x(d.date); })
       .attr("y1", function(d) { return y(d.total_km); })
 	     //d3.min gets the min date from the date x-axis scale
 	     //.attr("x2", function(d) { return x(d3.min(x)); })
       //.attr("y2", function(d) { return y(d.total_km); });

  //The vertical dashed line that appears when a circle marker is moused over
	g.append("line")
        .attr("class", "y")
        .attr("id", "dashedLine")
        .style("stroke", "steelblue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0)
        .attr("x1", function(d) { return x(d.date); })
        .attr("y1", function(d) { return y(d.total_km); })
		    .attr("x2", function(d) { return x(d.date); })
        .attr("y2", height);

  //circles are selected again to add the mouseover functions
	  g.selectAll("circle")
    .on("mouseover", function(d) {
      div.transition()
         .duration(200)
         .style("opacity", .9);
      div.html(formatCount(d.total_km) + " km" + "<br/>" + formatTime(d.date))
         .style("left", (d3.event.pageX - 20) + "px")
		     .style("top", (d3.event.pageY + 6) + "px");
      //selects the horizontal dashed line in the group
      d3.select(this.nextElementSibling).transition()
          .duration(200)
          .style("opacity", .9);
      //selects the vertical dashed line in the group
      d3.select(this.nextElementSibling.nextElementSibling).transition()
          .duration(200)
          .style("opacity", .9);
    })

    .on("mouseout", function(d) {
      div.transition()
         .duration(500)
         .style("opacity", 0);

      d3.select(this.nextElementSibling).transition()
          .duration(500)
          .style("opacity", 0);

      d3.select(this.nextElementSibling.nextElementSibling).transition()
          .duration(500)
          .style("opacity", 0);
     });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
	    .selectAll(".tick text")
      .call(wrap, 35);

  svg.append("g")
      .attr("class","xMinorAxis")
      .attr("transform", "translate(0," + height + ")")
      .style({ 'stroke': 'Black', 'fill': 'none', 'stroke-width': '1px'})
      .call(xMinorAxis)
      .selectAll("text").remove();

  //http://www.d3noob.org/2012/12/adding-axis-labels-to-d3js-graph.html
  svg.append("text")      // text label for the x-axis
          .attr("x", width / 2 )
          .attr("y",  height + margin.bottom)
          .style("text-anchor", "middle")
          .text("Date");

  svg.append("text")      // text label for the y-axis
          .attr("y",30 - margin.left)
          .attr("x",50 - (height / 2))
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "end")
          .style("font-size", "16px")
          .text("road length (km)");

  //http://www.d3noob.org/2013/01/adding-title-to-your-d3js-graph.html
  // text label for chart Title
  /*
  svg.append("text")
          .attr("x", width / 2 )
          .attr("y", 0 - (margin.top/2))
          .style("text-anchor", "middle")
  		    .style("font-size", "16px")
          .style("text-decoration", "underline")
          .text("Pandora Road Construction");
  */

  svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

  //text label for the y-axis inside chart
  /*
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .style("font-size", "16px")
    .style("background-color","red")
    .text("road length (km)");
  */

  //http://bl.ocks.org/mbostock/7555321
  //This code wraps label text if it has too much text
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

  });


}
