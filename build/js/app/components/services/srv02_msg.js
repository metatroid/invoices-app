angular.module('invoices.services')
  .factory('msgSrv', ['$rootScope',
    function($rootScope){
      var msgSrv = {};
      msgSrv.state = {};
      msgSrv.appScope = [];
      msgSrv.vars = {};
      msgSrv.projectTiming = {};
      msgSrv.setTimingStatus = function(timingObj){
        msgSrv.projectTiming = timingObj;
      }
      msgSrv.getTimingStatus = function(timingObj){
        return msgSrv.projectTiming;
      }
      msgSrv.setVars = function(obj){
        msgSrv.vars = obj;
      };
      msgSrv.getVars = function(){
        return msgSrv.vars;
      };
      msgSrv.setState = function(stateLabel, data){
        msgSrv.state = {
          fn: stateLabel,
          args: data
        };
        $rootScope.$broadcast('updateState');
      };
      msgSrv.setScope = function(key, value){
        msgSrv.appScope[key] = value;
      };
      msgSrv.getScope = function(key){
        return msgSrv.appScope[key];
      };
      msgSrv.emitMsg = function(message){
        $rootScope.$broadcast(message);
      };
      
      return msgSrv;
    }
  ])
;