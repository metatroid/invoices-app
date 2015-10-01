angular.module('invoices', [
               'ngMaterial',
               'invoices.controllers',
               'invoices.states',
               'invoices.services',
               'invoices.directives',
               'invoices.filters',
               'djangoRESTResources'
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
  .controller('mainCtrl', ['$scope', '$log', 'apiSrv', function($scope, $log, apiSrv){
    $scope.showAuthForm = false;
    $scope.toggleAuthForm = function(){
      $scope.showAuthForm = !$scope.showAuthForm;
    };
    apiSrv.request('GET', 'user', {}, 
      function(user){
        $scope.user = user;
        $scope.ready = true;
        if(user){
          $scope.bodyclass = "app";
        }
      }, 
      function(er){
        $log.error(er);
      }
    );
  }])
  .controller('appCtrl', ['$scope', '$log', '$sce', 'apiSrv', '$mdDialog', 'djResource', function($scope, $log, $sce, apiSrv, $mdDialog, djResource){
    // $scope.user = {};
    if(!$scope.user){
      apiSrv.request('GET', 'user', {}, 
        function(user){
          $scope.user = user;
          $scope.ready = true;
          if(user){
            $scope.bodyclass = "app";
          }
        }, 
        function(er){
          $log.error(er);
        }
      );
    }
    var updateProjectList = function(){
      apiSrv.request('GET', 'projects', {}, 
        function(projects){
          $scope.projects = projects;
          // console.log(projects);
        }, 
        function(err){
          $log.error(err);
        }
      );
    };
    var clearProjectFormFields = function(){
      $scope.newProject.project_name = "";
      $scope.newProject.project_url = "";
      $scope.newProject.project_description = "";
      $scope.newProject.client_name = "";
      $scope.newProject.client_email = "";
      $scope.newProject.deadline = "";
      $scope.newProject.hourly_rate = "";
      $scope.newProject.fixed_rate = "";
      $scope.newProject.project_logo = "";
    };
    
    // $scope.projects = [];
    // apiSrv.request('GET', 'projects/', {},
    //   function(data){
    //     $scope.projects = data;
    //   },
    //   function(err){
    //     $log.error(err);
    //   }
    // );
    var Project = djResource('api/projects/:id', {'id': "@id"});
    $scope.projects = Project.query();
    $scope.newProject = new Project();
    $scope.createProject = function(){
      apiSrv.request('POST', 'projects/', $scope.newProject,
        function(data){
          $scope.cancel();
          clearProjectFormFields();
          $scope.projects.push(data);
          // updateProjectList();
        },
        function(err){
          $log.error(err);
        }
      );
      // $scope.newProject.$save(function(data){
      //   $scope.cancel();
      //   clearProjectFormFields();
      //   updateProjectList();
      // });
    };
    $scope.deleteProject = function(id){
      apiSrv.request('DELETE', 'projects/'+id, {},
       function(data){
        $log.info(data);
        $scope.projects = Project.query();
       },
       function(err){
        $log.error(err);
       }
      );
    };

    $scope.timeEvent = "startTimer";
    var timerRunning = false;
    $scope.timers = [];
    var intervals = {};
    var startTimer = function(id){
      $scope.timeEvent = "startTimer";
      intervals[id] = {};
      intervals[id].timerRunning = true;
      var timerEl = document.getElementById("project_"+id).querySelector(".timer");
      timerEl.classList.remove('saving');
      apiSrv.request('POST', 'projects/'+id+'/intervals/', {},
       function(data){
        $log.info(data);
        intervals[id].interval = data.id;
       },
       function(err){
        $log.error(err);
       }
      );
    };
    var stopTimer = function(id){
      $scope.timeEvent = "stopTimer";
      intervals[id].timerRunning = false;
      var intervalId = intervals[id].interval,
          timerEl = document.getElementById("project_"+id).querySelector(".timer");
      timerEl.setAttribute('data-interval', intervalId);
      timerEl.classList.add('saving');
      apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', {end: (new Date())},
        function(data){
          // $log.info(data);
          document.getElementById("project_"+id).querySelector(".counter").setAttribute('data-interval', intervalId);
        },
        function(err){
          $log.error(err);
        }
      );
    };

    $scope.startstopTimer = function(id){
      var ix = $scope.timers.indexOf(id);
      if(!timerRunning && (typeof intervals[id] === "undefined" || !intervals[id].timerRunning)){
        startTimer(id);
        $scope.timers.push(id);
      } else {
        stopTimer(id);
        $scope.timers.splice(ix, 1);
      }
    };

    $scope.intervalObj = {"description": ""};
    $scope.saveInterval = function(id){
      var intervalData = {
        "description": $scope.intervalObj.description
      };
      var intervalId = intervals[id].interval,
          timerEl = document.getElementById("project_"+id).querySelector(".timer"),
          timerBtn = timerEl.querySelector('.counter');
      apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', intervalData,
        function(data){
          timerEl.classList.remove('saving');
          timerEl.removeAttribute('data-interval');
          timerBtn.innerHTML = "00:00:00";
          timerEl.setAttribute('data-state', 'restart');
          intervals[id].timerRunning = false;
          $scope.timeEvent = "startTimer";
          $scope.timers.splice($scope.timers.indexOf(id), 1);
          $scope.intervalObj.description = "";
          $scope.projects = Project.query();
        },
        function(err){
          $log.error(err);
        }
      );
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    $scope.showNewProjectForm = function(ev){
      $mdDialog.show({
        controller: 'appCtrl',
        templateUrl: 'angular/partials/project-new.html',
        parent: angular.element(document.getElementById('app')),
        targetEvent: ev,
        clickOutsideToClose: true
      });
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
  }])
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
  .directive('infilechange', function(){
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs){
        angular.element($element).on('change', function(e){
          var filename = '';
          if(this.files && this.files[0]){
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
  .directive('incounting', ['$interval', 'apiSrv', function($interval, apiSrv){
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
            if(timerEl[0].getAttribute('data-state') === 'restart'){
              totalElapsed = elapsed = 0;
              timerEl[0].removeAttribute('data-state');
            }
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
               'ui.router'
])
.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams){
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
  var templateDir = 'angular/partials';

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('main', {
      url: '/',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html',
          controller: 'mainCtrl'
        },
        'landing@main': {
          templateUrl: templateDir + '/landing.html',
          controller: 'mainCtrl'
        },
        'app@main': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@main': {
          templateUrl: templateDir + '/nav.html',
          controller: 'appCtrl'
        },
        'auth@main': {
          templateUrl: templateDir + '/auth.html',
          controller: 'appCtrl'
        }
      }
    });
}]);