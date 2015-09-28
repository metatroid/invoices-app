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