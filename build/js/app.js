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
    $scope.user = {};
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
  .controller('anonCtrl', ['$scope', function($scope){}])
  .controller('appCtrl', ['$scope', '$log', '$sce', 'apiSrv', '$mdDialog', '$mdToast', 'djResource', '$timeout', '$http', function($scope, $log, $sce, apiSrv, $mdDialog, $mdToast, djResource, $timeout, $http){
    var Project = djResource('api/projects/:id', {'id': "@id"});
    $scope.projects = Project.query();
    $scope.newProject = new Project();

    $scope.showNewProjectForm = function(ev){
      $mdDialog.show({
        controller: function(){this.parent = $scope;},
        controllerAs: 'ctrl',
        templateUrl: 'angular/partials/project-new.html',
        parent: angular.element(document.getElementById('projects')),
        targetEvent: ev,
        clickOutsideToClose: true,
        onComplete: function(){
          document.getElementsByTagName('md-dialog-content')[0].scrollTop = 0;
          document.querySelectorAll("md-dialog-content input")[0].focus();
        }
      });
    };
    $scope.cancelProject = function() {
      $mdDialog.cancel();
    };

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
    function closeToast(){
      $mdToast.hide();
    }
    $scope.createProject = function(data){
      $log.info(data);
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
      //
      // var form = document.getElementById('projectForm'),
      //     formData = new FormData(form);
      // formData.append('project_logo[]', data.project_logo[0]);
      // $log.info("formdata: ");
      // $log.info(formData);
      // $http.post('/api/projects/', formData, {
      //   transformRequest: angular.identity,
      //   headers: {'Content-Type': undefined}
      // }).success(function(project){
      //   $scope.cancelProject();
      //   detachProjectAndClearFields(project.id);
      // }).error(function(error){
      //   $log.error(error);
      //   $scope.newProject.error = formatErr(error);
      // });
      // var formData = new FormData();
      // formData.append('project_name', data.project_name);
      // formData.append('project_logo', data.project_logo);
      apiSrv.request('POST', 'projects/', data, function(project){
        $scope.cancelProject();
        detachProjectAndClearFields(project.id);
      }, function(error){
        $log.error(error);
        $scope.newProject.error = formatErr(error);
      });

      // $scope.newProject.$save(function(project){
      //   $scope.cancelProject();
      //   detachProjectAndClearFields(project.id);
      // });
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
    $scope.saveInterval = function(id, index){
      var intervalData = {
        "description": $scope.intervalObj.description
      };
      var intervalId = intervals[id].interval,
          timerEl = document.getElementById("project_"+id).querySelector(".timer"),
          timerBtn = timerEl.querySelector('.counter');
      apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', intervalData,
        function(data){
          $scope.projects.splice(index, 1, data);
          // timerBtn.innerHTML = "00:00:00";
          intervals[id].timerRunning = false;
          $scope.timeEvent = "startTimer";
          $scope.intervalObj.description = "";
        },
        function(err){
          $log.error(err);
        }
      );
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
          templateUrl: templateDir + '/main.html'
        },
        'landing@main': {
          templateUrl: templateDir + '/landing.html',
          controller: 'anonCtrl'
        },
        'app@main': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@main': {
          templateUrl: templateDir + '/nav.html'
        },
        'auth@main': {
          templateUrl: templateDir + '/auth.html'
        }
      }
    });
}]);