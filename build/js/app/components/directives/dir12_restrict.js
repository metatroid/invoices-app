angular.module('invoices.directives')
  .directive("inrestrict",
    function(){
      return{
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var restriction = $attrs.inrestrict;
          switch(restriction){
            case 'duration':
              angular.element($element)[0].addEventListener('keypress', function(e){
                var character = String.fromCharCode(e.which);
                if(character.match(/\d|:|\./) === null){
                  e.preventDefault();
                }
              });
              break;
            default:
              break;
          }
        }
      };
    }
  )
;