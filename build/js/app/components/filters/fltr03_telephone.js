angular.module('invoices.filters')
  .filter('telephone', 
    function(){
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
    }
  )
;