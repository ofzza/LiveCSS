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
        try { angular.module("LCSS"); } catch(err) { angular.module('LCSS', ['ng']); }

        /**
         * LiveCss Runtime Provider
         * @returns {{$get: *}}
         * @constructor
         */
        var LiveCssRuntimeProvider = ['LCSSGlobalsProvider', function (LCSSGlobalsProvider) {
            // Set debugging flag
            $debug = LCSSGlobalsProvider.$debug;
            // Extend LiveCss Runtime object to meet service interface
            LiveCssRuntime.$get = function() { return LiveCssRuntime; };
            // Return LiveCss Runtime object
            return LiveCssRuntime;
        }];

        /**
         * Defines LiveCSS provider
         * - Exposes a LiveCss Globals object
         */
        angular.module('LCSS').provider('LCSSRuntime', LiveCssRuntimeProvider);

    }

    // LiveCss Runtime: Document management
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * Holds references to all registered documents by hash
         * @type {{}}
         */
        var documents = { }

        /**
         * Check for duplicates by hash and tries registering a LiveCss Document
         * @param hash LiveCss Document's unqiue hash
         * @param document LiveCss Document object
         * @returns Boolean value signifying if registration was completed (false if same hash previously registered)
         * @constructor
         */
        var RegisterDocument = function(hash, document) {
            // Check for duplicates
            if (documents[ hash ]) {
                // Echo debug info
                if ($debug) console.error('> [LCSSRuntime]: ', 'Failed registering document [hash="' + hash + '"]  - duplicate found!');
                // Return failed
                return documents[ hash ];
            }
            // Register to repository
            documents[ hash ] = document;
            // Monitor document's scope
            MonitorDocumentScope( document );
            // Echo debug info
            if ($debug) console.log('> [LCSSRuntime]: ', 'Registered document [hash="' + hash + '"]');
            // Enable runtime loop
            LiveCssRuntimeLoop();
            // Return success
            return document;
        }

        /**
         * Checks for and unregisters a LiveCss Document
         * @param hash LiveCss Document's unqiue hash
         * @return {boolean} Boolean value signifying if document was found and unregistered
         * @constructor
         */
        var UnregisterDocument = function(hash) {
            // Check if registered
            if (!documents[ hash ]) {
                // Echo debug info
                if ($debug) console.error('> [LCSSRuntime]: ', 'Failed unregistering document [hash="' + hash + '"]  - hash not registered!');
                // Return no document
                return false;
            }
            // Unregister from repository
            delete(documents[ hash ]);
            // Echo debug info
            if ($debug) console.log('> [LCSSRuntime]: ', 'Unregistered document [hash="' + hash + '"]');
            // Return success
            return true;
        }

    }

    // LiveCss Runtime Loop
    // -----------------------------------------------------------------------------------------------------------------
    {


        /**
         * Monitors LiveCss Document's scope for changes
         * @param document LiveCss Document object
         * @constructor
         */
        var MonitorDocumentScope = function(document) {
            // Monitor scope for changes
            document.$scope.$watch(
                function() {

                    // Echo debug info
                    if ($debug) console.log('> [LCSSRuntime]: ', 'Scope $digest called on [hash="' + document.$hash + '"]');

                    // Check documents and set awaiting compilation flag
                    for (var i in documents) {
                        // Check if currently porcessing
                        if ((!documents[i].syntax.$processing) && (documents[i].syntax.$awaiting == documents[i].syntax.$await.none)) {

                            // Schedule document to check for changes
                            documents[i].$refresh();

                        }
                    }

                }
            );
        };

        /**
         * Main runtime loop
         */
        var LiveCssRuntimeLoopScheduled = false;
        var LiveCssRuntimeLoop = function() {
            if (!LiveCssRuntimeLoopScheduled) {

                // Set scheduled flag
                LiveCssRuntimeLoopScheduled = true;

                // Schedule loop cycle
                setTimeout(function () {

                    // Reset scheduled flag
                    LiveCssRuntimeLoopScheduled = false;

                    // Echo debug info
                    if ($debug) console.log('> [LCSSRuntime]: ', 'Running a processing cycle ...');

                    // Process all documents
                    for (var i in documents) {
                        var document = documents[i];

                        // Check processing flag
                        if (!document.syntax.$processing) {

                            // Check awaiting status
                            if (document.syntax.$awaiting == document.syntax.$await.compilation) {
                                // Compile document syntax
                                document.compile();
                            } else if (document.syntax.$awaiting == document.syntax.$await.linking) {
                                // Link document syntax
                                document.link();
                            }

                        }

                    }

                });

            }
        };

    }

    // LiveCss Runtime object
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * LiveCss Runtime
         * @type {{}}
         */
        var LiveCssRuntime = {

            run: function() { LiveCssRuntimeLoop(); },

            document: {

                register: RegisterDocument,
                unregister: UnregisterDocument,

                getByHash: function(hash) { return documents[ hash ]; },
                getByProperty: function(search) {
                }
            }

        };

    }

})();