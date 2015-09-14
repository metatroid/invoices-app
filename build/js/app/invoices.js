angular.module('invoices', [
               'invoices.controllers',
               'invoices.states',
               'invoices.services'
]);

angular.module('invoices.states', []);
angular.module('invoices.services', []);

angular.module('invoices')
  .config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
  }
]);