// =====================================================================================================================
// Live CSS, Dynamic CSS module for AngularJS
// ... developed by: ofzza
// =====================================================================================================================

(function() {
    "use strict";
    var $debug = false;

    // Angular module system integration
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * Instantiate AngularJS module for LiveCss (LCSS) if not already present
         */
        try { angular.module("LCSS"); } catch (err) { angular.module('LCSS', ['ng']); }

    }

    // Define LiveCSS directive
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Holds references to registered documents (used to keep track of duplicate loads)
        var registered = { }

        /**
         * Defines LiveCSS directive
         * - If has "src" attribute loads LiveCSS syntax from URL, otherwise loads from element content
         * - Tracks duplicates by LiveCSS Document hash, and destroys all loaded documents if all references to it are removed
         */
        angular.module('LCSS').directive('lcss', ['LCSSGlobals', function(LCSSGlobals) {
            // Set debugging flag
            $debug = LCSSGlobals.$debug;

            return {
                scope: false,
                restrict: 'EA',
                link: function($scope, element, attrs) {

                    // Inject LCSS
                    var LCSS = angular.injector(['LCSS']).get('LCSS');

                    // Check for "src" attribute
                    var src = (attrs['src'] ? $scope.$eval( attrs['src'] ) : null);

                    // Parse documents from syntax
                    LCSS.parse({
                        syntax: (src ? null : element[0].innerHTML),
                        syntaxUrl: (src ? src : null)
                    }).then(
                        function(docs) {

                            // Echo debug info
                            if ($debug) console.log('> [LCSSDirective]: ', 'Loaded and parsed documents:', docs);

                            // Register documents
                            for (var i=0; i<docs.length; i++) {

                                // Echo debug info
                                if ($debug) console.log('> [LCSSDirective]: ', 'Registering document [hash="' + docs[i].hash() + '"]');

                                // Increment registrations count
                                if (!registered[ docs[i].hash() ] ) registered[ docs[i].hash() ] = 0;
                                registered[ docs[i].hash()] += 1;

                            }

                            // Handle element destroyed
                            element.on('$destroy', function() {

                                // Unregister documents
                                for (var i=0; i<docs.length; i++) {

                                    // Echo debug info
                                    if ($debug) console.log('> [LCSSDirective]: ', 'Unregistering document [hash="' + docs[i].hash() + '"]');

                                    // Decrement registrations count
                                    if (registered[ docs[i].hash() ] ) registered[ docs[i].hash()] -= 1;

                                    // Destroy document if orphaned
                                    if (registered[ docs[i].hash() ] <= 0) {
                                        registered[ docs[i].hash() ] = 0;
                                        docs[i].$destroy();
                                    }

                                }

                            });

                        },
                        function(error) {
                            // Throw load/parse error
                            throw new Error('Failed loading/parsing LiveCSS by directive' + (src ? ' from "' + src + '"!' : '!'), error);
                        }
                    );

                }
            };

        }]);

    }

})();