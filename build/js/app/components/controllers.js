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
  .controller('appCtrl', ['$scope', '$log', '$sce', 'apiSrv', function($scope, $log, $sce, apiSrv){
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
    var addProject = function(projectData){
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
            getProjects();
          }
        },
        function(err){
          $log.error(err);
          $scope.newProject.error = formatErr(err);
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
    $scope.createProject = function(){
      $scope.newProject.error = "";
      var projectData = {
        "user": $scope.user.id,
        "project_name": $scope.newProject.project_name,
        "project_url": $scope.newProject.project_url,
        "project_description": $scope.newProject.project_description,
        "client_name": $scope.newProject.client_name,
        "client_email": $scope.newProject.client_email,
        "deadline": $scope.newProject.deadline,
        "hourly_rate": $scope.newProject.hourly_rate,
        "fixed_rate": $scope.newProject.fixed_rate,
        "project_logo": $scope.newProject.project_logo
      };
      addProject(projectData);
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