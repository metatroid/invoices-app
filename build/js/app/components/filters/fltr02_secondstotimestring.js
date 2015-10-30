angular.module('invoices.filters')
  .filter('secondsToTimeString', 
    function(){
      return function(seconds){
        var h = 3600,
            m = 60,
            hours = Math.floor(seconds/h),
            minutes = Math.floor((seconds % h)/m),
            scnds = Math.floor((seconds % m)),
            timeString = '';
        if(scnds < 10){
          scnds = "0" + scnds;
        }
        if(hours < 10){
          hours = "0" + hours;
        }
        if(minutes < 10){
          minutes = "0" + minutes;
        }
        timeString = hours + ":" + minutes + ":" + scnds;
        return timeString;
      };
    }
  )
;