// ******************************************************************
// ************************* Simple function ************************
// ******************************************************************

function getTimeSeriesPluginSize(str) {
  return parseInt(str[str.length-1]);
}

function getTimeSeriesViewBox(size) {
	if (size == 4) { return "-32 0 665 665" }
	else if (size == 5) { return "-22 0 640 640" }
	else if (size == 6) { return "-18 0 625 625" }
	else { return "-16 0 625 625" }
}

function isEmpty(str) {
	if (!str) { return true; }
	else { return false }
}

function checkDate(start_date, end_date) {
   if (!isEmpty(start_date) && !isEmpty(end_date)) { return true; }
  else { return false; }
}


function d3TimeSeriesSample(container, size, source, rangeLabel, start_date, end_date) {
  if (!checkDate(start_date, end_date)) {
    // Una de las fechas ingresadas no es valida
    start_date = null;
    end_date = null;
  }

  // example data
  var metricName = rangeLabel;
  var optwidth = 600;
  var optheight = 370;

  // Define URL for JSON
  SOURCE_URL = "http://127.0.0.1:8000/api/" + source + "/" + start_date + "/" + end_date + "/";

  d3.queue()
    .defer(d3.json, SOURCE_URL)
    .await(function(error, dataset) {
    if (error) {
        console.error('Algo salió mal: ' + error);
    }
    else {

      /*
      * ========================================================================
      *  Prepare data
      * ========================================================================
      */

      dataset.forEach(function(d) {
          d.month = d3.time.format("%Y-%m-%d").parse(d.month);
      });

      dataset.sort(function(x, y){
         return d3.ascending(x.month, y.month);
      });

        /* === Focus chart === */

        var margin	= {top: 20, right: 30, bottom: 100, left: 20},
            width	= optwidth - margin.left - margin.right,
            height	= optheight - margin.top - margin.bottom;

        /* === Context chart === */

        var margin_context = {top: 320, right: 30, bottom: 20, left: 20},
            height_context = optheight - margin_context.top - margin_context.bottom;

      /*
      * ========================================================================
      *  x and y coordinates
      * ========================================================================
      */

        // the date range of available data:
        var dataXrange = d3.extent(dataset, function(d) { return d.month; });
        var dataYrange = [d3.min(dataset, function(d) { return d.count; }), d3.max(dataset, function(d) { return d.count; })];

        // maximum date range allowed to display
        var mindate = dataXrange[0],  // use the range of the data
            maxdate = dataXrange[1];

        var DateFormat = d3.time.format("%b %Y");

        var dynamicDateFormat = timeFormat([
            [d3.time.format("%Y"), function() { return true; }],// <-- how to display when Jan 1 YYYY
            [d3.time.format("%b %Y"), function(d) { return d.getMonth(); }],
            [function(){return "";}, function(d) { return d.getDate() != 1; }]
        ]);

        /* === Focus Chart === */

        var x = d3.time.scale()
        	.range([0, (width)])
            .domain(dataXrange);

        var y = d3.scale.linear()
        	.range([height,0])
            .domain(dataYrange);

        var xAxis = d3.svg.axis()
        	.scale(x)
            .orient("bottom")
        		.tickSize(-(height))
            .ticks(customTickFunction)
            .tickFormat(dynamicDateFormat);

        var yAxis = d3.svg.axis()
        	.scale(y)
            .ticks(4)
            .tickSize(-(width))
        	.orient("right");

        /* === Context Chart === */

        var x2 = d3.time.scale()
            .range([0, width])
            .domain([mindate, maxdate]);

        var y2 = d3.scale.linear()
        	.range([height_context, 0])
            .domain(y.domain());

        var xAxis_context = d3.svg.axis()
            .scale(x2)
            .orient("bottom")
            .ticks(customTickFunction)
            .tickFormat(dynamicDateFormat);

      /*
      * ========================================================================
      *  Plotted line and area variables
      * ========================================================================
      */

        /* === Focus Chart === */

        var line = d3.svg.line()
        	.x(function(d) { return x(d.month); })
        	.y(function(d) { return y(d.count); });

        var area = d3.svg.area()
          .x(function(d) { return x(d.month); })
          .y0((height))
          .y1(function(d) { return y(d.count); });

        var line_missing = d3.svg.line()
            .x(function(d) { return x(d.month); })
            .y(function(d) { return y(d.count); });

        var area_missing = d3.svg.area()
            .x(function(d) { return x(d.month); })
            .y0((height))
            .y1(function(d) { return y(d.count); });
        /* === Context Chart === */

        var area_context = d3.svg.area()
            .x(function(d) { return x2(d.month); })
            .y0((height_context))
            .y1(function(d) { return y2(d.count); });

        var line_context = d3.svg.line()
            .x(function(d) { return x2(d.month); })
            .y(function(d) { return y2(d.count); });

      /*
      * ========================================================================
      *  Variables for brushing and zooming behaviour
      * ========================================================================
      */

        var brush = d3.svg.brush()
            .x(x2)
            .on("brush", brushed)
            .on("brushend", brushend);

        var zoom = d3.behavior.zoom()
            .on("zoom", draw)
            .on("zoomend", brushend);

      /*
      * ========================================================================
      *  Define the SVG area ("vis") and append all the layers
      * ========================================================================
      */

        // === the main components === //

        var vis = d3.select(container).append("svg")
            .attr("viewBox", getTimeSeriesViewBox(getTimeSeriesPluginSize(size)))
          	.attr("class", "metric-chart");

        vis.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);
            // clipPath is used to keep line and area from moving outside of plot area when user zooms/scrolls/brushes

        var context = vis.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin_context.left + "," + margin_context.top + ")");

        var focus = vis.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var rect = vis.append("svg:rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        rect.call(zoom)
    .call(draw);

        // === current date range text & zoom buttons === //

        var display_range_group = vis.append("g")
            .attr("id", "buttons_group")
            .attr("transform", "translate(" + 0 + ","+ 0 +")");

        var expl_text = display_range_group.append("text")
            .text("Showing data from: ")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 0 + ","+ 10 +")");

        display_range_group.append("text")
            .attr("id", "displayDates")
            .text(DateFormat(dataXrange[0]) + " - " + DateFormat(dataXrange[1]))
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 82 + ","+ 10 +")");

        var expl_text = display_range_group.append("text")
            .text("Zoom to: ")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 180 + ","+ 10 +")");

        // === the zooming/scaling buttons === //

        var button_width = 40;
        var button_height = 14;

        // don't show year button if < 1 year of data
        var dateRange  = dataXrange[1] - dataXrange[0],
            ms_in_year = 31540000000;

        if (dateRange < ms_in_year)   {
            var button_data =["month","data"];
        } else {
            var button_data =["year","month","data"];
        };

        var button = display_range_group.selectAll("g")
            .data(button_data)
            .enter().append("g")
            .attr("class", "scale_button")
            .attr("transform", function(d, i) { return "translate(" + (220 + i*button_width + i*10) + ",0)"; })
            .on("click", scaleDate);

        button.append("rect")
            .attr("width", button_width)
            .attr("height", button_height)
            .attr("rx", 1)
            .attr("ry", 1);

        button.append("text")
            .attr("dy", (button_height/2 + 3))
            .attr("dx", button_width/2)
            .style("text-anchor", "middle")
            .text(function(d) { return d; });

        /* === focus chart === */

        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis)
           	.attr("transform", "translate(" + (width) + ", 0)");

        focus.append("path")
        .datum(dataset)
        .attr("class", "area_missing")
        .attr("d", area_missing)
        .call(zoom)
        .call(draw);


        focus.append("path")
            .datum(dataset)
            .attr("class", "area")
            .attr("d", area);

        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        focus.append("path")
            .datum(dataset)
            .attr("class", "line_missing")
            .attr("d", line_missing);
        focus.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line);

        focus.selectAll(".dot")
            .data(dataset)
            //.defined(function(d) { return d.data_point == true; })
            .enter().append("circle")
              .attr("class", "dot")
              .attr("r", 3)
              .attr("cx", function(d) { return x(d.month); })
              .attr("cy", function(d) { return y(d.count); })
              .on("mouseover", function(d) {show_tooltip(d)} )
              .on("mouseout", function(d) {hide_tooltip(d)} );

        /* === tooltip === */
        var div = d3.select(container).append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        // console.log(container)
        /* === context chart === */

        context.append("path")
            .datum(dataset)
            .attr("class", "area")
            .attr("d", area_context);

        context.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line_context);

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height_context + ")")
            .call(xAxis_context);

        /* === brush (part of context chart)  === */

        var brushg = context.append("g")
            .attr("class", "x brush")
            .call(brush);

        brushg.selectAll(".extent")
           .attr("y", -6)
           .attr("height", height_context + 8);
           // .extent is the actual window/rectangle showing what's in focus

        brushg.selectAll(".resize")
            .append("rect")
            .attr("class", "handle")
            .attr("transform", "translate(0," +  -3 + ")")
            .attr('rx', 2)
        	.attr('ry', 2)
            .attr("height", height_context + 6)
            .attr("width", 3);

        brushg.selectAll(".resize")
            .append("rect")
            .attr("class", "handle-mini")
            .attr("transform", "translate(-2,8)")
            .attr('rx', 3)
            .attr('ry', 3)
            .attr("height", (height_context/2))
            .attr("width", 7);
            // .resize are the handles on either size
            // of the 'window' (each is made of a set of rectangles)

        /* === y axis title === */

        vis.append("text")
            .attr("class", "y axis title")
            .text(metricName) // No usar this para señala el metricName
            .attr("x", (-(height/2)))
            .attr("y", 0)
            .attr("dy", "1em")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle");

        // allows zooming before any brush action
        zoom.x(x);

      /*
      * ========================================================================
      *  Functions
      * ========================================================================
      */

      // === tick/date formatting functions ===
      // from: https://stackoverflow.com/questions/20010864/d3-axis-labels-become-too-fine-grained-when-zoomed-in

        function timeFormat(formats) {
          return function(date) {
            var i = formats.length - 1, f = formats[i];
            while (!f[1](date)) f = formats[--i];
            return f[0](date);
          };
        };

        function customTickFunction(t0, t1, dt)  {
            var labelSize = 42; //
            var maxTotalLabels = Math.floor(width / labelSize);

            function step(date, offset)
            {
                date.setMonth(date.getMonth() + offset);
            }

            var time = d3.time.month.ceil(t0), times = [], monthFactors = [1,3,4,12];

            while (time < t1) times.push(new Date(+time)), step(time, 1);
            var timesCopy = times;
            var i;
            for(i=0 ; times.length > maxTotalLabels ; i++)
                times = _.filter(timesCopy, function(d){
                    return (d.getMonth()) % monthFactors[i] == 0;
                });

            return times;
        };

        // === brush and zoom functions ===

        function show_tooltip(d) {
            
            if (d.count == 1) {
                var metricName_point = metricName.slice(0, -1);
            } else {
                var metricName_point = metricName;
            }

            div.transition()
                .duration(60)
                .style("opacity", 0.98);
            div.html(d.count + " " + metricName_point + " in <b>" + DateFormat(d.month) + "</b><br/>" + d.count + " " + metricName + " total")
                .style("left", (d3.event.pageX -45) + "px")
                .style("top", (d3.event.pageY -50) + "px");
            };

function hide_tooltip(d) {
            div.transition()
                .duration(60)
                .style("opacity", 0);
};
        function brushed() {

            x.domain(brush.empty() ? x2.domain() : brush.extent());
            common_behaviour();
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            // Reset zoom scale's domain
            zoom.x(x);
            updateDisplayDates();
            setYdomain();

        };

        function draw() {
            setYdomain();
            common_behaviour();
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            //focus.select(".y.axis").call(yAxis);
            // Force changing brush range
            brush.extent(x.domain());
            vis.select(".brush").call(brush);
            // and update the text showing range of dates.
            updateDisplayDates();
        };
        function common_behaviour() {
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".area_missing").attr("d", area_missing);
            focus.select(".line_missing").attr("d", line_missing);
            focus.select(".x.axis").call(xAxis);
            focus.selectAll(".dot")
                .attr("cx", function(d) { return x(d.month); })
                .attr("cy", function(d) { return y(d.count); });
        };

        function brushend() {
        // when brush stops moving:

            // check whether chart was scrolled out of bounds and fix,
            var b = brush.extent();
            var out_of_bounds = brush.extent().some(function(e) { return e < mindate | e > maxdate; });
            if (out_of_bounds){ b = moveInBounds(b) };

        };

        function updateDisplayDates() {

            var b = brush.extent();
            // update the text that shows the range of displayed dates
            var localBrushDateStart = (brush.empty()) ? DateFormat(dataXrange[0]) : DateFormat(b[0]),
                localBrushDateEnd   = (brush.empty()) ? DateFormat(dataXrange[1]) : DateFormat(b[1]);

            // Update start and end dates in upper right-hand corner
            d3.select("#displayDates")
                .text(localBrushDateStart == localBrushDateEnd ? localBrushDateStart : localBrushDateStart + " - " + localBrushDateEnd);
        };

        function moveInBounds(b) {
        // move back to boundaries if user pans outside min and max date.

            var ms_in_year = 31536000000,
                brush_start_new,
                brush_end_new;

            if       (b[0] < mindate)   { brush_start_new = mindate; }
            else if  (b[0] > maxdate)   { brush_start_new = new Date(maxdate.getTime() - ms_in_year); }
            else                        { brush_start_new = b[0]; };

            if       (b[1] > maxdate)   { brush_end_new = maxdate; }
            else if  (b[1] < mindate)   { brush_end_new = new Date(mindate.getTime() + ms_in_year); }
            else                        { brush_end_new = b[1]; };

            brush.extent([brush_start_new, brush_end_new]);

            brush(d3.select(".brush").transition());
            brushed();
            draw();

            return(brush.extent())
        };

        function setYdomain(){
        // this function dynamically changes the y-axis to fit the data in focus

            // get the min and max date in focus
            var xleft = new Date(x.domain()[0]);
            var xright = new Date(x.domain()[1]);

            // a function that finds the nearest point to the right of a point
            var bisectDate = d3.bisector(function(d) { return d.month; }).right;

            // get the y value of the line at the left edge of view port:
            var iL = bisectDate(dataset, xleft);

            if (dataset[iL] !== undefined && dataset[iL-1] !== undefined) {

                var left_dateBefore = dataset[iL-1].month,
                    left_dateAfter = dataset[iL].month;

                var intfun = d3.interpolateNumber(dataset[iL-1].count, dataset[iL].count);
                var yleft = intfun((xleft-left_dateBefore)/(left_dateAfter-left_dateBefore));
            } else {
                var yleft = 0;
            }

            // get the x value of the line at the right edge of view port:
            var iR = bisectDate(dataset, xright);

            if (dataset[iR] !== undefined && dataset[iR-1] !== undefined) {

                var right_dateBefore = dataset[iR-1].month,
                    right_dateAfter = dataset[iR].month;

                var intfun = d3.interpolateNumber(dataset[iR-1].count, dataset[iR].count);
                var yright = intfun((xright-right_dateBefore)/(right_dateAfter-right_dateBefore));
            } else {
                var yright = 0;
            }

            // get the y values of all the actual data points that are in view
            var dataSubset = dataset.filter(function(d){ return d.month >= xleft && d.month <= xright; });
            var countSubset = [];
            dataSubset.map(function(d) {countSubset.push(d.count);});

            // add the edge values of the line to the array of counts in view, get the max y;
            countSubset.push(yleft);
            countSubset.push(yright);
            var ymax_new = d3.max(countSubset);
            var ymin_new = d3.min(countSubset);

            if(ymax_new == 0){
                ymax_new = dataYrange[1];
            }

            // reset and redraw the yaxis
            y.domain([ymin_new*1.05, ymax_new*1.05]);
            focus.select(".y.axis").call(yAxis);

        };

        function scaleDate(d,i) {
        // action for buttons that scale focus to certain time interval

            var b = brush.extent(),
                interval_ms,
                brush_end_new,
                brush_start_new;

            if      (d == "year")   { interval_ms = 31536000000}
            else if (d == "month")  { interval_ms = 2592000000 };

            if ( d == "year" | d == "month" )  {

                if((maxdate.getTime() - b[1].getTime()) < interval_ms){
                // if brush is too far to the right that increasing the right-hand brush boundary would make the chart go out of bounds....
                    brush_start_new = new Date(maxdate.getTime() - interval_ms); // ...then decrease the left-hand brush boundary...
                    brush_end_new = maxdate; //...and set the right-hand brush boundary to the maxiumum limit.
                } else {
                // otherwise, increase the right-hand brush boundary.
                    brush_start_new = b[0];
                    brush_end_new = new Date(b[0].getTime() + interval_ms);
                };

            } else if ( d == "data")  {
                brush_start_new = dataXrange[0];
                brush_end_new = dataXrange[1]
            } else {
                brush_start_new = b[0];
                brush_end_new = b[1];
            };

            brush.extent([brush_start_new, brush_end_new]);

            // now draw the brush to match our extent
            brush(d3.select(".brush").transition());
            // now fire the brushstart, brushmove, and brushend events
            brush.event(d3.select(".brush").transition());
        };
      }
    });

}
