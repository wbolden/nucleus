//Parses the existing namestring to remove unwanted values
function parsename(str) {
  var split = str.split(" ");
  var density = parseFloat(split[1]);
  if(density < 0.01){
    split[1] = "<0.01";
  }
  if(split[0] == "4294967277"){
  	split[0] = "Not recorded"
  }
  split[0] = split[0].concat(" ");
  return split[0].concat(split[1])                     
}

function getDensity(str) {
  var split = str.split(" ");
  var density = parseFloat(split[1]);
  return density;                    
}

function getSize(str) {
  var split = str.split(" ");
  var size = parseFloat(split[0]);
  return size;                    
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

//Credit to: Paulpro
//http://jsfiddle.net/Paulpro/adpBM/
//input box that increases as you type in it
(function(){
    
    var min = 100, max = 500, pad_right = 5, input = document.getElementById('get_input');

    input.style.width = min+'px';
    input.onkeypress = input.onkeydown = input.onkeyup = function(){
        var input = this;
        setTimeout(function(){
            var tmp = document.createElement('div');
            tmp.style.padding = '0';
            if(getComputedStyle)
                tmp.style.cssText = getComputedStyle(input, null).cssText;
            if(input.currentStyle)
                tmp.style = input.currentStyle;
            tmp.style.width = '';
            tmp.style.position = 'absolute';
            tmp.innerHTML = input.value.replace(/&/g, "&amp;")
                                       .replace(/</g, "&lt;")
                                       .replace(/>/g, "&gt;")
                                       .replace(/"/g, "&quot;")
                                       .replace(/'/g, "&#039;")
                                       .replace(/ /g, '&nbsp;');
            input.parentNode.appendChild(tmp);
            var width = tmp.clientWidth+pad_right+1;
            tmp.parentNode.removeChild(tmp);
            if(min <= width && width <= max)
                input.style.width = width+'px';
        }, 1);
    }

})();