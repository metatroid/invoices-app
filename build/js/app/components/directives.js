var smoothScroll = function (element, options) {
  options = options || {};
  var duration = 800,
      offset = 0;

  var easing = function(n){
    return n < 0.5 ? 8 * Math.pow(n, 4) : 1 - 8 * (--n) * Math.pow(n, 3);
  };

  var getScrollLocation = function() {
    return window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop;
  };

  setTimeout( function() {
    var startLocation = getScrollLocation(),
        timeLapsed = 0,
        percentage, position;

    var getEndLocation = function (element) {
      var location = 0;
      if (element.offsetParent) {
        do {
          location += element.offsetTop;
          element = element.offsetParent;
        } while (element);
      }
      location = Math.max(location - offset, 0);
      return location;
    };

    var endLocation = getEndLocation(element);
    var distance = endLocation - startLocation;

    var stopAnimation = function () {
      var currentLocation = getScrollLocation();
      if ( position == endLocation || currentLocation == endLocation || ( (window.innerHeight + currentLocation) >= document.body.scrollHeight ) ) {
        clearInterval(runAnimation);
      }
    };

    var animateScroll = function () {
      timeLapsed += 16;
      percentage = ( timeLapsed / duration );
      percentage = ( percentage > 1 ) ? 1 : percentage;
      position = startLocation + ( distance * easing(percentage) );
      window.scrollTo( 0, position );
      stopAnimation();
    };

    var runAnimation = setInterval(animateScroll, 16);
  }, 0);
};

var revealView = function(target){
  document.querySelector('.view-panel.active').classList.remove('active');
  document.getElementById(target).classList.add('active');
};

var msToTimeString = function(ms){
  var seconds = Math.floor(ms / 1000),
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

angular.module('invoices.directives', [])
  .directive('inscroll', ['$window', function($window){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
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
      link: function($scope, $element, $attrs){
        angular.element($element).on('inview', function(){
          this.classList.add('inview');
        });
        angular.element($element).on('outview', function(){
          this.classList.remove('inview');
        });
      }
    };
  })
  .directive('inscrollto', function(){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
        var targetElement;
        
        $element.on('click', function(e) {
          e.preventDefault();
          this.blur();
          var targetId = $attrs.inscrollto;

          targetElement = document.getElementById(targetId);
          if ( !targetElement ) return; 

          smoothScroll(targetElement, {});

          return false;
        });
      }
    };
  })
  .directive('inreveal', function(){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
        var target = $attrs.inreveal;
        angular.element($element).on('click', function(e){
          e.preventDefault();
          document.querySelector('a.active').classList.remove('active');
          this.classList.add('active');
          revealView(target);
        });
      }
    };
  })
  .directive('infile', function(){
    return {
      scope: {
        infile: "="
      },
      restrict: 'A',
      link: function($scope, $element, $attrs){
        angular.element($element).on('change', function(e){
          var reader = new FileReader(),
              filename = '',
              input = this,
              data;
          if(this.files && this.files[0]){
            reader.onload = function(ev){
              data = ev.target.result;
              var preview = document.getElementById('logoPreview') || document.createElement('img');
              preview.id = "logoPreview";
              preview.setAttribute('src', reader.result);
              preview.style.width = "100px";
              input.parentElement.appendChild(preview);
              $scope.$apply(function(){
                $scope.infile = data;
              });
            };
            reader.readAsDataURL(this.files[0]);
            filename = e.target.value.split('\\').pop().length > 14 ? e.target.value.split('\\').pop().slice(0,11)+"&hellip;" : e.target.value.split('\\').pop();
            // $parse($attrs.infile).assign($scope, $element[0].files[0]);
            // $scope.$apply();
          }
          if(filename){
            this.nextSibling.querySelector('span.label').innerHTML = filename;
          } else {
            this.nextSibling.querySelector('span.label').innerHTML = 'Project Logo';
          }
        });
      }
    };
  })
  .directive('intimer', function(){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
        angular.element($element).on('click', function(){
          var el = this.parentElement.querySelector(".counter");
          var timerEvent = $attrs.intimer;
          var timeEvent = new Event(timerEvent);
          el.dispatchEvent(timeEvent);
          // console.log('dispatched '+timerEvent+' to element: '+el);
          // console.log(this.parentElement);
        });
      }
    };
  })
  .directive('incounting', ['$interval', function($interval){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
        var self = this,
            timer,
            timeSync,
            startTime,
            totalElapsed = 0,
            elapsed = 0,
            timerEl = angular.element($element),
            projectId = timerEl[0].getAttribute('data-project'),
            intervalId = timerEl[0].getAttribute('data-interval');
        timerEl.on('startTimer', function(){
          startTime = new Date();
          timer = $interval(function(){
            var now = new Date();
            elapsed = now.getTime() - startTime.getTime();
            angular.element($element).html(msToTimeString(totalElapsed+elapsed));
          }, 1001);
        });
        angular.element($element).on('stopTimer', function(){
          $interval.cancel(timer);
          timer = undefined;
          totalElapsed += elapsed;
          elapsed = 0;
        });
      }
    };
  }])
;