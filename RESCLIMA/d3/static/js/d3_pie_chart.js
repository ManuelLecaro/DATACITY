// ******************************************************************
// ************************* Simple function ************************
// ******************************************************************

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function getPieChartPluginSize(str) {
  return parseInt(str[str.length-1]);
}

function getPieChartViewBox(size) {
	if (size == 4) { return "-152 0 712 712" }
	else if (size == 5) { return "-152 0 685 685" }
	else if (size == 6) { return "-152 0 675 675" }
	else { return "-152 0 675 675" }
}

function isEmpty(str) {
	if (!str) { return true; }
	else { return false }
}

function checkDate(start_date, end_date) {
   if (!isEmpty(start_date) && !isEmpty(end_date)) { return true; }
  else { return false; }
}

function setSourcePieChart(sid, source, start_date, end_date, description) {
	if (!sid) { return "/api/" + source + "/" + start_date + "/" + end_date; }
	else { return "/api/" + source + "/" + sid; }
}

function d3PieChartSample(container, source, start_date, end_date, size, sid,description) {
  if (!checkDate(start_date, end_date)) {
    // Una de las fechas ingresadas no es valida
    start_date = null;
    end_date = null;
  }

  SOURCE_URL = setSourcePieChart(sid, source, start_date, end_date,description)
  var colorScheme = ["#FF8A65", "#4DB6AC","#FFF176","#BA68C8","#00E676","#AED581","#9575CD","#7986CB","#E57373","#A1887F","#90A4AE","#64B5F6"];

  var margin = {top:50,bottom:50,left:50,right:50};
	var width = 500 - margin.left - margin.right, height = width, radius = Math.min(width, height) / 2;
	var donutWidth = 75;
	var legendRectSize = 16;
	var legendSpacing = 4;

  d3.json(SOURCE_URL, function(error, data) {
    data.forEach(function(item){
  		item.enabled = true;
  	});

  	var color = d3.scale.ordinal().range(colorScheme);

  	var svg = d3.select(container)
      .append("svg")
      .attr("viewBox", getPieChartViewBox(getPieChartPluginSize(size)))
  	  .attr("perserveAspectRatio", "xMinYMid")
      .append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
			.attr("width", 350)
			.attr("height", 350);

  	var arc = d3.svg.arc()
  	  .outerRadius(radius - 10)
      .innerRadius(radius - donutWidth);

  	var pie = d3.layout.pie()
  		.sort(null)
  		.value(function(d) { return d.value; });

  	var tooltip = d3.select(container)
  		.append('div')
			.attr('class', 'tooltip')
			.style('background-color',"transparent");

  	tooltip.append('div')
  		.attr('class', 'tip-label');

  	tooltip.append('div')
  		.attr('class', 'count');

  	tooltip.append('div')
  		.attr('class', 'percent');

  	var path = svg.selectAll('path')
  		.data(pie(data))
  		.enter()
  		.append('path')
  		.attr('d', arc)
  		.attr('fill', function(d, i) {
  			return color(d.data.key);
  		})
  		.each(function(d) { this._current = d; });

  	path.on('mouseover', function(d) {
  		var total = d3.sum(data.map(function(d) {
  			return (d.enabled) ? d.value : 0;
  		}));

      var percent = (1000 * d.data.value / total) / 10;
			tooltip.select('.tip-label').html(d.data.key);
			tooltip.select('.count').html(d.data.value);
			tooltip.select('.percent').html(percent.toFixed(2) + '%');
			tooltip.style('display', 'block');
			tooltip.style('opacity',1);
			tooltip.style("left",width/4);
			tooltip.style("top",height/4);
			tooltip.style('background-color',"transparent");

  	});

  	path.on('mousemove', function(d) {
			tooltip.style("left",width/4);
			tooltip.style("top",height/4);
  	});

  	path.on('mouseout', function() {
  		tooltip.style('display', 'none');
			tooltip.style('opacity',0);
  	});

  	var legend = svg.selectAll('.legend')
			.data(color.domain())
  	  .enter()
  	  .append('g')
      .attr('class', 'legend')
      .style("font-size","16px")
      .attr('transform', function(d, i) {
  	    var height = legendRectSize + legendSpacing;
        var offset =  height * color.domain().length / 2;
        var horz = width/2+2;
        var vert = i * height - offset;
				return 'translate(' + horz + ',' + vert + ')'				
			}).each(function(d) { this._current = d; }
		);

  	legend.append('rect')
  		.attr('width', legendRectSize)
  		.attr('height', legendRectSize+3)
  		.style('fill', color)
  		.style('stroke', color)
  		.on('click', function(label) {
  	    var rect = d3.select(this);
  		 	var enabled = true;
  			var totalEnabled = d3.sum(data.map(function(d) {
  				return (d.enabled) ? 1 : 0;
  			}));

  			if (rect.attr('class') === 'disabled') {
  				rect.attr('class', '');
  			} else {
  				if (totalEnabled < 2) return;
  				rect.attr('class', 'disabled');
  				enabled = false;
  	    }

  			pie.value(function(d) {
  				if (d.key === label) d.enabled = enabled;
  				return (d.enabled) ? d.value : 0;
  			});

  			path = path.data(pie(data));

  			path.transition()
          .duration(750)
  		    .attrTween('d', function(d) {
    			 	var interpolate = d3.interpolate(this._current, d);
    				this._current = interpolate(0);
    				return function(t) {
    					return arc(interpolate(t));
    				};
  		    });

  		});

  	legend.append('text')
  	.attr('x', legendRectSize + legendSpacing)
  	.attr('y', legendRectSize - legendSpacing)
  	.text(function(d) { return d; })

	});

}

function DonutCharts(container) {

	var charts = d3.select(container);

	var chart_m,
			chart_r,
			color = d3.scale.category10();

	var getCatNames = function(dataset) {

		var catNames = new Array();

		dataset.forEach(function(item){
			catNames.push(item.key)
		});

		return catNames;
	}

	var createLegend = function(catNames) {
			var legends = charts.select('.legend')
											.selectAll('g')
													.data(catNames)
											.enter().append('g')
													.attr('transform', function(d, i) {
															return 'translate(' + (i * 150 + 50) + ', 10)';
													});

			legends.append('circle')
					.attr('class', 'legend-icon')
					.attr('r', 6)
					.style('fill', function(d, i) {
							return color(i);
					});

			legends.append('text')
					.attr('dx', '1em')
					.attr('dy', '.3em')
					.text(function(d) {
							return d;
					});
	}

	var createCenter = function(pie) {

			var eventObj = {
					'mouseover': function(d, i) {
							d3.select(this)
									.transition()
									.attr("r", chart_r * 0.65);
					},

					'mouseout': function(d, i) {
							d3.select(this)
									.transition()
									.duration(500)
									.ease('bounce')
									.attr("r", chart_r * 0.6);
					},

					'click': function(d, i) {
							var paths = charts.selectAll('.clicked');
							pathAnim(paths, 0);
							paths.classed('clicked', false);
							resetAllCenterText();
					}
			}

			var donuts = d3.selectAll('.donut');

			// The circle displaying total data.
			donuts.append("svg:circle")
					.attr("r", chart_r * 0.6)
					.style("fill", "#E7E7E7")
					.on(eventObj);

			donuts.append('text')
							.attr('class', 'center-txt type')
							.attr('y', chart_r * -0.16)
							.attr('text-anchor', 'middle')
							.style('font-weight', 'bold')
							.text(function(d, i) {
									return d.key;
							});
			donuts.append('text')
							.attr('class', 'center-txt value')
							.attr('text-anchor', 'middle');
			donuts.append('text')
							.attr('class', 'center-txt percentage')
							.attr('y', chart_r * 0.16)
							.attr('text-anchor', 'middle')
							.style('fill', '#A2A2A2');
	}

	var setCenterText = function(thisDonut) {
			var sum = d3.sum(thisDonut.selectAll('.clicked').data(), function(d) {
					return d.data.value;
			});

			thisDonut.select('.value')
					.text(function(d) {
							return (sum)? sum.toFixed(1) + "valor" //Determinar una forma para poner unidad
													: d.total.toFixed(1) + "valor";//donde este la palabra "valor"
					});
			thisDonut.select('.percentage')
					.text(function(d) {
							return (sum)? (sum/d.total*100).toFixed(2) + '%'
													: '';
					});
	}


	var resetAllCenterText = function() {
			
			charts.selectAll('.value')
					.text(function(d) {
							return d.total.toFixed(1) + " Censo"; //TODO cambiar por el titulo
					});
			charts.selectAll('.percentage')
					.text('');
	}

	var pathAnim = function(path, dir) {
			switch(dir) {
					case 0:
							path.transition()
									.duration(500)
									.ease('bounce')
									.attr('d', d3.svg.arc()
											.innerRadius(chart_r * 0.7)
											.outerRadius(chart_r)
									);
							break;

					case 1:
							path.transition()
									.attr('d', d3.svg.arc()
											.innerRadius(chart_r * 0.7)
											.outerRadius(chart_r * 1.08)
									);
							break;
			}
	}

	var updateDonut = function(dataset) {

			var eventObj = {

					'mouseover': function(d, i, j) {
							pathAnim(d3.select(this), 1);

							var thisDonut = charts.select('.type1');
							thisDonut.select('.value').text(function(donut_d) {
									return d.data.value.toFixed(1) + "Persona";
							});
							thisDonut.select('.percentage').text(function(donut_d) {
									return (d.data.value/donut_d.total*100).toFixed(2) + '%';
							});
					},
					
					'mouseout': function(d, i, j) {
							var thisPath = d3.select(this);
							if (!thisPath.classed('clicked')) {
									pathAnim(thisPath, 0);
							}
							var thisDonut = charts.select('.type1');
							setCenterText(thisDonut);
					},

					'click': function(d, i, j) {
							var thisDonut = charts.select('.type1');

							if (0 === thisDonut.selectAll('.clicked')[0].length) {
									thisDonut.select('circle').on('click')();
							}

							var thisPath = d3.select(this);
							var clicked = thisPath.classed('clicked');
							pathAnim(thisPath, ~~(!clicked));
							thisPath.classed('clicked', !clicked);

							setCenterText(thisDonut);
					}
			};

			var pie = d3.layout.pie()
											.sort(null)
											.value(function(d) {
													return d.value;
											});

			var arc = d3.svg.arc()
											.innerRadius(chart_r * 0.7)
											.outerRadius(function() {
													return (d3.select(this).classed('clicked'))? chart_r * 1.08
																																		 : chart_r;
											});

			// Start joining data with paths
			var paths = charts.selectAll('.donut')
											.selectAll('path')
											.data(function(d, i) {
													return pie(d.data);
											});

			paths
					.transition()
					.duration(1000)
					.attr('d', arc);

			paths.enter()
					.append('svg:path')
							.attr('d', arc)
							.style('fill', function(d, i) {
									return color(i);
							})
							.style('stroke', '#FFFFFF')
							.on(eventObj)

			paths.exit().remove();

			resetAllCenterText();
	}

	this.create = function(dataset,container,size) {
			var $charts = $(container);

		  var margin = {top:50,bottom:50,left:50,right:50};
			var width = 500 - margin.left - margin.right, height = width, radius = Math.min(width, height) / 2;



			chart_m = width/4 * 0.07;
			chart_r = width/3 * 0.85;

			charts.append('svg')
					.attr('class', 'legend')
					.attr('width', "40%")
					.attr('height', "20%")
					.attr("viewBox", getPieChartViewBox(getPieChartPluginSize(size)))
					.attr("perserveAspectRatio", "xMinYMid")
					.attr('transform', 'translate(0, -120)');
			
			var donut = charts.selectAll('.donut')
											.data(dataset)
									.enter().append('svg:svg')
											.attr('width', (chart_r + chart_m) * 2)
											.attr('height', (chart_r + chart_m)*2)
									.append('svg:g')
											.attr('class', "donut type1")
											.attr('transform', 'translate(' + (chart_r+chart_m) + ',' + (chart_r+chart_m) + ')');

			createLegend(getCatNames(dataset));
			createCenter();

			updateDonut(dataset);
	}

	this.update = function(dataset) {
			// Assume no new categ of data enter
			var donut = charts.selectAll(".donut")
									.data(dataset);

			updateDonut();
	}
}


function generatePieChart(container, source, start_date, end_date, size, sid,description){
	if (!checkDate(start_date, end_date)) {
    // Una de las fechas ingresadas no es valida
    start_date = null;
    end_date = null;
  }

	SOURCE_URL = setSourcePieChart(sid, source, start_date, end_date,description)

	d3.json(SOURCE_URL, function(error, data) {
		var total = 0;
		data.forEach(function(item){
			item.enabled = true;
			total += parseInt(item.value);
		});
	
		var dataset = new Array()
		
		dataset.push({
			"total":total,
			"data": data
		});
	
		var pieChartSample = new DonutCharts(container);
		pieChartSample.create(dataset,container,size); 
	
	});
	

}