angular.module('invoices.directives', [])
  .directive('inscroll', ['$window', function($window){
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        angular.element($window).bind('scroll', function(){
          var elements = document.querySelectorAll("[inview]");
          for(var i=0;i<elements.length;i++){
            var el = elements[i],
                top = el.getBoundingClientRect().top;
            if(top<((document.body.clientHeight/2)-150)){
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
  }])
  .directive('inview', function(){
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        angular.element(element).on('inview', function(){
          this.classList.add('inview');
        });
        angular.element(element).on('outview', function(){
          this.classList.remove('inview');
        });
      }
    };
  })
;