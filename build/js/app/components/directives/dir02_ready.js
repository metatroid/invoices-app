angular.module('invoices.directives')
  .directive('inready', ['$timeout', 
    function($timeout){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var elementClass = $attrs.inready,
              el = angular.element($element);
          angular.element(document).ready(function(){
            $element.addClass(elementClass);
          });
        }
      };
    }
  ])
;