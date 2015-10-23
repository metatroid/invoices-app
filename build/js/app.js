angular.module('invoices', [
               'ngMaterial',
               'invoices.controllers',
               'invoices.states',
               'invoices.services',
               'invoices.directives',
               'invoices.filters',
               'djangoRESTResources',
               'ui.mask'
]);

angular.module('invoices.states', []);
angular.module('invoices.services', []);
angular.module('invoices.directives', []);
angular.module('invoices.filters', []);

angular.module('invoices')
  .config(['$httpProvider', '$compileProvider', '$mdThemingProvider', function($httpProvider, $compileProvider, $mdThemingProvider){
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
    $mdThemingProvider.theme('default')
      .primaryPalette('grey')
      .accentPalette('blue-grey');
    $mdThemingProvider.theme('docs-dark', 'default')
      .primaryPalette('yellow')
      .dark();
  }
]);
angular.module('invoices.controllers', [])
  .controller('mainCtrl', ['$rootScope', 
                           '$scope', 
                           '$state', 
                           '$log', 
                           'apiSrv', 
    function($rootScope, $scope, $state, $log, apiSrv){
      $scope.showAuthForm = false;
      $scope.toggleAuthForm = function(){
        $scope.showAuthForm = !$scope.showAuthForm;
      };
      $scope.user = {};
      apiSrv.request('GET', 'user', {}, 
        function(user){
          $scope.user = user;
          if(user){
            $scope.bodyclass = "app";
            if($state.is('initial')){
              $state.go('app');
            }
            $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){ 
              if(toState.name === "initial"){
                $state.go('app');
              }
            });
          }
        }, 
        function(er){
          $log.error(er);
        }
      );
    }
  ])
  .controller('authCtrl', ['$scope', 
    function($scope){
      $scope.showAuthForm = true;
    }
  ])
  .controller('anonCtrl', ['$scope', 
    function($scope){
      //
    }
  ])
  .controller('userCtrl', [
              '$scope', 
              '$state', 
              '$log', 
              'apiSrv', 
    function($scope, $state, $log, apiSrv){
      $scope.updateProfile = function(userData){
        apiSrv.request('PUT', 'users/'+$scope.user.id+'/', userData, function(data){
          $log.info(data);
        }, function(err){
          $log.error(err);
        });
      };
    }
  ])
  .controller('appCtrl', ['$rootScope', 
                          '$scope', 
                          '$state', 
                          '$log', 
                          '$sce', 
                          'apiSrv', 
                          '$mdDialog',
                          '$mdBottomSheet', 
                          '$mdToast', 
                          'djResource', 
                          '$timeout', 
                          '$filter', 
    function($rootScope, $scope, $state, $log, $sce, apiSrv, $mdDialog, $mdBottomSheet, $mdToast, djResource, $timeout, $filter){
      function pad(n, width, z){
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
      }
      $scope.openProject = 0;
      $scope.currentState = $state.current.name;
      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        $scope.currentState = toState.name;
      });
      var Project = djResource('api/projects/:id', {'id': "@id"});
      $scope.projects = Project.query();
      $scope.newProject = new Project();
      $scope.newProject.hourly_rate = $scope.user.default_rate;
      $scope.newProject.deadline = $filter('date')($scope.newProject.deadline_date, 'yyyy-MM-dd'); // js date format workaround

      $scope.showNewProjectForm = function(ev){
        $mdDialog.show({
          controller: function(){
            this.parent = $scope;
            this.parent.newProject.hourly_rate = $scope.user.default_rate;
            this.parent.newProject.deadline = $filter('date')(this.parent.newProject.deadline_date, 'yyyy-MM-dd'); // js date format workaround
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/project-new.html',
          parent: angular.element(document.querySelector('.view-panel.active')),
          targetEvent: ev,
          clickOutsideToClose: true,
          onComplete: function(){
            document.getElementsByTagName('md-dialog-content')[0].scrollTop = 0;
            document.querySelectorAll("md-dialog-content input")[0].focus();
          }
        });
      };
      $scope.closeDialog = function() {
        $mdDialog.cancel();
      };
      function closeToast(){
        $mdToast.hide();
      }

      function detachProjectAndClearFields(id){
        var targetProject = Project.get({id: id}, function(){
          $scope.projects.push(targetProject);
          $scope.newProject = new Project();
        });
      }
      
      function xhrfile() {
        return supportFileAPI() && supportAjaxUploadProgressEvents();
        function supportFileAPI() {
            var input = document.createElement('input');
            input.type = 'file';
            return 'files' in input;
        }
        function supportAjaxUploadProgressEvents() {
            var xhr = new XMLHttpRequest();
            return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
        }
      }
      $scope.createProject = function(data){
        if(!xhrfile() && data.project_logo){
          var toast = $mdToast.simple()
                        .content('Your browser does not support xhr file uploads. Selected image will be removed.')
                        .action('Ok')
                        .highlightAction(false)
                        .hideDelay(6000)
                        .position('top right');
          $mdToast.show(toast).then(function(){
            if(data.project_logo){
              data.project_logo = null;
            }
          });
        }
        $scope.newProject.deadline = data.deadline_date; // js date format workaround
        $scope.newProject.$save(function(project){
          $scope.closeDialog();
          detachProjectAndClearFields(project.id);
        });
      };
      $scope.deleteProject = function(ev, id, index){
        var confirm = $mdDialog.confirm()
            .title('You are about to delete this project.')
            .content('This action cannot be undone. Are you sure you wish to proceed?')
            .ariaLabel('Confirm delete')
            .targetEvent(ev)
            .ok('Delete this project')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+id, {},
            function(data){
              $scope.projects.splice(index, 1);
            },
            function(err){
              $log.error(err);
            }
          );
        }, function() {
          $log.info('cancelled delete');
        });
      };

      function timeDeltaToSeconds(delta){
        var pieces = delta.split(":"),
            hours = pieces[0],
            minutes = pieces[1],
            seconds = pieces[2],
            timeDiff = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseFloat(seconds);
        return timeDiff;
      }
      $scope.timeEvent = "startTimer";
      var timerRunning = false;
      $scope.timers = [];
      $scope.intervals = {};
      var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
      var startTimer = function(id){
        $scope.timeEvent = "startTimer";
        $scope.intervals[id] = typeof $scope.intervals[id] === "undefined" ? {} : $scope.intervals[id];
        $scope.intervals[id].timerRunning = true;
        var timerEl = document.getElementById("project_"+id).querySelector(".timer");
        timerEl.classList.remove('saving');
        if($scope.timers.indexOf(id) === -1){
          //create
          $scope.timers.push(id);
          apiSrv.request('POST', 'projects/'+id+'/intervals/', {start: (new Date())},
           function(data){
            $scope.intervals[id].interval = data.id;
           },
           function(err){
            $log.error(err);
           }
          );
        } else {
          //update
        }
        
      };
      var stopTimer = function(id){
        $scope.timeEvent = "stopTimer";
        $scope.intervals[id].timerRunning = false;
        var intervalId = $scope.intervals[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer"),
            counter = document.getElementById("project_"+id).querySelector(".counter");
        timerEl.setAttribute('data-interval', intervalId);
        timerEl.classList.add('saving');
        Interval.get({project_id: id, id: intervalId}, function(interval){
          var start = new Date(interval.start),
              diff = counter.textContent,
              timeDiff = timeDeltaToSeconds(diff),
              newEnd = new Date(start.getTime() + timeDiff*1000);
          apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', {end: newEnd},
            function(data){
              document.getElementById("project_"+id).querySelector(".counter").setAttribute('data-interval', intervalId);
            },
            function(err){
              $log.error(err);
            }
          );
        });
      };
      $scope.startstopTimer = function(id){
        var ix = $scope.timers.indexOf(id);
        if(!timerRunning && (typeof $scope.intervals[id] === "undefined" || !$scope.intervals[id].timerRunning)){
          startTimer(id);
        } else {
          stopTimer(id);
        }
      };

      $scope.intervalObj = {"description": ""};
      $scope.saveInterval = function(id, index){
        var intervalData = {
          "description": $scope.intervalObj.description
        };
        var intervalId = $scope.intervals[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer"),
            timerBtn = timerEl.querySelector('.counter');
        apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', intervalData,
          function(data){
            $scope.projects.splice(index, 1, data);
            $scope.intervals[id].timerRunning = false;
            $scope.timers.splice(index, 1);
            $scope.timeEvent = "startTimer";
            $scope.intervalObj.description = "";
          },
          function(err){
            $log.error(err);
          }
        );
      };
      $scope.discardInterval = function(id, index, ev){
        var intervalId = $scope.intervals[id].interval,
            confirm = $mdDialog.confirm()
              .title('You are about to discard this time period.')
              .content('This action cannot be undone. Are you sure you wish to proceed?')
              .ariaLabel('Confirm discard')
              .targetEvent(ev)
              .ok('Discard this interval')
              .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+id+'/intervals/'+intervalId+'/', {},
            function(data){
              $scope.projects.splice(index, 1, data);
              $scope.intervals[id].timerRunning = false;
              $scope.timers.splice(index, 1);
              $scope.timeEvent = "startTimer";
            },
            function(err){
              $log.error(err);
            }
          );
        }, function() {
          $log.info('cancelled delete');
        });
      };
      $scope.showIntervalList = function(ev, pid, index){
        $scope.openProject = index;
        $mdBottomSheet.show({
          controller: function(){
            this.parent = $scope;
            var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
            this.parent.newInterval = new Interval();
            this.parent.intervals = Interval.query({project_id: pid});
            this.parent.project = Project.get({id: pid});
            this.parent.updateInterval = function(interval, ev, index){
              var that = this;
              var start = new Date(interval.start),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  newEnd = new Date(start.getTime() + timeDiff*1000);
              interval.end = newEnd;
              apiSrv.request('PUT', 'projects/'+interval.project+'/intervals/'+interval.id+'/', interval,
                function(data){
                  $scope.projects.splice($scope.openProject, 1, data);
                  that.project = data;
                },
                function(err){
                  $log.error(err);
                }
              );
            };
            this.parent.deleteInterval = function(interval, ev, index){
              var that = this;
              var confirm = $mdDialog.confirm()
                  .title('You are about to delete this time period.')
                  .content('This action cannot be undone. Are you sure you wish to proceed?')
                  .ariaLabel('Confirm delete')
                  .targetEvent(ev)
                  .ok('Delete this interval')
                  .cancel('Cancel');
              $mdDialog.show(confirm).then(function() {
                apiSrv.request('DELETE', 'projects/'+interval.project+'/intervals/'+interval.id, {},
                  function(data){
                    $scope.intervals.splice(index, 1);
                    Project.get({id: interval.project}, function(project){
                      $scope.projects.splice($scope.openProject, 1, project);
                      that.project = project;
                    });
                  },
                  function(err){
                    $log.error(err);
                  }
                );
              }, function() {
                $log.info('cancelled delete');
              });
            };
            this.parent.insertInterval = function(interval, ev){
              var that = this;
              var start = new Date(),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  end = new Date(start.getTime() + timeDiff*1000);
              interval.end = end;
              interval.start = start;
              apiSrv.request('POST', 'projects/'+pid+'/intervals/', interval,
                function(data){
                  var targetInterval = Interval.get({project_id: data.project, id: data.id}, function(){
                    that.intervals.push(targetInterval);
                    that.newInterval = new Interval();
                  });
                  Project.get({id: data.project}, function(project){
                    $scope.projects.splice($scope.openProject, 1, project);
                    that.project = project;
                  });
                },
                function(err){
                  $log.error(err);
                }
              );
            };
            this.parent.clearInterval = function(interval, ev){
              this.newInterval.description = "";
              this.newInterval.total = "";
            };
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/interval-list.html',
          parent: angular.element(document.querySelector('.view-panel.active'))
        });
      };

      $scope.showInvoiceMenu = function($mdOpenMenu, ev){
        $mdOpenMenu(ev);
      };
      $scope.openInvoiceDialog = function(projectId, ev){
        apiSrv.request('GET', 'projects/'+projectId, {}, function(project){
          $mdDialog.show({
            controller: function(){
              this.parent = $scope;
              this.parent.project = project;
              this.parent.today = new Date();
              this.parent.invoice_number = pad(project.statements.length + 1, 3);
            },
            controllerAs: 'ctrl',
            templateUrl: 'angular/partials/invoice-display.html',
            parent: angular.element(document.querySelector('.view-panel.active')),
            targetEvent: ev,
            clickOutsideToClose: true
          });
        }, function(err){$log.error(err);});
      };
      $scope.showProjectEditor = function(ev, projectId, index){
        apiSrv.request('GET', 'projects/'+projectId, {}, function(project){
          $mdDialog.show({
            controller: function(){
              this.parent = $scope;
              this.parent.project = project;
              this.parent.project.deadline = $filter('date')(this.parent.project.deadline, 'yyyy-MM-dd'); // js date format workaround
              this.parent.project_index = index;
            },
            controllerAs: 'ctrl',
            templateUrl: 'angular/partials/project-edit.html',
            parent: angular.element(document.querySelector('.view-panel.active')),
            targetEvent: ev,
            clickOutsideToClose: true
          });
        }, function(err){$log.error(err);});
      };
      $scope.updateProject = function(data, index){
        if(!xhrfile() && data.project_logo){
          var toast = $mdToast.simple()
                        .content('Your browser does not support xhr file uploads. Selected image will be removed.')
                        .action('Ok')
                        .highlightAction(false)
                        .hideDelay(6000)
                        .position('top right');
          $mdToast.show(toast).then(function(){
            if(data.project_logo){
              data.project_logo = null;
            }
          });
        }
        data.deadline = data.dead_date; // js date format workaround
        apiSrv.request('PUT', 'projects/'+data.id, data, function(project){
          $scope.closeDialog();
          $scope.projects.splice(index, 1, project);
        }, function(err){$log.error(err);});
      };

      $scope.htmlSafe = $sce.trustAsHtml;
      var formatErr = function(err){
        var errString = JSON.stringify(err),
            errArray = errString.split(','),
            responseString = "";
        for(var i=0;i<errArray.length;i++){
          var clean = errArray[i].replace(/\[|\]|"|{|}/g,''),
              item = clean.match(/.*(?=:)/)[0],
              message = clean.match(/(:)(.*)/)[2];
          responseString += "<li>"+item+": "+message+"</li>";
        }
        return responseString;
      };
    }
  ])
;
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
        }
      };
    }])
  
  // .directive('inreveal', function(){
  //   return {
  //     restrict: 'A',
  //     link: function($scope, $element, $attrs){
  //       angular.element($element).on('click', function(e){
  //         e.preventDefault();
  //         document.querySelector('a.active').classList.remove('active');
  //         this.classList.add('active');
          
  //         document.querySelector('.view-panel.active').classList.remove('active');
  //         document.getElementById(target).classList.add('active');
  //       });
  //     }
  //   };
  // })
  
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
angular.module('invoices.filters', [])
  .filter('msToTimeString', function(){
    return function(millseconds) {
      var seconds = Math.floor(millseconds / 1000),
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
  })
  .filter('secondsToTimeString', function(){
    return function(seconds) {
      var h = 3600,
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
  })
  .filter('telephone', function(){
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
  })
  .filter('timeDeltaToHours', function(){
    return function(delta){
      var pieces = delta.split(":"),
          hours = pieces[0],
          minutes = pieces[1],
          seconds = pieces[2];
      return parseInt(hours) + (parseInt(minutes)/60) + (parseFloat(seconds)/60/60);
    };
  })
;
angular.module('invoices.services')
  .factory('apiSrv', ['$http', function($http){
    var apiSrv = {};

    apiSrv.request = function(method, url, args, successFn, errorFn){
      return $http({
        method: method,
        url: '/api/' + url,
        data: JSON.stringify(args)
      }).success(successFn).error(errorFn);
    };

    return apiSrv;
  }])
;
angular.module('invoices.states', [
               'ui.router',
               'uiRouterStyles'
])
.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams){
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
  var templateDir = 'angular/partials',
      cssDir = "static/assets/css";

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('initial', {
      url: '/',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html'
        },
        'landing@initial': {
          templateUrl: templateDir + '/landing.html',
          controller: 'anonCtrl'
        },
        'auth@initial': {
          templateUrl: templateDir + '/auth.html'
        }
      },
      data: {
        css: cssDir + '/landing.css'
      }
    })
    .state('app', {
      url: '/invoices',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html'
        },
        'landing@app': {
          templateUrl: templateDir + '/auth.html',
          controller: 'authCtrl'
        },
        'app@app': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@app': {
          templateUrl: templateDir + '/nav.html'
        }
      },
      data: {
        css: cssDir + '/app.css'
      }
    })
    .state('app.settings', {
      url: '/settings',
      views: {
        'profile': {
          templateUrl: templateDir + '/profile.html',
          controller: 'userCtrl'
        }
      }
    })
  ;
}]);