var load_metadata_online = false;


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

var titlefile = {};
var authorfile = {};
var revfakedb = {};

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
    console.log("loaded titles")
})

d3.json("author_map.json", function(error, data){
    for(var i = 0; i < data.length; i++){
        authorfile[data[i].author] = data[i].paper_ids; 
    }
    console.log("loaded authors")
})
/*
d3.tsv("map.txt", function(data) {
  for(var i = 0; i < data.length; i++){
    var prefix = "http://journals.aps.org/";
    var suffix = data[i].doi;
    var doi = data[i].doi.split("/")[1];
    var subfolders = doi.split(".");
    subfolders[0] = folderhash[subfolders[0]];
    subfolders[1] = "export";
    subfolders[2] = suffix;
    mapfile[data[i].index] = prefix.concat(subfolders.join("/"));
  }
  console.log("loaded map");
});
*/

//Stores the vertices corresponding to each node in the fakedb variable
d3.tsv("aps-citations_cleaned.mtx_23_IMPR_fakedb", function(data) {
  for(var i = 0; i <data.length; i++){
    var fields = data[i].info.split(" ");
    index = fields[0];
    fields.remove(-1); //Remove last element, always a -1
    fields.remove(0, 5); //Remove first 5 elements to be left with vertices only
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
                'the','of','on','an','in','with','a','for','from'];
  for(var i = 0; i < words.length; i++){
    delete dict[words[i]];
  }
  return dict;
}

//Strip html from text, useful when tags are used in json data
function stripHTML(string){
  var div = document.createElement("tempdiv");
  div.innerHTML = string;
  return div.innerText;
}



function display_paper_stats(){
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
 //console.log(words_array, authors_array);
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
  var paperinfo = title.concat(authors).concat("<br>");
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
    var paperinfo = title.concat(authors).concat("<br>");
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

function reverseFakedb(){
    for (var index in fakedb){
        var slot = fakedb[index]
        for (var i = 0; i < slot.length; i++){
            if(revfakedb[slot[i]] == null){
                revfakedb[slot[i]] = [index];
            }else{
                indicies = [];
                for (var j = 0; j<revfakedb[slot[i]].length; j++){
                    indicies.push(revfakedb[slot[i]][j]);
                }
                indicies.push(index);
                revfakedb[slot[i]] = indicies;
            }
        }
    }
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