angular.module('invoices.directives')
  .directive('inscroll', ['$window', 
    function($window){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($window).bind('scroll', function(){
            var elements = document.querySelectorAll("[inview]");
            for(var i=0;i<elements.length;i++){
              var el = elements[i],
                  top = el.getBoundingClientRect().top,
                  dist = window.innerHeight;
              if(top<((dist/2)+(dist/4))){
                if(!el.classList.contains('inview')){
                  var inviewEvent = new Event('inview');
                  el.dispatchEvent(inviewEvent);
                }
              } else {
                var outviewEvent = new Event('outview');
                  el.dispatchEvent(outviewEvent);
              }
            }
          });
        }
      };
    }
  ])
;