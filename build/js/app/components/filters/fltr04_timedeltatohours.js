angular.module('invoices.filters')
  .filter('timeDeltaToHours', function(){
    return function(delta){
      var pieces = delta.split(":"),
          hours = pieces[0],
          minutes = pieces[1],
          seconds = pieces[2];
      return parseInt(hours) + (parseInt(minutes)/60) + (parseFloat(seconds)/60/60);
    };
  })
;