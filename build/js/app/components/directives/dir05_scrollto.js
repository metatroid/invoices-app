angular.module('invoices.directives')
  .directive('inscrollto', 
    function(){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var targetElement;
          
          $element.on('click', function(e){
            e.preventDefault();
            this.blur();
            var targetId = $attrs.inscrollto;

            targetElement = document.getElementById(targetId);
            if(!targetElement) return; 

            smoothScroll(targetElement, {});

            return false;
          });
        }
      };
    }
  )
;