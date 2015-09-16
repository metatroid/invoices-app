angular.module('invoices', [
               'invoices.controllers',
               'invoices.states',
               'invoices.services',
               'invoices.directives'
]);

angular.module('invoices.states', []);
angular.module('invoices.services', []);
angular.module('invoices.directives', []);

angular.module('invoices')
  .config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
  }
]);