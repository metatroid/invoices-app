angular.module('invoices.directives')
  .directive('infocus', ['$timeout', 
    function($timeout){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          $timeout(function(){
            $element[0].focus();
          }, 1000);
        }
      };
    }
  ])
;