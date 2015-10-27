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
  .directive('infocus', ['$timeout', function($timeout){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
        $timeout(function(){
          $element[0].focus();
        }, 1000);
      }
    };
  }])
  .directive('inready', ['$timeout', function($timeout){
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
    }])
  .directive('inscroll', ['$window', function($window){
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
  .directive('inbokeh', ['$interval', function($interval){
      return {
        restrict: 'A',
        link: function($scope, $elements, $attrs){
          var container = document.getElementById('strip'),
              width = container.clientWidth,
              height = 450,
              canvas = document.getElementById('blur'),
              con = canvas.getContext('2d'),
              rint = 60,
              g,
              pxs = [];
          canvas.width = width;
          canvas.height = height;
          for(var i=0;i<100;i++){
            pxs[i] = new Circle();
            pxs[i].reset();
          }
          $interval(draw, rint);
          function draw(){
            con.clearRect(0,0,width,height);
            for(var i=0;i<pxs.length;i++){
              pxs[i].fade();
              pxs[i].move();
              pxs[i].draw();
            }
          }
          function Circle(){
            this.s = {ttl:8000, xmax:3, ymax:2, rmax:200, rt:1, xdef:960, ydef:540, xdrift:2, ydrift:2, random:true, blink:true};
            var crFill = [
              ['rgba(10,56,67,0)', 'rgba(10,56,67,1)'],
              ['rgba(11,67,99,0)', 'rgba(11,67,99,1)'],
              ['rgba(8,46,49,0)', 'rgba(8,46,49,1)'],
              ['rgba(7,64,60,0)', 'rgba(7,64,60,1)']
            ];
            var opacityFill = "."+Math.floor(Math.random()*5)+1;

            this.reset = function(){
              this.x = (this.s.random ? width*Math.random() : this.s.xdef);
              this.y = (this.s.random ? height*Math.random() : this.s.ydef);
              this.r = ((this.s.rmax-1)*Math.random()) + 1;
              this.dx = (Math.random()*this.s.xmax) * (Math.random() < 0.5 ? -1 : 1);
              this.dy = (Math.random()*this.s.ymax) * (Math.random() < 0.5 ? -1 : 1);
              this.hl = (this.s.ttl/rint)*(this.r/this.s.rmax);
              this.rt = Math.random()*this.hl;
              this.s.rt = Math.random()+1;
              this.stop = Math.random()*0.2+0.4;
              this.s.xdrift *= Math.random() * (Math.random() < 0.5 ? -1 : 1);
              this.s.ydrift *= Math.random() * (Math.random() < 0.5 ? -1 : 1);
              this.opacityFill = opacityFill;
              this.currentColor = Math.floor(Math.random()*crFill.length);
            };

            this.fade = function(){
              this.rt += this.s.rt;
            };

            this.draw = function() {
              if(this.s.blink && (this.rt <= 0 || this.rt >= this.hl)){
                this.s.rt = this.s.rt*-1;
              }
              else if(this.rt >= this.hl){
                this.reset();
              }
              con.beginPath();
              con.arc(this.x,this.y,this.r,0,Math.PI*2,true);
              con.globalAlpha = opacityFill;
              var newo = 1-(this.rt/this.hl);
              var cr = this.r*newo;
              gradient = con.createRadialGradient(this.x,this.y,0,this.x,this.y,(cr <= 0 ? 1 : cr));
              gradient.addColorStop(0.0, crFill[(this.currentColor)][1]);
              gradient.addColorStop(0.7, crFill[(this.currentColor)][1]);
              gradient.addColorStop(1.0, crFill[(this.currentColor)][0]);
              con.fillStyle = gradient;
              con.fill();
              con.closePath();
            };

            this.move = function() {
              this.x += (this.rt/this.hl)*this.dx;
              this.y += (this.rt/this.hl)*this.dy;
              if(this.x > width || this.x < 0){
                this.dx *= -1;
              } 
              if(this.y > height || this.y < 0){
                this.dy *= -1;
              } 
            };

            this.getX = function() { return this.x; };
            this.getY = function() { return this.y; };
          }
          window.onresize = function(e){
            width = container.clientWidth;
            canvas.width = width;
          };
        }
      };
    }])
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
  .directive("insave", ['$mdDialog', '$log', 'apiSrv', function($mdDialog, $log, apiSrv){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('click', function(ev){
            var projectId = $attrs.insave,
                invoiceHtml = document.getElementById('invoice').outerHTML,
                progress = document.querySelector("md-progress-linear");
            progress.classList.remove("hidden");
            apiSrv.request('POST', 'projects/'+projectId+'/statements/', {markup: invoiceHtml}, function(invoice){
              progress.classList.add("hidden");
              $mdDialog.show(
                $mdDialog.alert()
                  .parent(angular.element(document.querySelector('.view-panel.active')))
                  .clickOutsideToClose(true)
                  .title('Invoice ready')
                  .content('<button class="invoice-btn md-icon-button md-button md-default-theme"><a href="'+invoice.url+'" target="_blank"><md-icon class="md-default-theme"><span class="fa fa-file-pdf-o"></span></md-icon> View PDF</a></button>')
                  .ariaLabel('Invoice link')
                  .ok('Dismiss')
                  .targetEvent(ev)
              );
            }, function(err){$log.error(err);});
          });
        }
      };
    }])
;