
//First, append <svg> element and implement the margin convention
var m = {t:25,r:25,b:25,l:25};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot1 = d3.select('.plot1')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight/5.2*3)
    .append('g')
    .attr('transform','translate(' + m.l + ',10)');

var plot2 = d3.select('.plot2')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight/7*2)
    .append('g')
    .attr('transform','translate(' + m.l + ',10)');

var plot3titleT = d3.select('.plot3')
    .select('.titleT');

var plot3titleC = d3.select('.plot3')
    .select('.titleC');

var dispatch = d3.dispatch('highlightCircle','hightlightTitle');

var sent, brushAll;

//about block
d3.select('.about')
  .on('click',function(){
    d3.select('.aboutContent').style('display','block');
  })
d3.select('.close')
  .on('click',function(){
    d3.select('.aboutContent').style('display','none');
  })



//Import data and parse
d3.queue()
  .defer(d3.csv,'data/clinton4.csv',parseC)
  .defer(d3.csv,'data/trump4.csv',parseT)
  .await(dataLoaded);

function dataLoaded(err, clinton, trump){
 
  var t0 = new Date(2016,3,1), t1 = new Date(2017,2,31),
      brushAll = [t0,t1];

  drawTimeline(plot2,clinton,trump);
  drawSentiment(plot1,clinton, trump,brushAll);
  listTitle(plot3,clinton,trump);

     //button Trump
    d3.select('.btnT')
      .on('click',function(d){
     
         if(d3.select(this).classed('hidedBtnT')){
              d3.select(this).classed('hidedBtnT',false)
                .html('Trump selected');
              d3.selectAll('.sent_Trump')
                .transition()
                .attr('r','5px');

           }else{
              d3.select(this).classed('hidedBtnT',true)
                .html('Select Trump');
              d3.selectAll('.sent_Trump')
                .transition()
                .attr('r','0px');
              
           }
    })//btnT

    //button Clinton
    d3.select('.btnC')
      .on('click',function(d){
     
         if(d3.select(this).classed('hidedBtnC')){
              d3.select(this).classed('hidedBtnC',false)
                .html('Clinton selected');
              d3.selectAll('.sent_Clinton')
                .transition()
                .attr('r','5px');

           }else{
              d3.select(this).classed('hidedBtnC',true)
                .html('Select Clinton');
              d3.selectAll('.sent_Clinton')
                .transition()
                .attr('r','0px');
              
           }
    })//btnC

}


function drawTimeline(plot, clinton, trump){

  var t0 = new Date(2016,3,1), t1 = new Date(2017,2,31);
      tThresholds = d3.timeDay.range(t0,t1,1);//interval.range(start, stop[, step]

 //histogram
  var histogramDate = d3.histogram()
      .domain([t0,t1])
      .value(function(d){return d.date})
      .thresholds(tThresholds);

//scale
  var scaleXtime = d3.scaleTime()
      .domain([t0,t1])
      .range([0,w]);

  var scaleYcountT = d3.scaleLinear()
      .domain([0,9])
      .range([50,0]);

  var scaleYcountC = d3.scaleLinear()
      .domain([13,0])
      .range([125,50]);

//set area
  var areaT = d3.area()
    .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
    .y1(function(d){return scaleYcountT(d.length)})
    .y0(50);

  var areaC = d3.area()
    .x(function(d){return scaleXtime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
    .y0(function(d){return scaleYcountC(d.length)})
    .y1(50);

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

//draw event line
  plot.append('line')
      .attr('x1',function(){return scaleXtime(new Date(2016,10,8))})
      .attr('x2',function(){return scaleXtime(new Date(2016,10,8))})
      .attr('y1',5)
      .attr('y2',115)
      .style('stroke-width','2px')
      .style('stroke','#3AB795');
  
  plot.append('text')
      .attr('x',function(){return scaleXtime(new Date(2016,10,8))})
      .attr('y',0)
      .text('2016 Presidential Election')
      .style('fill','#26755f')

    //Refer to API here: https://github.com/d3/d3-brush
  var brush = d3.brushX()
      .on('end',brushend);

  plot.append('g').attr('class','brush')
      .call(brush);

  function brushend(){
    if(!d3.event.selection){
      //if brush is cleared, then selected range will be empty
      return;
    }
    // console.log('selected range of the brush (in terms of screen pixels) is ' + d3.event.selection);
    // console.log('selected range of the brush (in terms of time of day) is ' + d3.event.selection.map(scaleXtime.invert));
    
    var brushedArea = d3.event.selection.map(scaleXtime.invert);
    var brushedTrump = crossfilter(trump)
        .dimension(function(d){return d.date;})
        .filterRange(brushedArea)
        .top(Infinity);
    
    var brushedClinton = crossfilter(clinton)
        .dimension(function(d){return d.date;})
        .filterRange(brushedArea)
        .top(Infinity);
    
    var startDate = (brushedArea[0].getMonth()+1) +'/'+ brushedArea[0].getDate()+'/'+ brushedArea[0].getFullYear();
    var endDate = (brushedArea[1].getMonth()+1) +'/'+ brushedArea[1].getDate()+'/'+ brushedArea[1].getFullYear();
    var brushedDate = [startDate + ' to '+endDate]

    d3.select('.brushHint').html('You just selected ' + brushedDate);

    drawSentiment(plot1,brushedClinton, brushedTrump, brushedArea);
    listTitle(plot3,brushedClinton,brushedTrump);
    
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
    .attr('transform','translate(0,140)')
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
     .html('Trump selected');

   d3.select('.btnC')
     .classed('hidedBtnC',false)
     .html('Clinton selected');

   d3.select('.axis-x').remove();
   d3.select('.axis-y').remove();

   var t0 = new Date(brush[0].getFullYear(),brush[0].getMonth(),brush[0].getDate());
       t1 = new Date(brush[1].getFullYear(),brush[1].getMonth(),brush[1].getDate());
    
//text
  d3.selectAll('.sentText').remove();

  plot.append('text')
      .attr('class','sentText')
      .attr('x',-20)
      .attr('y',10)
      .text('Sentiment score: 0 is neutral. The closer to .5, the more positive; the closer to -.5, the more negative.')
      .style('fill','#494850');

//histogram
   var histogramDate = d3.histogram()
       .domain([t0,t1])
       .value(function(d){return d.date})
       .thresholds(tThresholds);

//scale
   var scaleXtime = d3.scaleTime()
       .domain([t0,t1])
       .range([0,w]);

   var scaleYsent = d3.scaleLinear()
       .domain([-0.5, 0.6])
       .range([h/2,0]);

   var nodeC = plot.selectAll('.sent_Clinton')
       .data(clinton,function(d){return d.id});

   var nodeCenter = nodeC.enter()
       .append('circle')
       .attr('class','sent_Clinton')
       .on('mouseenter',function(d){
            
            d3.select(this).classed('highlightedC',true)
              .attr('r',15);

             dispatch.call('hightlightTitle',this,d.id);
             dispatch.on('hightlightTitle.clinton',function(e){

               d3.selectAll('.titleClinton')
                 // .filter(function(d){
                 //  return e==d.id;})
                 .classed('selectedC',function(d){ return e == d.id; });

               var li = document.getElementById(e);
               console.log("li", li);
               li.scrollIntoView(true);

             });//dispatch.on

            if(d.sentiment > 0){
                sent = 'Positive';
               } else if (d.sentiment <0){
                sent = 'Negative';
               } else {
                sent = 'Neutral'
               }

            d3.selectAll('.score')
                 .html('Score: '+d.sentiment+'  '+sent);

       })
       .on('mouseleave',function(d){
            d3.select(this).classed('highlightedC',false)
              .attr('r',5);

            d3.selectAll('.titleClinton')
              .classed('selectedC',false);

            d3.selectAll('.score')
              .html('Score');

       });

   nodeC.merge(nodeCenter)
        .attr('r','5px')
        .style('opacity',.7)
        .style('fill','#232066');
   
   nodeC.exit().remove();

   var chargeForceC = d3.forceManyBody()
    .strength(0);// -30 is by defult(for forceManyBody)

   var forceXC = d3.forceX()
    .x(function(d){return scaleXtime(d.date)});

   var forceYC = d3.forceY()
    .y(function(d){return scaleYsent(d.sentiment)}); //向 y=h/2靠近

   var collideC = d3.forceCollide()// collide 讓所有elements都不重疊
    .radius(3);

   if(!simulationC){
      var simulationC = d3.forceSimulation();
   }

  simulationC
        .force('charge',chargeForceC)
        .force('positionX',forceXC)
        .force('positionY',forceYC)
        .force('collide',collideC)
        .alpha(1)
        .nodes(clinton)
        .restart()
        .on('tick.position',function(){
          
          plot.selectAll('.sent_Clinton')
              .attr('transform',function(d){ 
           return 'translate('+ d.x+','+ d.y+')'});
         });


//Trump
   var nodeT = plot.selectAll('.sent_Trump')
       .data(trump,function(d){return d.id})

   var nodeTenter = nodeT.enter()
       .append('circle')
       .attr('class','sent_Trump')
       .on('mouseenter',function(d){
 
            d3.select(this).classed('highlightedT',true)
              .attr('r',15);

             dispatch.call('hightlightTitle',this,d.id);
             dispatch.on('hightlightTitle.trump',function(e){

               d3.selectAll('.titleTrump')
                 .filter(function(d){return e==d.id;})
                 .classed('selectedT',true);

                 var li = document.getElementById(e);
                 li.scrollIntoView(true);

             });//dispatch.on
           

           if(d.sentiment > 0){
                sent = 'Positive';
               } else if (d.sentiment <0){
                sent = 'Negative';
               } else {
                sent = 'Neutral'
               }

           d3.selectAll('.score')
                 .html('Score: '+d.sentiment + '  '+sent);

       })
       .on('mouseleave',function(d){
            d3.select(this).classed('highlightedT',false)
              .attr('r',5);

            d3.selectAll('.titleTrump')
              .classed('selectedT',false);

            d3.selectAll('.score')
              .html('Score');

       });
  
   nodeT.merge(nodeTenter)
        .attr('r','5px')
        .style('opacity',.7)
        .style('fill','#E91D0E');
  
   nodeT.exit().remove();
   

   if(!simulationT){
      var simulationT = d3.forceSimulation();
   }

   var chargeForceT = d3.forceManyBody()
    .strength(0);// -30 is by defult(for forceManyBody)

   var forceXT = d3.forceX()
    .x(function(d){return scaleXtime(d.date)});

   var forceYT = d3.forceY()
    .y(function(d){return scaleYsent(d.sentiment)}); //向 y=h/2靠近

   var collideT = d3.forceCollide()// collide 讓所有elements都不重疊
    .radius(3);


  simulationT
        .force('charge',chargeForceT)
        .force('positionX',forceXT)
        .force('positionY',forceYT)
        .force('collide',collideT)
        .alpha(1)
        .nodes(trump)
        .restart()
        .on('tick',function(){
          
          plot.selectAll('.sent_Trump')
              .attr('transform',function(d){ 
           return 'translate('+ d.x+','+ d.y+')'});
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
      .attr('transform','translate(0,'+(h/2+10)+')')
      .call(xAxis);
  plot.insert('g','circle').attr('class','axis axis-y') //line is "inserted" before area
      .attr('transform','translate(0,0)') 
      .call(yAxis);

}//drawSentiment


//Title
function listTitle(plot,clinton,trump){

  //trump's title
  t = plot3titleT.select('.olTrump')
  .selectAll('.titleTrump')
  .data(trump, function(d) { return d.id; });
  t.exit().remove();

  tEnter = t.enter()
  .append('li')
  .attr('class','titleTrump')
  .attr('id',function(d){return d.id});

  t.merge(tEnter)
  .html(function(d){return d.title;});


  d3.selectAll('.titleTrump')
    .on('mouseenter',function(d){
   
       d3.select('.btnT').classed('hidedBtnT',false)
         .html('Trump selected');
       
       d3.select(this)
         .classed('selectedT',true);

       dispatch.call('highlightCircle',this,d.id);
       dispatch.on('highlightCircle.trump',function(e){

        d3.selectAll('.sent_Trump')
          .filter(function(d){return e==d.id;})
          .classed('highlightedT',true)
          // .transition()
          .attr('r',15);

     });//dispatch.on

     if(d.sentiment > 0){
          sent = 'Positive';
         } else if (d.sentiment <0){
          sent = 'Negative';
         } else {
          sent = 'Neutral'
         }

      d3.selectAll('.score')
        .html('Score: '+d.sentiment + '  ' +sent);
  })
  .on('click',function(d){
     window.open(d.url, '_blank');
  })
  .on('mouseleave',function(d){
    d3.select(this)
      .classed('selectedT',false);

    d3.selectAll('.sent_Trump')
      .classed('highlightedT',false)
      .attr('r',5);
    
    d3.selectAll('.score')
      .html('Score');

  });

  
  //Clinton's title
  c = plot3titleC.select('.olClinton')
  .selectAll('.titleClinton')
  .data(clinton, function(d) { return d.id; });
  c.exit().remove();

  cEnter = c.enter()
  .append('li')
  .attr('class','titleClinton')
  .attr('id',function(d){return d.id});

  c.merge(cEnter)
  .html(function(d){return d.title;})
  .on('mouseenter',function(d){

     d3.select('.btnC').classed('hidedBtnC',false)
         .html('Clinton selected');

     d3.select(this)
       .classed('selectedC',true);


     dispatch.call('highlightCircle',this,d.id);
     dispatch.on('highlightCircle.clinton',function(e){
      
      d3.selectAll('.sent_Clinton')
        .filter(function(d){return e==d.id;})
        .classed('highlightedC',true)
        .attr('r',15);

     });//dispatch.on

     
     if(d.sentiment > 0){
          sent = 'Positive';
         } else if (d.sentiment <0){
          sent = 'Negative';
         } else {
          sent = 'Neutral'
         }

    d3.selectAll('.score')
        .html('Score: '+d.sentiment + '  ' +sent);

  })
  .on('click',function(d){
     window.open(d.url, '_blank');
  })
  .on('mouseleave',function(d){
    d3.select(this)
      .classed('selectedC',false);
    
    d3.selectAll('.sent_Clinton')
      .classed('highlightedC',false)
      .attr('r',5);
    
    d3.selectAll('.score')
      .html('Score');

  });

}



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
