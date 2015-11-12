angular.module('invoices.directives')
  .directive('intimer', 
    function(){
      return{
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('click', function(){
            var el = this.parentElement.querySelector(".counter");
            var timerEvent = $attrs.intimer;
            var timeEvent = new Event(timerEvent);
            el.dispatchEvent(timeEvent);
          });
        }
      };
    }
  )
;