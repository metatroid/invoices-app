angular.module('invoices.filters', [])
  .filter('msToTimeString', function(){
    return function(millseconds) {
      var seconds = Math.floor(millseconds / 1000),
          h = 3600,
          m = 60,
          hours = Math.floor(seconds/h),
          minutes = Math.floor( (seconds % h)/m ),
          scnds = Math.floor( (seconds % m) ),
          timeString = '';
      if(scnds < 10) scnds = "0"+scnds;
      if(hours < 10) hours = "0"+hours;
      if(minutes < 10) minutes = "0"+minutes;
      timeString = hours +":"+ minutes +":"+scnds;
      return timeString;
    };
  })
  .filter('secondsToTimeString', function(){
    return function(seconds) {
      var h = 3600,
          m = 60,
          hours = Math.floor(seconds/h),
          minutes = Math.floor( (seconds % h)/m ),
          scnds = Math.floor( (seconds % m) ),
          timeString = '';
      if(scnds < 10) scnds = "0"+scnds;
      if(hours < 10) hours = "0"+hours;
      if(minutes < 10) minutes = "0"+minutes;
      timeString = hours +":"+ minutes +":"+scnds;
      return timeString;
    };
  })
  .filter('telephone', function(){
    return function(telephone){
      if(!telephone){
        return "";
      }
      var value = telephone.toString().trim().replace(/^\+/, '');
      if(value.match(/[^0-9]/)){
        return telephone;
      }
      var country, city, number;
      switch(value.length){
        case 10:
          country = 1;
          city = value.slice(0,3);
          number = value.slice(3);
          break;
        case 11:
          country = value[0];
          city = value.slice(1,4);
          number = value.slice(4);
          break;
        case 12:
          country = value.slice(0,3);
          city = value.slice(3,5);
          number = value.slice(5);
          break;
        default:
          return telephone;
      }
      if(country === 1){
        country = "";
      }
      number = number.slice(0, 3) + '-' + number.slice(3);
      return (country + " (" + city + ") " + number).trim();
    };
  })
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