angular.module('invoices.directives')
  .directive('infile', 
    function(){
      return {
        scope: {
          infile: "="
        },
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var currentLogo = $scope.$eval($attrs.currentLogo);
          var addRemoveLink = function(){
            var removeLogo = document.createElement('a');
            removeLogo.id = "removeLogo";
            removeLogo.setAttribute('href', '#');
            removeLogo.innerHTML = "<span class='fa fa-remove'></span>";
            removeLogo.addEventListener('click', function(e){
              e.preventDefault();
              document.getElementById('logoPreview').remove();
              document.getElementById('removeLogo').remove();
              $scope.$apply(function(){
                $scope.infile = null;
              });
            });
            angular.element($element)[0].parentElement.appendChild(removeLogo);
          };
          if(currentLogo){
            var img = new Image();
            var preview = document.getElementById('logoPreview') || document.createElement('img');
            preview.id = "logoPreview";
            preview.setAttribute('src', currentLogo);
            preview.style.width = "100px";
            angular.element($element)[0].parentElement.appendChild(preview);
            addRemoveLink();
            img.onload = function(){
              $scope.$apply(function(){
                $scope.infile = urlToBase64(img);
              });
            };
            img.src = currentLogo;
          }
          angular.element($element).on('change', function(e){
            var reader = new FileReader(),
                filename = '',
                input = this,
                data;
            if(this.files && this.files[0]){
              reader.onload = function(ev){
                data = ev.target.result;
                console.log(data);
                var preview = document.getElementById('logoPreview') || document.createElement('img');
                preview.id = "logoPreview";
                preview.setAttribute('src', reader.result);
                preview.style.width = "100px";
                input.parentElement.appendChild(preview);
                addRemoveLink();
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
    }
  )
;