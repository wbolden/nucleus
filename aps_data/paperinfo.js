var load_metadata_online = false;
var buildsearch = false;


var word_count = {};
var author_count = {};

//Timeout for generating paper stats
var timeout;

//Hashtable to convert from journal names to folder names quickly
var folderhash = {};
folderhash["PhysRev"] = "PR";
folderhash["PhysRevA"] = "PRA";
folderhash["PhysRevB"] = "PRB";
folderhash["PhysRevC"] = "PRC";
folderhash["PhysRevD"] = "PRD";
folderhash["PhysRevE"] = "PRE";
folderhash["PhysRevSeriesI"] =  "PRI";
folderhash["PhysRevLett"] = "PRL";
folderhash["PhysRevSTAB"] = "PRSTAB";
folderhash["PhysRevSTPER"] = "PRSTPER";
folderhash["PhysRevX"] = "PRX";
folderhash["PhysRevA"] = "PRA";
folderhash["RevModPhys"] = "RMP";

//Maps a vertex to a paper doi
//index with a vertex to get the path to that file in the metadata folder
var mapfile = [];

//Like mapfile, but just dois
var doifile = [];

//Maps a node index to a list of vertices, where each vertex represents a paper
var fakedb = {};

var titlefile = {};     //circles that contain title 
var authorfile = {};    //circles that contain author
var revfakedb = {};     //reverse of fakedb
var keywords = {};      //keyword count
var keywords_loc = {};  //circles that contain the keyword
var numIntersect = {};  //num of intersects a circle participates in

//Makes a doi into a filepath to load from the metadata file
//eg 10.1103/PhysRev.1.1 -> PA/1/PhysRev.1.1
//Stores result in mapfile by index

d3.tsv("map.txt", function(data) {
  for(var i = 0; i < data.length; i++){
    var doi = data[i].doi.split("/")[1];
    var subfolders = doi.split(".");
    subfolders[0] = folderhash[subfolders[0]];
    subfolders[2] = doi;
    mapfile[data[i].index] = subfolders.join("/").concat(".json");
    doifile[data[i].index] = data[i].doi;
  }
  console.log("loaded map");
}); 

d3.json("title_map.json", function(error, data){
    for(var i = 0; i < data.length; i++){
        titlefile[data[i].title] = data[i].paper_id; 
    }
    reverseFakedb();
    console.log("loaded revfakedb");
    console.log("loaded titles");

    if(buildsearch){
      for(var title in titlefile){
          str = title.split(" ");
          for(var j = 0; j<str.length; j++){
              str = removePunc(str);
              if(keywords[str[j]] == undefined){
                  keywords[str[j]] = 1;
                  keywords_loc[str[j]] = [];
                  keywords_loc[str[j]].push(titlefile[title]);
              }else{
                  keywords[str[j]]++;
                  keywords_loc[str[j]].push(titlefile[title]);
              }
          }
      }
      removeCommonWords(keywords);
      removeCommonWords(keywords_loc);
      /*
      for(var key in keywords){
          if(keywords[key] < 4){
              delete keywords[key];
          }
      }
       */
    }

    svg1.select("#loading")
        .remove();
    console.log("loaded keywords");
});

d3.json("author_map.json", function(error, data){
    for(var i = 0; i < data.length; i++){
        authorfile[data[i].author] = data[i].paper_ids; 
    }
    console.log("loaded authors");
});

//Stores the vertices corresponding to each node in the fakedb variable
d3.tsv("aps-citations_cleaned.mtx_34_IMPR_fakedb", function(data) {

  console.log(data, data[0].info, data[0],  data.length)

  for(var i = 0; i <data.length; i++){
    //console.log(i, data[i])
    var fields = data[i].info.split(" ");
    index = fields[0];

    if (fields.length > 1000) {
      fakedb[index] = [];
      continue;
    }

    //fields.remove(-1); //Remove last element, always a -1
    //fields.remove(0,5); //Remove first 5 elements to be left with vertices only

    fields = fields.slice(0, fields.length-1) //Remove last element, always a -1
    fields = fields.slice(5, fields.length); //Remove first 5 elements to be left with vertices only
    for(var v = 0; v < fields.length; v++){
      fields[v] = parseInt(fields[v]);
    }
    fakedb[index] = fields;
  }
  console.log(fakedb)
  console.log("loaded fakedb");     
});

//Removes common words from the provided dictionary
function removeCommonWords(dict){
  var words =  ['and','that','but','or','as','if','when','than',
                'because','while','where','after','so','though',
                'since','until','whether','before','although','to',
                'nor','like','once','unless','now','except','at',
                'the','of','on','an','in','with','a','for','from',
                'between','study','some','due','we','You','The',
                'A','Their'];
  for(var i = 0; i < words.length; i++){
    delete dict[words[i]];
  }
  return dict;
}

function removePunc(str){
    var punc = [',','"',':',"."]; 
    for(var i = 0; i < punc.length; i++){
        if(str.slice(-1) == punc[i]){
            str = str.slice(0,-1);
        }
    }
    return str;
}

//Strip html from text, useful when tags are used in json data
function stripHTML(string){
  var div = document.createElement("tempdiv");
  div.innerHTML = string;
  return div.innerText;
}



function display_paper_stats(){
  top_words = [];
  top_wfreq = [];
  top_authors = [];
  top_afreq = [];
  //console.log(word_count, author_count);
  word_count = removeCommonWords(word_count);
  var words_array = [];
  for(var word in word_count){
    words_array.push([word, word_count[word]]);
  }
  var authors_array = [];
  for(var author in author_count){
    authors_array.push([author, author_count[author]]);
  }
  words_array = words_array.sort(function(a,b){return b[1]-a[1];});
  authors_array = authors_array.sort(function(a,b){return b[1]-a[1];});
  var words = "<b>Common words:</b> ";
  var authors = "<b>Common authors:</b> ";
  for(var n = 0; n < 7; n++){
    words += words_array[n][0].concat(" (").concat(words_array[n][1]).concat(")");
    top_words.push(words_array[n][0]);
    top_wfreq.push(words_array[n][1]);
    top_authors.push(authors_array[n][0]);
    top_afreq.push(authors_array[n][1]);
    authors += authors_array[n][0].concat(" (").concat(authors_array[n][1]).concat(")");
    if(n < 7-1) {
      words = words.concat(", ");
      authors = authors.concat(", ");
    }
  }
  $("classifcation").innerHTML = words.concat("<br>").concat(authors).concat("<br><br>");
    //Remove old plot if it exists
    d3.select('#plot_svg').remove()
    d3.select('#plot_svg').remove()
    graph_words(top_words,top_wfreq,0);
  graph_words(top_authors,top_afreq,1);
 console.log(words_array, authors_array);
}

function get_paper_info_json(error, data) {
  var title = data.title.value;
  var title_words = stripHTML(title).split(" ");
  for(var n = 0; n < title_words.length; n++){
    var word = stripHTML(title_words[n]);
    if(word_count[word] == undefined){
      word_count[word] = 1;
    } else {
      word_count[word]++;
    }
  }


  //console.log(data)

  title = "<b>Title: </b>".concat(title).concat("<br>");
  var authors = "<b>Authors: </b>";
  for(var n = 0; n < data.authors.length; n++) {
    var author = stripHTML(data.authors[n].name);
    if(author_count[author] == undefined){
      author_count[author] = 1;
    } else {
      author_count[author]++;
    }
    authors = authors.concat(data.authors[n].name);
    if(n < data.authors.length-1){
      authors = authors.concat(", ");
    }
  }
  authors = authors.concat("<br>")
  var paperinfo = title.concat(authors)+"<b>Published:</b> "+data.date+"<br><br>";
  $('paperinfo').innerHTML += paperinfo;

  clearTimeout(timeout);
  timeout = setTimeout(display_paper_stats, 100);
}

function get_paper_info_bibtex(error, text) {    
    //Parse Data from Bibtex to json
    if (error) throw error;
    //var string = text.textContent; //parse document-fragment as a string
    var file = BibtexParser(text); //convert string to json
    data = file.entries[0].Fields;
      
    //Title Info
    var title = data.title;
    var title_words = stripHTML(title).split(" ");
    for(var n = 0; n < title_words.length; n++){
      var word = stripHTML(title_words[n]);
      if(word_count[word] == undefined){
        word_count[word] = 1;
      } else {
        word_count[word]++;
      }
    }
    title = "<b>Title: </b>".concat(title).concat("<br>");
      
    //Authors Info
    var authors = "<b>Authors: </b>";
    var authors_list = data.author.split(" and ");
    for(i = 0; i<authors_list.length; i++){
      authors_list[i] = authors_list[i].split(", ");
      authors_list[i].reverse();
      authors_list[i] = authors_list[i][0].concat(" ").concat(authors_list[i][1]);
    }
    for(var n = 0; n < authors_list.length; n++) {
      var author = stripHTML(authors_list[n]);
      if(author_count[author] == undefined){
        author_count[author] = 1;
      } else {
        author_count[author]++;
      }
      authors = authors.concat(authors_list[n]);
      if(n < authors_list.length-1){
        authors = authors.concat(", ");
      }
    }
    authors = authors.concat("<br>")
    var paperinfo = title.concat(authors)+"<b>Published:<b>"+data.date+"<br><br>";
    $('paperinfo').innerHTML += paperinfo;
    clearTimeout(timeout);
    timeout = setTimeout(display_paper_stats, 100);
}


//Loads all the authors associated with papers in a given node and displays them
function loadpapers(nodeindex){
  //Two hash tables holding info about the most common words and authors
  word_count = {};
  author_count = {};
  //Gets paper ids for all papers in nodeindex
  var vertices = fakedb[nodeindex];
  for(var i = 0; i < vertices.length; i++){

    var filepath;
    //Gets filepath to metadata from paperid
    if(!load_metadata_online){
      filepath = "aps-dataset-metadata-2013/".concat(mapfile[vertices[i]]);
    } else {
      filepath = "http://journals.aps.org/pr/export/".concat(doifile[vertices[i]]);
    }
    //console.log(filepath)
    //console.log(filepath);

    if(!load_metadata_online){
      d3.json(filepath, get_paper_info_json);
    } else {
      d3.text(filepath, get_paper_info_bibtex);
    }
  }
}

//Creates a map of all circles that contain paper A
//Ex: revfakedb[paper_id] = [circle1,circle2,...];
function reverseFakedb(){
    for (var index in fakedb){
        var slot = fakedb[index];
        for (var i = 0; i < slot.length; i++){
            if(revfakedb[slot[i]] == null){
                revfakedb[slot[i]] = [];
                revfakedb[slot[i]] = [index];
            }else{
                revfakedb[slot[i]].push(index);
            }
        }
    }
}

//creating a mapping for every circle that participates in an intersection
//Circle may participate in an intersection with different papers
//cirMap structure:
//  key = circle id
//  value of cirMap[key] = a dict of papers that circle id intersects with
//  Example: circle A intersects circle B and C, but intersection between A and B 
//  is different from the intersection between A and C. The intersections are 
//  categorized by paper, thus a dict of papers. 
//  value of cirMap[key][paper key] = an array of circle ids
function circleIntersecMap(papers){
    cirMap = {};
    for (var p_id in papers){
        for(var c_id in papers[p_id]){
            if(papers[p_id][c_id] == true){
                if(cirMap[c_id] == null){
                    numIntersect[c_id] = 0;
                    cirMap[c_id] = {};
                    cirMap[c_id][p_id] = [];
                    for(var oc_id in papers[p_id]){
                        if(oc_id != c_id){ 
                            cirMap[c_id][p_id].push(oc_id);
                            numIntersect[c_id]++;
                        }
                    }
                }else{
                    cirMap[c_id][p_id] = [];
                    for(var oc_id in papers[p_id]){
                        if(oc_id != c_id){
                            cirMap[c_id][p_id].push(oc_id);
                            numIntersect[c_id]++;
                        }
                    }
                }
            }
            
        }
    }
    return cirMap;
}

//display intersection for a selected node
function displayIntersections(d,cirMap){
    /*console.log(d);
    var colors = d3.scale.linear()
        .domain([1,2,3,4,5,6,7,8,9,10,11,12])
        .range(["#8dd3c7",
                "#ffffb3",
                "#bebada",
                "#fb8072",
                "#80b1d3",
                "#fdb462",
                "#b3de69",
                "#fccde5",
                "#d9d9d9",
                "#bc80bd",
                "#ccebc5",
                "#ffed6f"]);
    var color_index = 0*/
    for(var p_id in cirMap[d.index]){
        /*color_index++;*/
        /*console.log(p_id);
        console.log(cirMap[d.index][p_id]);*/
        for(var i = 0; i<cirMap[d.index][p_id].length; i++){
            c_id = cirMap[d.index][p_id][i];
            svg1.selectAll("#p".concat(c_id))
                .style("fill", function(d){
                    if(numIntersect[c_id] <= 9) return intersect_color(numIntersect[c_id]);
                    else{
                        return "#e41a1c";
                    }
                })
                .style("stroke-width",4)
                .style("stroke","yellow");
            /*var x = svg1.selectAll("#p".concat(c_id))[0][0].__data__.x;
            var y = svg1.selectAll("#p".concat(c_id))[0][0].__data__.y;
            svg1.append("line")
                .attr("id","intersection_line")
                .style("stroke",function(d) {return color(color_index);})
                .style("stroke-width", "3px")
                .attr("x1",d.x-diameter/2 +10)
                .attr("y1",d.y-diameter/2 +10)
                .attr("x2",x-diameter/2 +10)
                .attr("y2",y-diameter/2 +10);*/
        }
    }
}

//Colors all intersections
function colorIntersections(tot_papers){
    svg1.selectAll("circle")
        .style("fill", "white");
    for(var p_id in tot_papers){
        for(var c_id in tot_papers[p_id]){   
            if(tot_papers[p_id][c_id] == true){
                svg1.selectAll("#p".concat(c_id))
                    .style("fill", function(d){
                        if(numIntersect[c_id] <= 9) return intersect_color(numIntersect[c_id]);
                        else{
                            return "#e41a1c";
                        }
                    });
            }
        }
    }
}


function graph_words(words,freq,type){
    var data = {key: words, value: freq};
    for (var i = 0; i < data.value.length; i++) {
      data.value[i] = data.value[i] + i/10;
    }



    var margin = {top: 40, right: 20, bottom: 130, left: 40},
        width = screen.width/4.2 - margin.left - margin.right,
        height = screen.height/3 - margin.top - margin.bottom;




    var svg4 = d3.select("#charts").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "plot_svg");


    var svg5 = svg4.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
    var xScale = d3.scale.ordinal()
        .domain(d3.range(data.value.length))
        .rangeRoundBands([0, width], 0.1);
    var yScale = d3.scale.linear()
        .domain([0,d3.max(data.value)])
        .range([height, 0]);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    var yAxis = d3.svg.axis() 
        .scale(yScale)
        .orient("left")
        .ticks(5)
        .tickFormat(function(d){ return d; });
    var textScale = d3.scale.ordinal()
        .domain(d3.range(data.value.length))
        .range(data.key);
    svg5.selectAll("rect")
        .data(data.value, function(d) { console.log(d); return d; })
        .enter()
        .append("rect")
        .attr({
            "x": function(d, i) { console.log(i); return xScale(i); },
            "y": function(d, i) { console.log(d); return yScale(d - i/10); },
            "width": xScale.rangeBand(),
            "height": function(d, i) { return height - yScale(d - i/10); },
            "fill": type == 0 ? "blue" : "green"
        })
    svg5.selectAll("text")
       .data(data.value, function(d) { return d; })
       .enter()
       .append("text")
       .text(function(d,i) {
          return Math.round(d - i/10);
       })
       .attr({
          "x": function(d, i) { return xScale(i) + xScale.rangeBand()/2; }, 
          "y": function(d, i) { return yScale(d - i/10); }, 
          "font-size": "15px",    
          "fill": "black",  
          "text-anchor": "middle"
       })
    svg5.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-60)") //rotates the labels for readability 
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .style("text-anchor", "end")
        .attr("font-size", "15px")
        .text( function(d) { return textScale(d);});
    svg5.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0, 0)")
        .call(yAxis);
    svg5.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text(type == 0 ? "Common Words" : "Common Authors");
}


/*
function loadpapers(nodeindex){
  //Two hash tables holding info about the most common words and authors
  word_count = {};
  author_count = {};
  var timeout;
    
  //Gets paper ids for all papers in nodeindex
  var vertices = fakedb[nodeindex];
    
  for(var i = 0; i < vertices.length; i++){
    //Gets filepath to metadata from paperid
    d3.html(mapfile[vertices[i]], function(error, text) {   
        
      //Parse Data from Bibtex to json
      if (error) throw error;
      var string = text.textContent; //parse document-fragment as a string
      var file = BibtexParser(string); //convert string to json
      data = file.entries[0].Fields;
        
      //Title Info
      var title = data.title;
      var title_words = stripHTML(title).split(" ");
      for(var n = 0; n < title_words.length; n++){
        var word = stripHTML(title_words[n]);
        if(word_count[word] == undefined){
          word_count[word] = 1;
        } else {
          word_count[word]++;
        }
      }
      title = "<b>Title: </b>".concat(title).concat("<br>");
        
      //Authors Info
      var authors = "<b>Authors: </b>";
      var authors_list = data.author.split(" and ");
      for(i = 0; i<authors_list.length; i++){
        authors_list[i] = authors_list[i].split(", ");
        authors_list[i].reverse();
        authors_list[i] = authors_list[i][0].concat(" ").concat(authors_list[i][1]);
      }
      for(var n = 0; n < authors_list.length; n++) {
        var author = stripHTML(authors_list[n]);
        if(author_count[author] == undefined){
          author_count[author] = 1;
        } else {
          author_count[author]++;
        }
        authors = authors.concat(authors_list[n]);
        if(n < authors_list.length-1){
          authors = authors.concat(", ");
        }
      }
      authors = authors.concat("<br>")
      var paperinfo = title.concat(authors).concat("<br>");
      $('paperinfo').innerHTML += paperinfo;
      clearTimeout(timeout);
      timeout = setTimeout(function(){
        //console.log(word_count, author_count);
        word_count = removeCommonWords(word_count);
        var words_array = [];
        for(var word in word_count){
          words_array.push([word, word_count[word]]);
        }
        var authors_array = [];
        for(var author in author_count){
          authors_array.push([author, author_count[author]]);
        }
        words_array = words_array.sort(function(a,b){return b[1]-a[1];});
        authors_array = authors_array.sort(function(a,b){return b[1]-a[1];});
        var words = "<b>Common words:</b> ";
        var authors = "<b>Common authors:</b> ";
        for(var n = 0; n < 7; n++){
          words += words_array[n][0].concat(" (").concat(words_array[n][1]).concat(")");
          authors += authors_array[n][0].concat(" (").concat(authors_array[n][1]).concat(")");
          if(n < 7-1) {
            words = words.concat(", ");
            authors = authors.concat(", ");
          }
        }
        $("classifcation").innerHTML = words.concat("<br>").concat(authors).concat("<br><br>");
        console.log(words_array, authors_array);
      }, 100);
      
    });
  }
}
*/    
