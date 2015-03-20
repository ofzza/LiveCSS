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

        // Register extension
        angular.module('LCSS').config([ 'LCSSGlobalsProvider', 'LCSSExtensionProvider', function(LCSSGlobalsProvider, LCSSExtensionProvider) {

            // Set debugging flag
            $debug = LCSSGlobalsProvider.$debug;

            // Create extension
            LCSSExtensionProvider.create('Mouse', {
                resource: {
                    dynamic: function($updateFn) {
                        document.addEventListener('mousemove', function(e) {

                            // Push updated state
                            $updateFn({
                                position: {
                                    absolute: {
                                        x: (e.clientX),
                                        y: (e.clientY)
                                    },
                                    relative: {
                                        x: (e.clientX / window.innerWidth),
                                        y: (e.clientY / window.innerHeight)
                                    }
                                }
                            });

                        });
                    }
                }
            });

        }]);

    }

})();