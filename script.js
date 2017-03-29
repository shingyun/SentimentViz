
//First, append <svg> element and implement the margin convention
var m = {t:50,r:50,b:50,l:50};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot1 = d3.select('.plot1')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight/3)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

var plot2 = d3.select('.plot2')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',(outerHeight/3)*2)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//Import data and parse
d3.queue()
  .defer(d3.csv,'data/clinton3_new.csv',parseC)
  .defer(d3.csv,'data/trump3_new.csv',parseT)
  .await(dataLoaded);

function dataLoaded(err, clinton, trump){

   var clintonByDate = d3.nest()
       .key(function(clinton){return clinton.date.getFullYear()+'/'+clinton.date.getMonth()+'/'+clinton.date.getDate()})
       .entries(clinton);
   clintonByDate.sort();

  var trumpByDate = d3.nest()
      .key(function(trump){return trump.date.getFullYear()+'/'+trump.date.getMonth()+'/'+trump.date.getDate()})
      .entries(trump);
  trumpByDate.sort();

 drawTimeline(plot1,clinton,trump);
 drawSentiment(plot2,clinton, trump);

}


function drawTimeline(plot, clinton, trump){

  var t0 = new Date(2015,10,1), t1 = new Date(2017,2,31);
      tThresholds = d3.timeDay.range(t0,t1,1);//interval.range(start, stop[, step]

  var histogramDate = d3.histogram()
      .domain([t0,t1])
      .value(function(d){return d.date})
      .thresholds(tThresholds);

  var scaleXtime = d3.scaleTime()
      .domain([t0,t1])
      .range([0,w]);

  var scaleYcount = d3.scaleLinear()
      .domain([0,13])
      .range([h/4,0]);

  var line = d3.line()
      .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
      .y(function(d){return scaleYcount(d.length)})
      .curve(d3.curveCardinal);;

  var area = d3.area()
    .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
    .y1(function(d){return scaleYcount(d.length)})
    .y0(h/4);

  //draw Clinton
  var areaNodeC = plot.selectAll('.area_Clinton')
      .data([histogramDate(clinton)])//UPDATE
      .enter()
      .append('path').attr('class','area')//Enter
      .transition()
      .attr('d',area)
      .style('fill','blue')
      .style('opacity',0.5);

  var lineNodeC = plot
      .selectAll('.line_Clinton')
      .data([histogramDate(clinton)])
      .enter()
      .append('path').attr('class','line_Clinton')
      .attr('d',line);

  //draw Trump
  var areaNodeT = plot.selectAll('.area_Trump')
      .data([histogramDate(trump)])//UPDATE
      .enter()
      .append('path').attr('class','area_Trump')//Enter
      .transition()
      .attr('d',area)
      .style('fill','red');

  var lineNodeT = plot
      .selectAll('.line_Clinton')
      .data([histogramDate(trump)])
      .enter()
      .append('path').attr('class','line_trump')
      .attr('d',line);

    //Refer to API here: https://github.com/d3/d3-brush
  var brush = d3.brushX()
      .on('end',brushend);

  plot.append('g').attr('class','brush')
      .call(brush);

  function brushend(){
    console.log('timeseries:brushend');
    if(!d3.event.selection){
      //if brush is cleared, then selected range will be empty
      console.log('brush is cleared');
      return;
    }
    console.log('selected range of the brush (in terms of screen pixels) is ' + d3.event.selection);
    console.log('selected range of the brush (in terms of time of day) is ' + d3.event.selection.map(scaleXtime.invert));
    
    var brushedArea = d3.event.selection.map(scaleXtime.invert);

    var brushedTrump = crossfilter(trump)
        .dimension(function(d){return d.date;})
        .filterRange(brushedArea)
        .top(Infinity);
    
    var brushedClinton = crossfilter(clinton)
        .dimension(function(d){return d.date;})
        .filterRange(brushedArea)
        .top(Infinity);
   
    drawSentiment(plot2,brushedClinton, brushedTrump, brushedArea);

  }
 

  //Axis
  var xAxis = d3.axisBottom()
      .scale(scaleXtime)
      .tickValues(null)
      .tickFormat(null)
      .ticks(d3.timeMonth.every(1));

  var yAxis = d3.axisLeft()
      .tickSize(-w)
      .tickValues(d3.range(0,20,5))
      .scale(scaleYcount);

  plot.append('g').attr('transform','translate(0,'+(h/4)+')')
    .call(xAxis);
  plot.insert('g','.line').attr('class','axis axis-y') //line is "inserted" before area
    .call(yAxis);

}


function drawSentiment(plot,clinton,trump, brush){

   d3.select('.axis-x').remove();

   console.log(brush[0].getFullYear());
   console.log(trump);
   console.log(clinton);
   
   var t0 = new Date(brush[0].getFullYear(),brush[0].getMonth(),brush[0].getDate());
       t1 = new Date(brush[1].getFullYear(),brush[1].getMonth(),brush[1].getDate());
    
   var histogramDate = d3.histogram()
       .domain([t0,t1])
       .value(function(d){return d.date})
       .thresholds(tThresholds);

   var scaleXtime = d3.scaleTime()
       .domain([t0,t1])
       .range([0,w]);

   var scaleYsent = d3.scaleLinear()
       .domain([-1, 1])
       .range([h/1.75,0]);

   var nodeC = plot.selectAll('.sent_Clinton')
       .data(clinton);

   var nodeCenter = nodeC.enter()
       .append('circle')
       .attr('class','sent_Clinton');

   nodeC.merge(nodeCenter)
        .attr('cx',function(d){return scaleXtime(d.date)})
        .attr('cy',function(d){return scaleYsent(d.sentiment)})
        .attr('r','5px')
        .style('opacity',.5)
        .style('fill','blue');
   
   nodeC.exit().remove();


   var nodeT = plot.selectAll('.sent_Trump')
       .data(trump)

   var nodeTenter = nodeT.enter()
       .append('circle')
       .attr('class','sent_Trump');

   nodeT.merge(nodeTenter)
        .attr('cx',function(d){return scaleXtime(d.date)})
        .attr('cy',function(d){return scaleYsent(d.text)})
        .attr('r','5px')
        .style('opacity',.5)
        .style('fill','red');
       
   nodeT.exit().remove();

  //Axis
  var xAxis = d3.axisBottom()
      .scale(scaleXtime)
      .tickValues(null)
      .tickFormat(null)
      .ticks(d3.timeMonth.every(1));

  var yAxis = d3.axisLeft()
      .tickSize(-w)
      // .tickValues(d3.range(0,20,5))
      .scale(scaleYsent);

  plot.append('g')
      .attr('class','axis axis-x')
      .attr('transform','translate(0,'+(h-200)+')')
      .call(xAxis);
  plot.append('g').attr('class','axis axis-y') //line is "inserted" before area
      .attr('transform','translate(0,0') 
      .call(yAxis);

    // plot.insert('g','.line').attr('class','axis axis-y') //line is "inserted" before area
    //   .attr('transform','translate(0,'+(h-200)+')') 
    //   .call(yAxis);



}




function parseC(d){

   return {
     date:parseTime(d.date),
     title:d['title'],
     text:d['text'],
     sentiment:d['sentiment'],
     url:d['url']
   };
}

function parseT(d){

   return {
     date:parseTime(d.date),
     title:d['title'],
     text:d['text'],
     sentiment:d['sentiment'],
     url:d['url']
   };
}

function parseTime(time){

    var date = time.split(' ')[0].split('-'),
        day = date[2],
        year = date[0],
        month = date[1];
    // return new Date(parseInt(year),parseInt(month-1),parseInt(day));
    return new Date(year,month-1,day);
} 

// var tripsByYear = cf.dimension(function(d){return d.startTime.getFullYear()});
//     var tripsByTime = cf.dimension(function(d){return d.startTime.getHours()+d.startTime.getMinutes()/60});
//     var tripsByDayOfWeek = cf.dimension(function(d){return d.startTime.getDay()});
