
//First, append <svg> element and implement the margin convention
var m = {t:25,r:25,b:25,l:25};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot1 = d3.select('.plot1')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight/7*4)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

var plot2 = d3.select('.plot2')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',0)');

var plot3titleT = d3.select('.plot3')
    .select('.titleT');

var plot3titleC = d3.select('.plot3')
    .select('.titleC');

var dispatch = d3.dispatch('highlight');

//Import data and parse
d3.queue()
  .defer(d3.csv,'data/clinton4.csv',parseC)
  .defer(d3.csv,'data/trump4.csv',parseT)
  .await(dataLoaded);

function dataLoaded(err, clinton, trump){

  console.log(clinton);
  console.log(trump);

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
// listTitle(plot3,clinton,trump);

}


function drawTimeline(plot, clinton, trump){

  var t0 = new Date(2016,3,1), t1 = new Date(2017,2,31);
      tThresholds = d3.timeDay.range(t0,t1,1);//interval.range(start, stop[, step]

  var histogramDate = d3.histogram()
      .domain([t0,t1])
      .value(function(d){return d.date})
      .thresholds(tThresholds);

  var scaleXtime = d3.scaleTime()
      .domain([t0,t1])
      .range([0,w]);

  var scaleYcountT = d3.scaleLinear()
      .domain([0,9])
      .range([h/4,20]);

  var scaleYcountC = d3.scaleLinear()
      .domain([13,0])
      .range([h/2,h/4]);

  // var line = d3.line()
  //     .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
  //     .y(function(d){return scaleYcount(d.length)})
  //     .curve(d3.curveCardinal);;

  var areaT = d3.area()
    .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
    .y1(function(d){return scaleYcountT(d.length)})
    .y0(h/4);

  var areaC = d3.area()
    .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
    .y0(function(d){return scaleYcountC(d.length)})
    .y1(h/4);

//  draw Clinton
  var areaNodeC = plot.selectAll('.area_Clinton')
      .data([histogramDate(clinton)])//UPDATE
      .enter()
      .append('path').attr('class','area_Clinton')//Enter
      .style('fill','#232066')
      .style('opacity',1)
      .attr('d',areaC);

//  draw Trump
  var areaNodeT = plot.selectAll('.area_Trump')
      .data([histogramDate(trump)])//UPDATE
      .enter()
      .append('path').attr('class','area_Trump')//Enter
      .style('fill','#E91D0E')
      .style('opacity',1)
      .attr('d',areaT);

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
    listTitle(plot3,brushedClinton,brushedTrump);
    
    //button Trump
    d3.select('.btnT')
      .on('click',function(d){
     
         if(d3.select(this).classed('hidedBtnT')){
              d3.select(this).classed('hidedBtnT',false)
                .html('Hide Trump');
              d3.selectAll('.sent_Trump').style('opacity',0.7);

           }else{
              d3.select(this).classed('hidedBtnT',true)
                .html('Show Trump');
              d3.selectAll('.sent_Trump').style('opacity',0);
              
           }
    })//btnT

    //button Clinton
    d3.select('.btnC')
      .on('click',function(d){
     
         if(d3.select(this).classed('hidedBtnC')){
              d3.select(this).classed('hidedBtnC',false)
                .html('Hide Clinton');
              d3.selectAll('.sent_Clinton').style('opacity',0.7);

           }else{
              d3.select(this).classed('hidedBtnC',true)
                .html('Show Clinton');
              d3.selectAll('.sent_Clinton').style('opacity',0);
              
           }
    })//btnC

  }
 

  //Axis
  var xAxis = d3.axisTop()
      .scale(scaleXtime)
      .tickValues(null)
      .tickFormat(null)
      .ticks(d3.timeMonth.every(1));

  var yAxisT = d3.axisLeft()
      .tickSize(-w)
      .tickValues(d3.range(0,9,3))
      .scale(scaleYcountT);

  var yAxisC = d3.axisLeft()
      .tickSize(-w)
      .tickValues(d3.range(0,12,3))
      .scale(scaleYcountC);

  plot.append('g').attr('class','axis axisx-count')
    .attr('transform','translate(0,0)')
    .call(xAxis);
  plot.insert('g','.area_Trump').attr('class','axis axis-yT') //line is "inserted" before area
    .call(yAxisT);
  plot.insert('g','.area_Clinton').attr('class','axis axis-yC')
    .attr('transform','translate(0,0)')
    .call(yAxisC);


}



function drawSentiment(plot,clinton,trump, brush){

   d3.select('.btnT')
     .classed('hidedBtnT',false)
     .html('Hide Trump');

   d3.select('.btnC')
     .classed('hidedBtnC',false)
     .html('Hide Clinton');

   d3.select('.axis-x').remove();

   // console.log(trump);
   // console.log(clinton);
   
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
       .domain([-0.5, 0.6])
       .range([h/1.75,0]);

   var nodeC = plot.selectAll('.sent_Clinton')
       .data(clinton);

   var nodeCenter = nodeC.enter()
       .append('circle')
       .attr('class','sent_Clinton');

   nodeC.merge(nodeCenter)
        // .attr('cx',function(d){return scaleXtime(d.date)})
        // .attr('cy',function(d){return scaleYsent(d.sentiment)})
        .attr('r','5px')
        .style('opacity',.7)
        .style('fill','#232066');
   
   nodeC.exit().remove();

 


 var simulationC = d3.forceSimulation(clinton);

 var chargeForce = d3.forceManyBody()
    .strength(0);// -30 is by defult(for forceManyBody)

 var forceX = d3.forceX()
    .x(function(d){return scaleXtime(d.date)});

 var forceY = d3.forceY()
    .y(function(d){return scaleYsent(d.sentiment)}); //向 y=h/2靠近

 var collide = d3.forceCollide()// collide 讓所有elements都不重疊
    .radius(3);

simulationC
        .force('charge',chargeForce)
        .force('positionX',forceX)
        .force('positionY',forceY)
        .force('collide',collide)
        .alpha(1)
        .restart()
        .on('tick.position',function(){
          
          plot.selectAll('.sent_Clinton')
              .attr('transform',function(d){ 
           return 'translate('+ d.x+','+ d.y+')'});
         })
        .on('end',function(){
            console.log('simulation end');
        });


//Trump
   var nodeT = plot.selectAll('.sent_Trump')
       .data(trump)

   var nodeTenter = nodeT.enter()
       .append('circle')
       .attr('class','sent_Trump');

   nodeT.merge(nodeTenter)
        // .attr('cx',function(d){return scaleXtime(d.date)})
        // .attr('cy',function(d){return scaleYsent(d.text)})
        .attr('r','5px')
        .style('opacity',.7)
        .style('fill','#E91D0E');
       
   nodeT.exit().remove();


 var simulationT = d3.forceSimulation(trump);

 var chargeForce = d3.forceManyBody()
    .strength(0);// -30 is by defult(for forceManyBody)

 var forceX = d3.forceX()
    .x(function(d){return scaleXtime(d.date)});

 var forceY = d3.forceY()
    .y(function(d){return scaleYsent(d.sentiment)}); //向 y=h/2靠近

 var collide = d3.forceCollide()// collide 讓所有elements都不重疊
    .radius(3);

simulationT
        .force('charge',chargeForce)
        .force('positionX',forceX)
        .force('positionY',forceY)
        .force('collide',collide)
        .alpha(1)
        .restart()
        .on('tick',function(){
          
          plot.selectAll('.sent_Trump')
              .attr('transform',function(d){ 
           return 'translate('+ d.x+','+ d.y+')'});
         })
        .on('end',function(){
            console.log('simulation end');
        });


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
      .attr('transform','translate(0,'+(h/1.75)+')')
      .call(xAxis);
  plot.append('g').attr('class','axis axis-y') //line is "inserted" before area
      .attr('transform','translate(0,0)') 
      .call(yAxis);

}


//Title
function listTitle(plot,clinton,trump){

  
  //trump's title
  t = plot3titleT.select('.olTrump')
  .selectAll('.titleTrump')
  .data(trump);

  tEnter = t.enter()
  .append('li')
  .attr('class','titleTrump');

  t.merge(tEnter)
  .html(function(d){return d.title;})
  .on('mouseenter',function(d){
    console.log(this);
     d3.select(this)
       .classed('selected',true);

      dispatch.call('highlight',this,d.id);
      dispatch.on('highlight.titletrump',function(e){

        d3.selectAll('.sent_Trump')
          .filter(function(d){return e==d.id;})
          .classed('highlightedT',true)
          // .transition()
          .attr('r',15);

        d3.selectAll('.score')
          .html('Score: '+d.sentiment);

     });//dispatch.on
  })
  .on('mouseleave',function(d){
    d3.select(this)
      .classed('selected',false);

    d3.selectAll('.sent_Trump')
      .classed('highlightedT',false)
      .attr('r',5);
    
    d3.selectAll('.score')
      .html('Score');

  });

  t.exit().remove();

  
  //Clinton's title
  c = plot3titleC.select('.olClinton')
  .selectAll('.titleClinton')
  .data(clinton);

  cEnter = c.enter()
  .append('li')
  .attr('class','titleClinton');

  c.merge(cEnter)
  .html(function(d){return d.title;})
  .on('mouseenter',function(d){

     d3.select(this)
       .classed('selected',true);

     d3.selectAll('.score')
       .html('Score: '+d.sentiment);

     dispatch.call('highlight',this,d.id);
     dispatch.on('highlight.titleclinton',function(e){

      d3.selectAll('.sent_Clinton')
        .filter(function(d){return e==d.id;})
        .classed('highlightedC',true)
        // .transition()
        .attr('r',15);
     });//dispatch.on

  })
  .on('mouseleave',function(d){
    d3.select(this)
      .classed('selected',false);
    
    d3.selectAll('.sent_Clinton')
      .classed('highlightedC',false)
      .attr('r',5);
    
    d3.selectAll('.score')
      .html('Score');

  });

  c.exit().remove();



}




//Show and Hide
// d3.select('.bT')
//   .on('click',function(){

//     if(d3.selectAll('.sent_Trump').classed('selectedCircle')){
//       d3.selectAll('.sent_Trump').classed('selectedCircle',false)
//         .style('opacity',0.6);

//       d3.select('.bT').html('Hide Trump');
//     }else{


//       d3.selectAll('.sent_Trump').classed('selectedCircle',true)
//         .style('opacity',0);

//       d3.select('.bT').html('Show Trump');
//     }
    
//   })





function parseC(d){
   return {
     id:d['id'],
     date:parseTime(d.date),
     title:d['title'],
     text:d['text'],
     sentiment:d['sentiment'],
     url:d['url']
   };
}

function parseT(d){

   return {
     id:d['id'],
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
