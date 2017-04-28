function load_data(node_id){

	d3.select('#plot_svg').remove();
    d3.select('#plot_svg').remove();

	var keyword_directory = "output/output/"
					.concat(String(node_id)
					.concat(".keywords.json"));
	d3.json(keyword_directory, get_common_stats);

	var paper_directory = "output/output/"
					.concat(String(node_id)
					.concat(".papers.json"));
	d3.json(paper_directory, get_circle_stats);
}

function get_common_stats(error, data){
	if (error) throw error;
	//console.log(data);
	top_words = [];
	top_wfreq = [];
	top_authors = [];
	top_afreq = [];
	var words = "<b>Common words:</b> ";
  	var authors = "<b>Common authors:</b> ";
	for (var i = 0; i < data.common_words.length; i++) {
		var word = stripHTML(data.common_words[i][0]);
		var wfreq = data.common_words[i][1];
		var author = stripHTML(data.common_author[i][0])
		var afreq = data.common_author[i][1];
		top_words.push(word);
		top_wfreq.push(wfreq);
		top_authors.push(author);
		top_afreq.push(afreq);
		words = words.concat(word)
					 .concat("(")
					 .concat(wfreq)
					 .concat(")")
					 .concat(", ");
		authors = authors.concat(author).concat(", ");
	}
	$("classifcation").innerHTML = words.concat("<br>").concat(authors).concat("<br><br>");
	//console.log(top_words);
	//console.log(top_wfreq);
	create_graph(top_words,top_wfreq,0);
	create_graph(top_authors,top_afreq,1);
}

function get_circle_stats(error, data){
	if (error) throw error;
	for (var i = 0; i < data.length; i++) {
		var title = "<b>Title: </b>".concat(data[i].title).concat("<br>");
		var authors = "<b>Authors: </b>";
		for (var j = 0; j < data[i].authors.length; j++) {
			authors = authors.concat(data[i].authors[j]).concat(", ");
		}
		authors = authors.concat("<br>");
		var paperinfo = title.concat(authors) + 
						"<b>Published: <b>" + 
						data[i].date + "<br><br>";
		$('paperinfo').innerHTML += paperinfo;
	}
}

function get_first_stat(c, data, node_id){
	var keyword_directory = "output/output/"
					.concat(String(node_id)
					.concat(".keywords.json"));
	var density = getDensity(data);
    var size = getSize(data);
    var matrix = c.getScreenCTM()
        .translate(+c.getAttribute("cx"),+c.getAttribute("cy"));
    tooltip.transition().duration(200).style("opacity", .9);
	d3.json(keyword_directory, function (error, data){
		var word = (stripHTML(data.common_words[0][0]));
		var author = (stripHTML(data.common_author[1][0]));
		tooltip.html("</p><p class='center-align'>Top Word: " + word +
	                 "</p><p class='left-align'>Papers:<span class='right-align'>" + size +
	                 "</p><p class='left-align'>Density:<span class='right-align'>" + density +    
	                 "</p><p class='left-align'>Num Interescts:<span class='right-align'>" + numIntersect[node_id] +
	                 "</p><p class='left-align'>Top Author:<span class='right-align'>" + author)
        .style("left", window.pageXOffset + matrix.e + "px")     
        .style("top", window.pageYOffset + matrix.f + "px");
	});
}

