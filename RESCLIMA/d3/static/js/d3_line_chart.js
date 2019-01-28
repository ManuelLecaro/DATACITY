// ******************************************************************
// ************************* Simple function ************************
// ******************************************************************

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function getLineChartPluginSize(str) {
  return parseInt(str[str.length-1]);
}

function getLineChartViewBox(size) {
	if (size == 4) { return "6 0 589 589" }
	else if (size == 5) { return "6 0 589 589" }
	else if (size == 6) { return "6 0 589 589" }
	else { return "6 0 589 589" }
}

function setSource(sid, source, start_date, end_date) {
	if (!sid) { return "http://127.0.0.1:8000/api/" + source + "/" + start_date + "/" + end_date + "/"; }
	else { return "http://127.0.0.1:8000/api/" + source + "/" + sid; }
}

function setOrigin(sid, origin, start_date, end_date) {
	if (!sid) { return "http://127.0.0.1:8000/api/" + origin + "/" + start_date + "/" + end_date + "/"; }
	else { return "http://127.0.0.1:8000/api/" + origin + "/" + sid; }
}

function isEmpty(str) {
	if (!str) { return true; }
	else { return false }
}

function checkDate(start_date, end_date) {
   if (!isEmpty(start_date) && !isEmpty(end_date)) { return true; }
  else { return false; }
}

function setLegend(str) {
  if (str.includes("W")) {
    return "Pesados"
  } else if (str.includes("L")) {
    return "Livianos"
  } else {
    return "Undefined"
  }
}

function d3LineChartSample(container, start_date, end_date, source, origin, domainLabel, rangeLabel, size, sid) {
  if (!checkDate(start_date, end_date)) {
    // Una de las fechas ingresadas no es valida
    start_date = null;
    end_date = null;
  }

  SOURCE_URL = setSource(sid, source, start_date, end_date);
  ORIGIN_URL = setOrigin(sid, origin, start_date, end_date);

  // Set the dimensions of the canvas / graph
  var	margin = {top: 30, right: 20, bottom: 30, left: 50},
  	  width = 600 - margin.left - margin.right,
  	  height = 270 - margin.top - margin.bottom;

  // Set the ranges
  var x = d3.scale.linear().range([0 , width]),
  y = d3.scale.linear().range([height, 0]);

  // Define the axes
  var	xAxis = d3.svg.axis().scale(x);

  var	yAxis = d3.svg.axis().scale(y)
  	.orient("left")
    .tickFormat(function (d) {
        var prefix = d3.formatPrefix(d);
        return prefix.scale(d) + prefix.symbol;
    });

  // Define the line
  var	line = d3.svg.line()
    .x(function(d) { return x(d.key); })
    .y(function(d) { return y(d.value); }).interpolate("basis");

  // Adds the svg canvas
  var	svg = d3.select(container)
    .append("svg")
    .attr("viewBox", getLineChartViewBox(getLineChartPluginSize(size)))
    .attr("perserveAspectRatio", "xMinYMid")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  d3.queue()
    .defer(d3.json, SOURCE_URL)
    .defer(d3.json, ORIGIN_URL)
    .await(function(error, data, root) {
    if (error) {
        console.error('Algo salió mal: ' + error);
    }
    else {
        // Scale the range of the data
      	x.domain(d3.extent(data, function(d) { return d.key; }));
        y.domain([0, d3.max(root, function(d) { return d.value; })]);

      	// Add the line path.
      	svg.append("path")
      		.attr("class", "line")
      		.attr("d", line(data))
          .attr("data-legend",function(d) { return setLegend(source) });

      	// Add the X Axis
      	svg.append("g")
      		.attr("class", "x axis")
      		.attr("transform", "translate(0," + height + ")")
      		.call(xAxis)
          .append("text").style("font-size", "14px")
          .attr("x", width / 2 + 13)
          .attr("y",  36)
          .attr("dx", ".75em")
          .style("text-anchor", "end")
          .text(domainLabel);

      	// Add the Y Axis
      	svg.append("g")
      		.attr("class", "y axis")
      		.call(yAxis)
          .append("text").style("font-size", "14px")
          .attr("y", -34)
          .attr("x", -(height)/ 2 + margin.top + 5)
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "end")
          .text(rangeLabel);

      	// Add the line path.
      	svg.append("path")
      		.attr("class", "line")
          .style("stroke", "red")
      		.attr("d", line(root))
          .attr("data-legend",function(d) { return setLegend(origin) });

        legend = svg.append("g")
          .attr("class","legend")
          .attr("transform","translate(474,-19)")
          .style("font-size","12px")
          .call(d3.legend)

    }
  });

}
