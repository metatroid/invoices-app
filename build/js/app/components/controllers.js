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
  .controller('appCtrl', ['$scope', '$log', '$sce', 'apiSrv', '$mdDialog', 'djResource', '$timeout', function($scope, $log, $sce, apiSrv, $mdDialog, djResource, $timeout){
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
    // $scope.projects = Project.query();
    updateProjectList();
    $scope.newProject = new Project();
    $scope.createProject = function(){
      apiSrv.request('POST', 'projects/', $scope.newProject,
        function(data){
          $scope.cancel();
          clearProjectFormFields();
          updateProjectList();
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
    $scope.deleteProject = function(ev, id){
      var confirm = $mdDialog.confirm()
          .title('You are about to delete this project.')
          .content('This action cannot be undone. Are you sure you wish to proceed?')
          .ariaLabel('Confirm delete')
          .targetEvent(ev)
          .ok('Delete this project')
          .cancel('Cancel');
      var id = id;
      $mdDialog.show(confirm).then(function() {
        apiSrv.request('DELETE', 'projects/'+id, {},
          function(data){
            $log.info(data);
            $scope.projects = Project.query();
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