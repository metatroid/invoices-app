angular.module('invoices', [
               'ngMaterial',
               'invoices.controllers',
               'invoices.states',
               'invoices.services',
               'invoices.directives'
]);

angular.module('invoices.states', []);
angular.module('invoices.services', []);
angular.module('invoices.directives', []);

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
  .controller('appCtrl', ['$scope', '$log', '$sce', 'apiSrv', '$mdDialog', function($scope, $log, $sce, apiSrv, $mdDialog){
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
    var getProjects = function(){
      apiSrv.request('GET', 'projects', {}, 
        function(projects){
          $scope.projects = projects;
        }, 
        function(err){
          $log.error(err);
        }
      );
    };
    $scope.newProject = {
      "project_name": "",
      "project_url": "",
      "project_description": "",
      "client_name": "",
      "client_email": "",
      "deadline": "",
      "hourly_rate": "",
      "fixed_rate": "",
      "project_logo": ""
    };
  var addProject = function(projectData){
      
    };
  $scope.createProject = function(){
      $scope.newProject.error = "";
      var projectData = {
        "user": $scope.user.id,
        "project_name": $scope.newProject.project_name.length ? $scope.newProject.project_name : null,
        "project_url": $scope.newProject.project_url.length ? $scope.newProject.project_url : null,
        "project_description": $scope.newProject.project_description.length ? $scope.newProject.project_description : null,
        "client_name": $scope.newProject.client_name.length ? $scope.newProject.client_name : null,
        "client_email": $scope.newProject.client_email.length ? $scope.newProject.client_email : null,
        "deadline": $scope.newProject.deadline.length ? $scope.newProject.deadline : null,
        "hourly_rate": $scope.newProject.hourly_rate.length ? $scope.newProject.hourly_rate : null,
        "fixed_rate": $scope.newProject.fixed_rate.length ? $scope.newProject.fixed_rate : 0,
        "project_logo": $scope.newProject.project_logo.length ? $scope.newProject.project_logo : null
      };
      apiSrv.request('POST', 'projects', projectData,
        function(data){
          // $log.info(data);
          if(data.error){
            $scope.newProject.error = data.error;
          } else {
            $scope.newProject.project_name = "";
            $scope.newProject.project_url = "";
            $scope.newProject.project_description = "";
            $scope.newProject.client_name = "";
            $scope.newProject.client_email = "";
            $scope.newProject.deadline = "";
            $scope.newProject.hourly_rate = "";
            $scope.newProject.fixed_rate = "";
            $scope.newProject.project_logo = "";
            $scope.cancel();
            getProjects();
            // document.querySelector('.view-panel.active').classList.remove('active');
            // document.getElementById("projects").classList.add('active');
          }
        },
        function(err){
          $log.error(err);
          $scope.newProject.error = formatErr(err);
        }
      );
    };
    $scope.deleteProject = function(id){
      apiSrv.request('DELETE', 'project/'+id, {},
       function(data){
        $log.info(data);
        getProjects();
       },
       function(err){
        $log.error(err);
       }
      );
    };
    if($scope.user){
      getProjects();
    }
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
    }
  })
;
angular.module('invoices.services')
  .factory('apiSrv', ['$http', function($http){
    var apiSrv = {};

    apiSrv.request = function(method, url, args, successFn, errorFn){
      return $http({
        method: method,
        url: '/api/' + url + ".json",
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