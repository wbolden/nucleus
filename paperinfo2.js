function load_data(node){

	var node_id = node.index;
	d3.select('#plot_svg').remove();
    d3.select('#plot_svg').remove();

	var keyword_directory = "output/output/keywords/"
					+(String(node_id)
					+(".json"));
	d3.json(keyword_directory, get_common_stats);

	//Don't load papers if there are too many. Really we 
	//should just load a fraction of the papers if there
	//are too many to load everything
	if(node.size < 10000){
		var paper_directory = "output/output/papers/"
						+(String(node_id)
						+(".json"));

		d3.json(paper_directory, get_circle_stats);
	}
}

function get_common_stats(error, data){
	if (error) throw error;
	console.log(data);
	top_words = [];
	top_wfreq = [];
	top_authors = [];
	top_afreq = [];
	var words = "<b>Common words:</b> ";
  	var authors = "<b>Common authors:</b> ";
	for (var i = 0; i < data.common_words.length; i++) {
		var word = stripHTML(data.common_words[i][0]);
		var wfreq = data.common_words[i][1];
		var author = stripHTML(data.common_authors[i][0])
		var afreq = data.common_authors[i][1];
		top_words.push(word);
		top_wfreq.push(wfreq);
		top_authors.push(author);
		top_afreq.push(afreq);
		words += word+"("+wfreq+")";
		authors += author;

		if(i != data.common_words.length-1){
			words += ", ";
			authors += ", ";
		}

	}
	$("classifcation").innerHTML = words+("<br>")+(authors)+("<br><br>");
	//console.log(top_words);
	//console.log(top_wfreq);
	create_graph(top_words,top_wfreq,0);
	create_graph(top_authors,top_afreq,1);
}

function get_circle_stats(error, data){
	if (error) throw error;
  console.log("Loading",data.length,"papers")
       
        var paperinfo_string = "";
        var paperinfo = "";
	for (var i = 0; i < data.length; i++) {
		var title = "<b>Title: </b>"+data[i].title +"<br>";

                //To avoid an if inside the loop
		var authors = "<b>Authors: </b>"+data[i].authors[0];
		for (var j = 1; j < data[i].authors.length; j++) {
			authors += ", "+data[i].authors[j];
		}
		authors = authors+("<br>");
		paperinfo += title +authors + 
						"<b>Published: </b>" + 
						data[i].date + "<br><br>";
	}
        $('paperinfo').innerHTML += paperinfo;
}
