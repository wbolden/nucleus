//Parses the existing namestring to remove unwanted values
function parsename(str) {
  var split = str.split(" ");
  var density = parseFloat(split[1]);
  if(density == -1.0){
    split[1] = "<0.01";
  }
  if(split[0] == "4294967277"){
  	split[0] = "Not recorded"
  }
  split[0] = split[0].concat(" ");
  return split[0].concat(split[1])                     
}


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};