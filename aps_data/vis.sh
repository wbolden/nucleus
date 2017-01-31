#dim=$(((dim - 100)/$#))
var=$1
if [ "$var" -eq "$var" ] 2>/dev/null; then filter=$1;dm=$(($#-1));shift; else filter=0;dm=$#; fi

dim1=`xdpyinfo|grep dimensions| awk -F'[:xp]' '{print $3}'` #height
dim2=`xdpyinfo|grep dimensions| awk -F'[:x]' '{print $2}'|awk '{print $1}'` #width
dim1=$((dim1-100))
dim2=$(((dim2-100)/$#))
dim=$dim1
if [[ $dim2 -lt $dim1 ]]
  then  dim=$dim2
fi

tmp="tmp.html"
echo "" >$tmp
echo "
<!DOCTYPE html>
<meta charset=\"utf-8\">
<style>

.node {
  cursor: pointer;
  stroke: #000;
  stroke-width: 0.1px;  
}

.node:hover {
  stroke: #000 !important;
  stroke-width: 8px !important;
}

.node--leaf {
  fill: white;
}

.label {
  font: 16px \"Helvetica Neue\", Helvetica, Arial, sans-serif;
  text-anchor: middle;
  text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 -1px 0 #fff;
}

.label,
.node--root {
  pointer-events: none;
}

</style>
<body>
    <div class=\"container\" style=\"width: 100%;\">" >>$tmp
    
i=1;
for arg in "$@"
do
    echo "
    <div id=\""dv_$i"\" style=\"width: "$dim"px; float: left;\">
        <center>"$arg"</center>
    </div>" >>$tmp;
    i=$((i+1));
done

echo "

    <div id=\"info\" style=\"width: 500px;float: left; background-color: white;\">
    <center><b>Paper Information:</b></center><br>
    <div id=\"classifcation\"></div>
    </div>

    <div id=\"paperinfo\" style=\"width: 500px; height:800px;float: left; background-color: white; overflow-y:scroll;\"></div>


</div>  
</body>

<script src=\"http://d3js.org/d3.v3.min.js\"></script>
<script>

var $ = function( id ) { return document.getElementById( id ); };

var margin = 20,
    diameter = "$dim";

var color = d3.scale.linear()
    .domain([0, 1, 2, 3, 4])
    .range([\"rgb(0,0,255)\", \"rgb(0,255,255)\", \"rgb(0,255,0)\", \"rgb(255,255,0)\", \"rgb(255,0,0)\"])
    .interpolate(d3.interpolate);

var pack = d3.layout.pack()
    .padding(2)
    .size([diameter - margin, diameter - margin])
    .value(function(d) { return d.size; })" >>$tmp
    
i=1;
for arg in "$@"
do
    echo "
var svg"$i" = d3.select(\"#"dv_$i"\").append(\"svg\")
    .attr(\"width\", diameter)
    .attr(\"height\", diameter)
    .append(\"g\")
    .attr(\"transform\", \"translate(\" + diameter / 2 + \",\" + diameter / 2 + \")\");" >>$tmp
    i=$((i+1));
done



i=1;
for arg in "$@"
do
    echo "

function filter(data, size){
  if(data.children == undefined) return;
  data.children = data.children.filter(function(a){return a.size>size;});
  for(var i = 0; i < data.children.length; i++){
    filter(data.children[i], size);
  }
}

//Parses the existing namestring to remove unwanted values
function parsename(str) {
  var split = str.split(\" \");
  var density = parseFloat(split[1]);
  if(density == -1.0){
    split[1] = \"<0.01\";
  }
  if(split[0] == \"4294967277\"){
  	split[0] = \"Not recorded\"
  }
  split[0] = split[0].concat(\" \");
  return split[0].concat(split[1])                     
}
//Hashtable to convert from journal names to folder names quickly
var folderhash = {};
folderhash[\"PhysRev\"] = \"PR\";
folderhash[\"PhysRevA\"] = \"PRA\";
folderhash[\"PhysRevB\"] = \"PRB\";
folderhash[\"PhysRevC\"] = \"PRC\";
folderhash[\"PhysRevD\"] = \"PRD\";
folderhash[\"PhysRevE\"] = \"PRE\";
folderhash[\"PhysRevSeriesI\"] =  \"PRI\";
folderhash[\"PhysRevLett\"] = \"PRL\";
folderhash[\"PhysRevSTAB\"] = \"PRSTAB\";
folderhash[\"PhysRevSTPER\"] = \"PRSTPER\";
folderhash[\"PhysRevX\"] = \"PRX\";
folderhash[\"PhysRevA\"] = \"PRA\";
folderhash[\"RevModPhys\"] = \"RMP\";

//Maps a vertex to a paper doi
//index with a vertex to get the path to that file in the metadata folder
var mapfile = [];

//Maps a node index to a list of vertices, where each vertex represents a paper
var fakedb = {};

//Makes a doi into a filepath to load from the metadata file
//eg 10.1103/PhysRev.1.1 -> PA/1/PhysRev.1.1
//Stores result in mapfile by index
d3.tsv(\"map.txt\", function(data) {
  for(var i = 0; i < data.length; i++){
    var doi = data[i].doi.split(\"/\")[1];
    var subfolders = doi.split(\".\");
    subfolders[0] = folderhash[subfolders[0]];
    subfolders[2] = doi;

    mapfile[data[i].index] = subfolders.join(\"/\").concat(\".json\");

  }
  console.log(\"loaded map\");
});

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

//Stores the vertices corresponding to each node in the fakedb variable
d3.tsv(\"aps-citations_cleaned.mtx_23_IMPR_fakedb\", function(data) {
  for(var i = 0; i <data.length; i++){
    var fields = data[i].info.split(\" \");
    index = fields[0];
    fields.remove(-1); //Remove last element, always a -1
    fields.remove(0, 5); //Remove first 5 elements to be left with vertices only
    for(var v = 0; v < fields.length; v++){
      fields[v] = parseInt(fields[v]);
    }
    fakedb[index] = fields;
  }
  console.log(\"loaded fakedb\");
});


function removeCommonWords(dict){
  var words =  ['and','that','but','or','as','if','when','than',
                'because','while','where','after','so','though',
                'since','until','whether','before','although',
                'nor','like','once','unless','now','except','at',
                'the','of','on','an','in','with','a','for','from'];

  for(var i = 0; i < words.length; i++){
    delete dict[words[i]];
  }
  return dict;
}

function stripHTML(string){
  var div = document.createElement(\"tempdiv\");
  div.innerHTML = string;
  return div.innerText;
}


//Loads all the authors associated with papers in a given node and displays them
function loadpapers(nodeindex){
  //Two hash tables holding info about the most common words and authors
  word_count = {};
  author_count = {};

  var timeout;


  //Gets paper ids for all papers in nodeindex
  var vertices = fakedb[nodeindex];
  for(var i = 0; i < vertices.length; i++){
    //Gets filepath to metadata from paperid
    var filepath = \"aps-dataset-metadata-2013/\".concat(mapfile[vertices[i]]);
    //console.log(filepath);
    d3.json(filepath, function(error, data) {
      var title = data.title.value;

      var title_words = stripHTML(title).split(\" \");
      for(var n = 0; n < title_words.length; n++){
        var word = stripHTML(title_words[n]);
        if(word_count[word] == undefined){
          word_count[word] = 1;
        } else {
          word_count[word]++;
        }
      }


      title = \"<b>Title: </b>\".concat(title).concat(\"<br>\");


      var authors = \"<b>Authors: </b>\";
      for(var n = 0; n < data.authors.length; n++) {

        var author = stripHTML(data.authors[n].name);
        if(author_count[author] == undefined){
          author_count[author] = 1;
        } else {
          author_count[author]++;
        }

        authors = authors.concat(data.authors[n].name);
        if(n < data.authors.length-1){
          authors = authors.concat(\", \");
        }
      }
      authors = authors.concat(\"<br>\")

      var paperinfo = title.concat(authors).concat(\"<br>\");
      \$('paperinfo').innerHTML += paperinfo;

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

        var words = \"<b>Common words:</b> \";
        var authors = \"<b>Common authors:</b> \";
        for(var n = 0; n < 7; n++){
          words += words_array[n][0].concat(\" (\").concat(words_array[n][1]).concat(\")\");
          authors += authors_array[n][0].concat(\" (\").concat(authors_array[n][1]).concat(\")\");

          if(n < 7-1) {
            words = words.concat(\", \");
            authors = authors.concat(\", \");
          }
        }

        \$(\"classifcation\").innerHTML = words.concat(\"<br>\").concat(authors).concat(\"<br><br>\");

        console.log(words_array, authors_array);

      }, 100);
      
    });
  }
}

d3.json(\""$arg"\", function(error, root) {
  if (error) throw error;
  filter(root, "$filter");
  var focus = root,
      nodes = pack.nodes(root),
      view;

  var circle = svg"$i".selectAll(\"circle\")
      .data(nodes)      
    .enter().append(\"circle\")      
      .attr(\"class\", function(d) { return d.parent ? d.children ? \"node\" : \"node node--leaf\" : \"node node--root\"; })
      .style(\"fill\", function(d) { return color(d.color); })      
      .on(\"click\", function(d) {                       
                      \$('paperinfo').innerHTML =\"\"; 
                      \$(\"classifcation\").innerHTML =\"\";
                      loadpapers(d.index);

      								if (focus !== d) zoom(d), d3.event.stopPropagation(),
                                        svg1.select(\"#subgraph_id\")
                                            .text(parsename(d.name));
                                   else
                                        svg1.select(\"#subgraph_id\")
                                            .text(parsename(root.name));
                                    
      })
      .on(\"mouseover\", function(d) {svg1.select(\"#subgraph_id\").text(parsename(d.name))});

  var zoom2 = d3.behavior.zoom()
        .scaleExtent([1, 100])
        .on(\"zoom\", zoomed);

  svg1.call(zoom2);  

  svg1.append(\"text\")
    .style(\"font-size\", \"30px\")
    .style(\"fill\", \"white\")
    .attr(\"class\", \"mytext\")
    .attr(\"x\", -80)
    .attr(\"y\", -300)
    .attr(\"id\",\"subgraph_id\")
    .text(parsename(root.name));
    
  circle = circle.filter(function(d) {return (d.size >= "0") && (d.name != \"\")});
//#      .style(\"stroke-dasharray\", \"5,5\", \"important\");
//#      .style(\"stroke\", \"#000\", \"important\")
//#      .style(\"stroke-width\", 1, \"important\");
  /*
  var text = svg"$i".selectAll(\"text\")
      .data(nodes)
    .enter().append(\"text\")
      .attr(\"class\", \"label\")
      .style(\"fill-opacity\", function(d) { return d.parent === root ? 1 : 0; })
      .style(\"display\", function(d) { return (d.parent === root && d.size >= "0") ? \"inline\" : \"none\"; })
      .text( function(d) { return d.name; });

  text = text.filter(function(d) {return (d.size >= "0")});
  */
  var node = svg"$i".selectAll(\"circle\");

  d3.select(\"#"dv_$i"\")
      .style(\"background\", \"rgb(255,255,255)\")
      .on(\"click\", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;


    circle.filter(function(d) {return (d.fl == \""$arg"\" && d.parent === focus && focus !== root); })
//#    .style(\"stroke-dasharray\", \"5,5\");
    .style(\"stroke\", \"#000\")
    .style(\"stroke-width\", 4)
    .style(\"stroke-dasharray\", \"4,4\");

    circle.filter(function(d) {return (d.fl == \""$arg"\" && d === focus && focus !== root); })
//#    .style(\"stroke-dasharray\", \"10,10\");
// #    .style(\"stroke\", \"rgb(255,255,255)\")
    .style(\"stroke-width\", 4)
    .style(\"stroke-dasharray\", \"40,40\");

    circle.filter(function(d) {return (d.fl == \""$arg"\" && (d.parent !== focus && d !== focus)); })
    .style(\"stroke\", \"#000\")
    .style(\"stroke-width\", 0.5)
    .style(\"stroke-dasharray\", \"none\");
    


    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween(\"zoom\", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });
  
	/*
    transition.selectAll(\"text\")
      .filter(function(d) { return (d.size >= "0" && d.fl == \""$arg"\" &&
      (d.parent === focus || (d === focus && d.children == null) || this.style.display === \"inline\")); })
        .style(\"fill-opacity\", function(d) { return (d.parent === focus || (d === focus && d.children == null))? 1 : 0; })
        .each(\"start\", function(d) { if (d.parent === focus || (d === focus && d.children == null)) this.style.display = \"inline\"; })
        .each(\"end\", function(d) { if (d.parent !== focus && (d !== focus && d.children == null)) this.style.display = \"none\"; });
     */
  }

  var position;
  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr(\"transform\", function(d) { return \"translate(\" + (d.x - v[0]) * k + \",\" + (d.y - v[1]) * k + \")\"; });
    circle.attr(\"r\", function(d) { return d.r * k; });
    zoom2.scale(980 / (focus.r*2 + margin)); 
    position = zoom2.translate();
    zoom2.translate([0,0]);
  }

  function zoomTo2(v) {
        
    var k = diameter / v[2]; view = v;
    node.attr(\"transform\", function(d) { return \"translate(\" + (d.x - v[0]) * k + \",\" + (d.y - v[1]) * k + \")\"; });
    circle.attr(\"r\", function(d) { return d.r * k; });

  }
    
  function zoomed() {
     
    var s = d3.event.scale;
    var panVector = d3.event.translate;
    var panX = panVector[0];
    var panY = panVector[1];

    x = focus.x - (panX - position[0])/s;
    y = focus.y - (panY - position[1])/s;
    r = diameter/s;
    
    d3.transition()
        .duration(0)
        .tween(\"zoom\", function() {
            var i = d3.interpolateZoom(view, [x, y, r]);
            return function(t) { zoomTo2(i(t)); };
        });     
  };
});" >>$tmp
i=$((i+1));
done

echo "d3.select(self.frameElement).style(\"height\", diameter + \"px\");

</script>" >>$tmp

    
    
    
    
    
    
open -a Safari $tmp
