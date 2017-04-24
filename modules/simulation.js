function Simulation(){

    var _data,
        _class;

    function exports(selection){

    	console.log(_class);

    	   var scaleXtime = d3.scaleTime()
               .domain([t0,t1])
               .range([0,w]);

           var scaleYsent = d3.scaleLinear()
               .domain([-0.5, 0.6])
               .range([h/2,0]);
 

	       var chargeForce = d3.forceManyBody()
	           .strength(0);// -30 is by defult(for forceManyBody)

	       var forceX = d3.forceX()
	           .x(function(d){return scaleXtime(d.date)});

	       var forceY = d3.forceY()
	           .y(function(d){return scaleYsent(d.sentiment)}); //向 y=h/2靠近

	       var collide = d3.forceCollide()// collide 讓所有elements都不重疊
	           .radius(3);

	       if(!simulation){
	       	var simulation = d3.forceSimulation(_data);
           }

		    simulation
		        .force('charge',chargeForce)
		        .force('positionX',forceX)
		        .force('positionY',forceY)
		        .force('collide',collide)
		        .alpha(1)
		        .restart()
		        .on('tick.position',function(){
		          
		          selection.selectAll(_class)
		              .attr('transform',function(d){ 
		           return 'translate('+ d.x+','+ d.y+')'});
		         })
		        .on('end',function(){
		            console.log('simulation end');
		        });


    }//exports
    
    exports.dataInput = function(_){
    	if(!arguments.length) return _data;
    	_data = _;
    	return this;
    }

    exports.class = function(_){
    	if(!arguments.length) return _class;
    	_class = _;
    	return this;
    }

    return exports;

}