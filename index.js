var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);
var $ = function( id ) { return document.getElementById( id ); };
var clicked_node;
var margin = 20,
    diameter = screen.height *12/13;
var den_label = "Edge Density";
var density_color = d3.scale.linear()
    .domain([0, 0.25, 0.5, 0.75, 1])
    .range(["#4eb3d3", "#fdd49e", "#fc8d59", "#d7301f", "#7f0000"])
    .interpolate(d3.interpolate);
var den_xScale = d3.scale.linear()
    .domain([0, 5])
    .range([0, 300]);
var inter_label = "Number of Intersections";
var intersect_color = d3.scale.linear()
    .domain([1,2,3,4,5,6,7,8,9])
    .range(["#4daf4a","#4daf4a","#377eb8","#377eb8","#ff7f00","#ff7f00","#984ea3","#984ea3","#e41a1c"]);
var intersect_color2 = d3.scale.linear()
    .domain([0,1,2,3,4,5,6,7,8])
    .range(["#4daf4a","#4daf4a","#377eb8","#377eb8","#ff7f00","#ff7f00","#984ea3","#984ea3","#e41a1c"]);
var inter_xScale = d3.scale.linear()
    .domain([0, 8])
    .range([0, 400]);
var pack = d3.layout.pack()
    .padding(2)
    .size([diameter - margin, diameter - margin])
    .value(function(d) { return d.size; })
var svg1 = d3.select("#dv_1").append("svg")
    .attr("width", screen.width - 2*margin)
    .attr("height", screen.height*12/13)
    .append("g")
    .attr("transform", "translate(" + screen.width/2 + "," + diameter/2 + ")");
svg1.append("text")
    .attr("id","loading")
    .text("Loading Data...");
/////////////////////////////Code for legend//////////////////////////////////////
var svg2 = d3.select("#legend").append("svg")
    .attr("width", screen.width/4 + margin)
    .attr("height", screen.height/8 + margin);
var svg3 = svg2.append("g")
    .attr("class", "key")
    .attr("transform", "translate("+ margin +","+ margin*2 +")");
function draw_legend(color, xScale, label){
    var formatNumber = d3.format(",d");
    var isDens = color.domain().length == 5 ? true : false;
    var densityScale = d3.scale.linear()
        .domain([0,1,2,3,4,5])
        .range([0.0,0.2,0.4,0.6,0.8,1.0])
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickSize(isDens ? 23 : 15)
        .tickValues(function(d) {
            if (isDens) {
                return densityScale.domain(); 
            }else{
                return color.domain();
            }
        })
        .tickFormat(function(d) { 
            if (isDens) {
                return densityScale(d);  
            }else{
                return formatNumber(d+1);
            }
            
        });
    svg3.selectAll("rect")
        .data(color.range().map(function(d, i) {
          return {
            x0: i*(xScale.range()[1]/(isDens ? 
                                      color.domain().length:
                                      color.domain().length-1)),
            x1: xScale.range()[1]/(isDens ? 
                                   color.domain().length:
                                   color.domain().length-1),
            z: d
          };
        }))
        .enter().append("rect")
        .attr("id","rect_legend")
        .attr("height", 15)
        .attr("x", function(d) { return d.x0; })
        .attr("width", function(d) { return isDens ? d.x1 : d.x1/2; })
        .style("fill", function(d) { return d.z; });

/*
    svg3.call(xAxis).append("text")      
        .attr("id","text_legend")
        .attr("y", -10)
        .attr("font-weight", "bold")
        .text(label); 
        */
}
function delete_legend(){
    svg3.selectAll("#rect_legend")
        .remove()
    svg3.selectAll("#text_legend")
        .remove()
}
//////////////////////////////////////////////////////////////////////////////////
/*var line = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        });*/
function filter(data, size){
  if(data.children == undefined) return;
  data.children = data.children.filter(function(a){return a.size>size;});
  for(var i = 0; i < data.children.length; i++){
    filter(data.children[i], size);
  }
}

var position;
var saveScale = null;
var saveTranslation = null;
var intersection_on = false;

d3.select("#submit_size").on("click", function() {
    var size = parseInt(document.getElementById("size_limiter").value);
    svg1.selectAll("circle")
        .remove();
    svg1.selectAll("text")
        .remove();
    /*svg1.selectAll("#intersection_line")
        .remove();*/
    delete_legend();
    if(!intersection_on){
        draw_legend(density_color, den_xScale, den_label);
    }else{
        draw_legend(intersect_color2, inter_xScale, inter_label);
    }
    redraw(size);
})


function redraw(size){
    d3.json("aps-citations_cleaned.mtx_34_IMPR_circle.json", function(error, root) {
        if (error) throw error;
        filter(root, size);
        var focus = root,
            nodes = pack.nodes(root),
            view;      
        var cirMap = {};
        var papers = [];
        var tot_papers = {};


        /*
        var text = svg1.selectAll("text")
        .data(nodes)
        .enter().append("text")
          .attr("class", "label")
          .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
          .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
          .text(function(d) { return "DOES THIS WORK" });
        */
        
        function find_intersections(parent){
          //console.log(parent);

          if(parent.children == undefined) return;

          for(var i = 0; i < parent.children.length; i++){
            var child = parent.children[i];
            var vertices = fakedb[child.index];
            if(vertices == undefined) {
              //console.log("No papers were registered for index", child.index);
              vertices = [];
            }

            for(var p = 0; p < vertices.length; p++){
              if(papers[vertices[p]] == undefined){
                papers[vertices[p]] = {};
              }

              //Delete the parent that references the paper
              delete papers[vertices[p]][parent.index];

              //Add the child that references the paper
              papers[vertices[p]][child.index] = true;
            }
            find_intersections(child);
          }
        };
        
        find_intersections(root);
        var length = 0;
        for(var i = 0; i<papers.length; i++){
            if(papers[i] != undefined){
                if(Object.keys(papers[i]).length >= 2) {
                    tot_papers[i] = papers[i];
                    length++;
                }
            } 
        }
        
        cirMap = circleIntersecMap(tot_papers);
        
        var circle = svg1.selectAll("circle")
            .data(nodes)      
            .enter().append("circle")      
            .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
            .attr("id",function(d) {
                id = d.index;
                id = "p".concat(String(id));
                return id;
                //return "TEMPID" //TODO
            })
            .style("fill", function(d) { 
                if (!intersection_on) 
                    {

                        return density_color(d.den);
                    }
                else{
                    //console.log(d)
                    if(numIntersect[d.index] == null) return "white";
                    if(numIntersect[d.index] <= 9){ 
                        return intersect_color(numIntersect[d.index]);
                    }else{
                        return "#e41a1c";
                    }
                }
            })    
            .on("click", function(d) { 
                if (d3.event.defaultPrevented != true){
                    
                    $('paperinfo').innerHTML =""; 
                    $("classifcation").innerHTML ="";
                    //loadpapers(d.index);
                    load_data(d.index);
                    clicked_node = d; //TODO: can remove this? Used in paperinfo, modified to use all of node not just node.name
                    if(intersection_on){
                        displayIntersections(d,cirMap);                   
                    }else if(intersection_on == false){
                        if (focus !== d) {
                            zoom(d), d3.event.stopPropagation();
                        }else{
                            zoom(root);;
                        }
                    }
                    
                }
            })
            .on("mouseover", function(d) {


                //TODO modify modify getDensity and related functions for upcoming changes

                //showTooltip(this,d.name,d.index);
                showTooltip(this,d);
                //svg1.select("#subgraph_id").text(parsename(d.name))

                if(d.den != 0.0 && intersection_on && numIntersect[d.index] != null){
                    svg1.selectAll("circle")
                        .style("fill", "white");
                    svg1.selectAll("#p".concat(d.index))
                        .style("fill", function(d){
                            if(numIntersect[d.index] <= 9) return intersect_color(numIntersect[d.index]);
                            else{
                                return "#e41a1c";
                            }
                        })
                    displayIntersections(d,cirMap);
                }
            })
            .on("mouseout", function(d) {
                hideTooltip();
                //TODO density/name here too
                if(d.den != 0.0 && intersection_on && numIntersect[d.index] != null){
                    /*svg1.selectAll("#intersection_line")
                        .remove();*/
                    svg1.selectAll("circle")
                        .style("stroke-width",1)
                        .style("stroke","black");
                    colorIntersections(tot_papers);
                }
            });





//TODO need to make it so text appear for all valid nodes, valid 
//if text side isn't too big or too small maybe? Or some weighted 
//function based on if inner nodes would have visible text

        var get_text_size = function(d){

            //console.log(d3.select(this).text())
            var id = d.index;

            var r = d3.select("#p"+id).attr("r");

            var radius = 0;
            if(r){
                radius = r;
            }


            console.log("radius: "+radius, "CTL: "+this.getComputedTextLength(), this)

            //TODO
            //return 4*(radius-8)/(d.cp.length) +"px"

            return Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 24) + "px";
            //return (radius - 8)/this.getComputedTextLength()*24 + "px"

            //console.log("JS way", $("p"+id).getAttribute("r"))

            //console.log("d3 way",r, r.attr("r"))

            return "40px"

        }

//TODO
        var text = svg1.selectAll("text")
          .data(nodes)
          .enter().append("text")
          .attr("class", "label")
          .style("fill-opacity", function(d) {
            return d.parent === root ? 1 : 0;
          })
          .style("display", function(d) {
            return d.parent === root ? null : "none";
          })
          .text(function(d) {
            return d.cp; //Would replace this with keyword getter
          })
          .style("font-size", function(d) {return d.r * (10/d.cp.length)/3})
          .attr("dy", ".35em")
          .attr("id", function(d){return "l"+d.index;});




 /*       
        svg1.append("text")
            .attr("id","subgraph_id")
            .style("font-size", "30px")
            .style("fill", intersection_on ? "black" : "white")
            .attr("x", -80)
            .attr("y", -300)
            .text(parsename(root.name));
*/

        
        d3.select("#change_mode").on("click", function(){
            delete_legend();
            if(intersection_on){
                intersection_on = false; 
                draw_legend(density_color, den_xScale, den_label);
                svg1.selectAll("circle")
                    .style("fill", function(d){
                        return density_color(d.den);
                    })
            }else{
                intersection_on = true;
                draw_legend(intersect_color2, inter_xScale, inter_label);
                colorIntersections(tot_papers);
                zoom(root);
            }
            svg1.selectAll("#subgraph_id")
                .style("fill", intersection_on ? "black" : "white")


/*            if(intersection_on){
                colorIntersections(tot_papers);
            }else{
                svg1.selectAll("circle")
                    .style("fill", function(d){
                        return density_color(d.color);
                    })
            }*/
        })
        
        d3.select("#find_data").on("click", function() {
            svg1.selectAll("circle")
                .style("stroke","black")
                .style("stroke-width",1)
            var target_circle = [];
            /*if (document.getElementById("paper").checked){
                var title = document.getElementById("get_input").value;
                target_circle = revfakedb[titlefile[title]];
                for(var i = 0; i<target_circle.length; i++){
                    svg1.selectAll('#p'.concat(target_circle[i]))
                        .style("stroke-width",4)
                        .style("stroke","yellow");
                }
            }else if (document.getElementById("author").checked){
                var author = document.getElementById("get_input").value;
                for(var j = 0; j<authorfile[author].length; j++){
                    if(revfakedb[authorfile[author][j]] != undefined){
                        target_circle = revfakedb[authorfile[author][j]];
                        for(var k = 0; k<target_circle.length; k++){
                            svg1.selectAll('#p'.concat(target_circle[k]))
                                .style("stroke-width",4)
                                .style("stroke","yellow");
                        }
                    }
                }
            }else if (document.getElementById("word").checked){*/
                var words = document.getElementById("get_input").value.split(" ");
                
                console.log(words);
                //Not quite intersection, intersection with the empty set does nothing
                function intersection(a,b){
                    if(a.length == 0){
                        return b;
                    }
                    if(b.length == 0){
                        return a;
                    }
                    return a.filter(function(n) {
                           return b.indexOf(n) !== -1;
                    });
                }                                  
                var papers = [];
                console.log(papers)

                for (var i = 0; i < words.length; i++){
                    console.log("words: ", i, words[i])
                    var newpapers = keywords_loc[words[i]];
                    if(newpapers == undefined){
                        newpapers = [];
                    }
                    papers = intersection(papers, newpapers);
                }
                console.log(papers)

                for(var i = 0; i<papers.length; i++){
                                                
                    if(revfakedb[papers[i]] != undefined){
                        target_circle = revfakedb[papers[i]];
                        console.log(target_circle);
                        for(var j = 0; j<target_circle.length; j++){
                            svg1.selectAll('#p'.concat(target_circle[j]))
                                .style("stroke-width",4)
                                .style("stroke","yellow");
                        }
                    }
                }
/*
            }*/
          })

          var zoom2 = d3.behavior.zoom()
                .scaleExtent([1, 100])
                .on("zoom", zoomed);
        
          svg1.call(zoom2);  

    //circle = circle.filter(function(d) {return (d.size >= 0) && (d.name != "")}); /
      circle = circle.filter(function(d) {return (d.size >= 1)}); //TODO: can remove name?
        
      var node = svg1.selectAll("circle, text");
/*      d3.select("#dv_1")
          .style("background", "rgb(255,255,255)")
          .on("click", function() { zoom(root); });*/
      zoomTo([root.x, root.y, root.r * 2 + margin]);
      zoom(root);
      function zoom(d) {
        var focus0 = focus; focus = d;
        circle.filter(function(d) {return ( d.parent === focus && focus !== root); })
            .style("stroke", "#000")
            .style("stroke-width", 4)
            .style("stroke-dasharray", "4,4");
        circle.filter(function(d) {return ( d === focus && focus !== root); })
            .style("stroke-width", 4)
            .style("stroke-dasharray", "40,40")
        circle.filter(function(d) {return ( (d.parent !== focus && d !== focus)); })
            .style("stroke", "#000")
            .style("stroke-width", 1.0)
            .style("stroke-dasharray", "none");


        var transition = d3.transition()
            //.duration(d3.event.altKey ? 7500 : 750)
            .duration(750)
            .tween("zoom", function(d) {
              var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
              return function(t) { zoomTo(i(t)); };
            });


        //TODO
        /*
          transition.selectAll("text")
            .filter(function(d) {
                //console.log(d)
              return d.parent === focus || this.style.display === "inline";
            })
            .style("fill-opacity", function(d) {
              return d.parent === focus ? 1 : 0;
            })
            .each("start", function(d) {
              if (d.parent === focus) this.style.display = "inline";
              console.log(this)
            })
            .each("end", function(d) {
              if (d.parent !== focus) this.style.display = "none";
            })

            */

            //.style("font-size", function(d) {return d.r/3});
            //;

            /*
            setTimeout(function() {
              d3.selectAll("text").filter(function(d) {
                return d.parent === focus || this.style.display === "inline";
              }).style("font-size", get_text_size);
            }, 500)
            */


      }
      



        



      function zoomTo(v) {
        var k = diameter / v[2]; view = v;
        node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
        circle.attr("r", function(d) { return d.r * k; });
        zoom2.scale(980 / (focus.r*2 + margin)); 
        position = zoom2.translate();
        zoom2.translate([0,0]);

        //svg1.selectAll("text").style( "font-size", function(d) {return d.r * (10/d.cp.length) *k/3 });
                    svg1.selectAll("text") //.style( "font-size", function(d) {return d.r * (10/d.cp.length) *k/3 })
                                    .attr("style", function(d){ 
                                        var fs = d.r * (10/d.cp.length) *k/3;
                                        fs = ";font-size:"+fs;

                                        /*
                                        //fs = fs + ";opacity:"+ Math.min(((d.r*k)/40),1.0);
                                        if (d.children == undefined || d.children.length == 0){
                                            if((d.r*k - 50) > 0){
                                                opacity = 1.0;
                                            }
                                        }
                                        //console.log(opacity)
                                        fs = fs + ";opacity:"+opacity; //+ Math.min(((d.r*k)/20),1.0);

                                        return "display:inline"+fs;

                                        */


                                        var minr = 30;
                                        var opacity = Math.min(d.r*k/minr, 1.0); 
                                        fs = fs + ";opacity:"+opacity;

                                        if(d.children == undefined || d.children.length == 0){
                                            if(d.r* k > minr){
                                                return "display:inline"+fs
                                            }else {
                                                for(var i = 0; i < d.parent.children.length; i++){
                                                    if (d.parent.children[i].r*k > minr){

                                                        
                                                        return "display:inline"+fs
                                                    }
                                                }
                                                return "display:none"+fs
                                            }
                                            
                                        }

                                        for(var i = 0; i < d.children.length; i++){
                                            var child = d.children[i];
                                            //console.log(child)
                                            if(child.r* k > minr){
                                                //console.log(child.r)
                                                return "display:none"+fs
                                            }
                                        }

                                            if(d.r* k > minr){
                                                return "display:inline"+fs
                                            }else {
                                                return "display:none"+fs
                                            }
                                        //console.log(d)

                                    });

      }

/*
        function set_text_visibility(parent){
            console.log("called")
            var parent_node = d3.select("#p"+parent.index)
            var parent_text = d3.select("#l"+parent.index)
            //console.log(parent_text)

            
            
            //d3.select(parent_text).attr("style", "display:none")

            if(parent.children == undefined || parent.children.length == 0) {
                if( +parent_node.attr("r") > 30){
                    parent_text.attr("style", "display:inline")
                }
                return;
            }

            var pass_count = 0
            for(var i = 0; i < parent.children.length; i++){
                var child = parent.children[i];

                var child_node = d3.select("#p"+child.index)

                if ( +child_node.attr("r") > 30){
                    pass_count++;
                }
            }

            //Hide the parent if 3 or more children, or all of its children, can be displayed
            if (pass_count >= Math.min(parent.children.length, 3)) {
                //if(parent != root){
                    parent_text.attr("style", "display:none")
                //}
            

                for(var i = 0; i < parent.children.length; i++){
                    var child = parent.children[i];
                    set_text_visibility(child);
                }
            }
        }
*/
      function zoomTo2(v) {


        

        var oldk = diameter / view[2];
        var k = diameter / v[2]; view = v;
        node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });

        //console.log(k, oldk)

        if (k != oldk){
            svg1.selectAll("text") //.style( "font-size", function(d) {return d.r * (10/d.cp.length) *k/3 })
                                    .attr("style", function(d){ 
                                        var fs = d.r * (10/d.cp.length) *k/3;
                                        fs = ";font-size:"+fs;

                                        /*
                                        var x = (d.r*k - 50);

                                        if(x < 0){
                                            x *= 0.5;
                                        }

                                        var opacity = Math.exp(-0.01*x*x)



                                        if (d.children == undefined || d.children.length == 0){
                                            if((d.r*k - 50) > 0){
                                                opacity = 1.0;
                                            }
                                        }

                                      

                                        //console.log(opacity)
                                        fs = "display:inline"+fs + ";opacity:"+opacity; //+ Math.min(((d.r*k)/20),1.0);


                                        return fs;
                                        */

                                        var minr = 30;
                                        var opacity = Math.min(d.r*k/minr, 1.0); 
                                        fs = fs + ";opacity:"+opacity;

                                        if(d.children == undefined || d.children.length == 0){
                                            if(d.r* k > minr){
                                                return "display:inline"+fs
                                            }else {
                                                for(var i = 0; i < d.parent.children.length; i++){
                                                    if (d.parent.children[i].r*k > minr){

                                                        
                                                        return "display:inline"+fs
                                                    }
                                                }
                                                return "display:none"+fs
                                            }
                                            
                                        }

                                        for(var i = 0; i < d.children.length; i++){
                                            var child = d.children[i];
                                            //console.log(child)
                                            if(child.r* k > minr){
                                                //console.log(child.r)
                                                return "display:none"+fs
                                            }
                                        }

                                            if(d.r* k > minr){
                                                return "display:inline"+fs
                                            }else {
                                                return "display:none"+fs
                                            }
                                        //console.log(d)

                                    });

            circle.attr("r", function(d) { return d.r * k; });  
        }
       // set_text_visibility(root);          
      } 

      function zoomed() {

        console.log("CALLED")
        if (intersection_on !== true){
            
            var s = zoom2.scale();
            var panVector = zoom2.translate();
            saveScale = s;
            saveTranslation = panVector;

            var panX = panVector[0];
            var panY = panVector[1];
            x = focus.x - (panX - position[0])/s;
            y = focus.y - (panY - position[1])/s;
            r = diameter/s;

            d3.transition()
                .duration(0)
                .tween("zoom", function() {
                    var i = d3.interpolateZoom(view, [x, y, r]);
                    return function(t) { zoomTo2(i(t)); };
                })
                //.selectAll("text")
                //.style("font-size", get_text_size);
            ;;  
        }

      };
    });
}
function openNav() {
    document.getElementById("mySidenav").style.width = "25vw";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
function showTooltip(c, node){

    //TODO


    var density = node.den;
    var size = node.size;
    var word = node.cp;
    var author = node.ca;

    //if (density == undefined){
        //console.log(node)
    //}

    var matrix = c.getScreenCTM()
        .translate(+c.getAttribute("cx"),+c.getAttribute("cy"));
    tooltip.transition().duration(200).style("opacity", .9);

    tooltip.html("</p><p class='center-align'>Top Word: " + word +
                     "</p><p class='left-align'>Papers:<span class='right-align'>" + size +
                     "</p><p class='left-align'>Density:<span class='right-align'>" + density +    
                     "</p><p class='left-align'>Num Interescts:<span class='right-align'>" + numIntersect[node.index] +
                     "</p><p class='left-align'>Top Author:<span class='right-align'>" + author)
        .style("left", window.pageXOffset + matrix.e + "px")     
        .style("top", window.pageYOffset + matrix.f + "px");





/*    var density = getDensity(data);
    var size = getSize(data);*/
   // get_first_stat(c, node);
/*    var matrix = c.getScreenCTM()
        .translate(+c.getAttribute("cx"),+c.getAttribute("cy"));
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html(
                 "</p><p class='left-align'>Papers:<span class='right-align'>" + size +
                 "</p><p class='left-align'>Density:<span class='right-align'>" + density)
        .style("left", window.pageXOffset + matrix.e + "px")     
        .style("top", window.pageYOffset + matrix.f + "px");*/
};
function hideTooltip(){
    console.log("hide");
    tooltip.transition().duration(200).style("opacity", 0);
};
d3.select(self.frameElement).style("height", diameter + "px");
