// =====================================================================================================================
// Live CSS, Dynamic CSS module for AngularJS
// ... developed by: ofzza
// =====================================================================================================================

(function() {
    "use strict";
    var $debug = false;

    // LiveCss Math extension
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Get debug flag
        angular.module('LCSS').config([ '$compileProvider', 'LCSSGlobalsProvider', function($compileProvider, LCSSGlobalsProvider) {

            // Set debugging flag
            $debug = LCSSGlobalsProvider.$debug;

            // Define Interpolation directive
            var uniqueInterpolationId = 0;
            $compileProvider.directive('interpolate', ['$interpolate', 'LCSSRuntime', function($interpolate, LCSSRuntime) {
                return {
                    restrict: 'EA',
                    compile: function (element, attrs) {

                        // Extract internal syntax
                        uniqueInterpolationId++
                        var rawSyntax = element[0].innerHTML,
                            previousSyntax = null,
                            uniqueIdentifierStart = '/* $interpolation:start:' + uniqueInterpolationId + ' */',
                            uniqueIdentifierEnd = '/* $interpolation:end:' + uniqueInterpolationId + ' */';
                        element[0].innerHTML = uniqueIdentifierStart + ' ' + rawSyntax + ' ' + uniqueIdentifierEnd;

                        // Initialize search indices
                        var startIndex = 0, endIndex = 0;

                        // Return link function
                         return function link($scope, element, attrs) {

                             // Get parent LiveCSS document hash
                             var document = LCSSRuntime.document.getByHash( $scope.$$lcss );

                             // Define refresh event handler
                             var scheduled = false;

                             var cancelEventListener = document.$scope.$on('$$lcss-refresh', function() {               // TODO: Re-enable event in LCSSDocument, or find a better communication channel!

                                 // Check parent document processing phase
                                 if (document.syntax.$awaiting) cancelEventListener;

                                 if (!scheduled) {
                                     scheduled = true;
                                     setTimeout(function() {
                                         scheduled = false;

                                         // Interpolate syntax
                                         var interpolatedSyntax = $interpolate(rawSyntax)($scope);
                                         // Check if syntax changed
                                         if (interpolatedSyntax != previousSyntax) {

                                             // Register for future comparison
                                             previousSyntax = interpolatedSyntax;

                                             // Update document syntax
                                             var syntax = document.syntax.linked;
                                             if (syntax) {

                                                 // Get $awaiting flag
                                                 var $awaitFlag = document.syntax.$awaiting;

                                                 // Reset indices in needed
                                                 startIndex = (startIndex > -1 ? startIndex : 0);
                                                 endIndex = (endIndex > -1 ? endIndex : 0);

                                                 // Process syntax
                                                 startIndex = syntax.indexOf(uniqueIdentifierStart, startIndex) + uniqueIdentifierStart.length;
                                                 if (startIndex > uniqueIdentifierStart.length) {
                                                     endIndex = syntax.indexOf(uniqueIdentifierEnd, startIndex);
                                                     if (endIndex > startIndex) {
                                                         syntax = syntax.substr(0, startIndex) + interpolatedSyntax + syntax.substr(endIndex);
                                                     };
                                                 };

                                                 // Update syntax
                                                 document.syntax.linked = syntax;
                                                 // Get $awaiting flag
                                                 document.syntax.$awaiting = $awaitFlag;
                                             }

                                         }

                                     });
                                 }

                             });

                         };

                    }
                };
            }]);

        }]);

    }

})();