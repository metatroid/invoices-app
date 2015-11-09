var formatErr = function(err){
  var errString = JSON.stringify(err),
      errArray = errString.split(','),
      responseString = "";
  for(var i=0;i<errArray.length;i++){
    var clean = errArray[i].replace(/\[|\]|"|{|}/g,''),
        item = clean.match(/.*(?=:)/)[0],
        message = clean.match(/(:)(.*)/)[2];
    responseString += "<li>"+item+": "+message+"</li>";
  }
  return responseString;
};
function pad(n, width, z){
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function timeDeltaToSeconds(delta){
  var pieces = delta.split(":"),
      hours = pieces[0],
      minutes = pieces[1],
      seconds = pieces[2],
      timeDiff = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseFloat(seconds);
  return timeDiff;
}
function itemProgressIndicator(showEl, hideEl){
  showEl.classList.remove('hidden');
  hideEl.classList.add('hidden');
}