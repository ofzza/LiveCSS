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
         * LiveCss Globals object
         * @returns {{$get: *}}
         * @constructor
         */
        var LiveCssGlobalsProvider = [ function () {
            // Extend LiveCss Globals object to meet service interface
            LiveCssGlobals.$get = function() { return LiveCssGlobals; };
            // Return LiveCss Globals object
            return LiveCssGlobals;
        }];

        /**
         * Defines LiveCSS provider
         * - Exposes a LiveCss Globals object
         */
        angular.module('LCSS').provider('LCSSGlobals', LiveCssGlobalsProvider);

    }

    // LiveCss Globals object
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * Shared, internal, global object
         * @type {{}}
         */
        var LiveCssGlobals = {

            // Holds debug output flag
            $debug: true,

            // Reference to LiveCss RootScope, child of $rootScope
            $scope: null

        }

    }

})();
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
         * LiveCss Extension provider
         * @returns {{$get: *}}
         * @constructor
         */
        var ProviderWrapper = [ 'LCSSGlobalsProvider', function (LCSSGlobalsProvider) {
            // Set debugging flag
            $debug = LCSSGlobalsProvider.$debug;
            // Extend LiveCss Extension provider to meet service interface
            LiveCssExtensionProvider.$get = function() { return LiveCssExtensionService; };
            // Return LiveCss Extension provider
            return LiveCssExtensionProvider;
        }];

        /**
         * Defines LiveCSS provider
         * - Exposes a LiveCss Globals object
         */
        angular.module('LCSS').provider('LCSSExtension', ProviderWrapper);

    }

    // LiveCss Extension Provider
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * LiveCss Extension provider
         * @type {{create: Function}}
         */
        var LiveCssExtensionProvider = {
            /**
             * Creates and adds a new extension to runtime
             * @param path Extension path (namespaced name, example: "mynamespace.myextension")
             * @param config ExtensionConfigurationObject
             * @param global If true, applies extension to all documents
             * @return {LiveCssExtension}
             */
            create: function (path, config, global) { return new LiveCssExtension(path, config, global); }
        };
    }

    // LiveCss Extension Service
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Central registry of all extensions
        var extensions = { };

        /**
         * LiveCss Extension service
         * @type {{get: Function}}
         */
        var LiveCssExtensionService = {
            /**
             * Gets all extensions matching passed path (if present) and all global extensions
             * @param path Path, or starting path segment to match
             * @return {Array} Array of matched and global extensions
             */
            get: function(path) {

                // Initialize response
                path = (path && path instanceof Array ? path : [ path ]);
                if (path.length == 0) path.push(null);
                var matched = { };

                // Search for matches
                for (var i=0; i<path.length; i++) {
                    for (var key in extensions) {
                        if ((!path[i]) || (extensions[key].global) || ((typeof path[i] == 'string') && (key.length >= path[i].length) && (key.substr(0, path[i].length) == path[i]))) {
                            matched[key] = extensions[key];
                        }
                    }
                }

                // Compose matches to array
                var array = [ ];
                for (var i in matched) array.push( matched[i] );

                // Return matched
                return array;

            }
        };
    }

    // LiveCss Extension class
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * LiveCss Extension class
         * @param path Extension path (namespaced name, example: "mynamespace.myextension")
         * @param config ExtensionConfigurationObject
         *      ExtensionConfigurationObject = {
         *          syntax: {
         *              loading: function(syntax) { returns syntax; },
         *              compilation: function(syntax) { returns syntax; },
         *          },
         *          resource: {
         *              static: function() {
         *                  return resource;
         *              },
         *              dynamic: function($updateFn) {
         *                  something.on('event', function() {
         *                      // ... modify resource object
         *                      $updateFn( resource );
         *                  });
         *              }
         *          }
         *      }
         *      "this", in context of all extension functions, is a common resource object for sharing state
         * @param global If true, applies extension to all documents
         * @constructor
         */
        var LiveCssExtension = function(path, config, global) {

            // Parse extension path
            var pathArray = this.path = path.split('.');
            for (var i=0; i<this.path.length; i++) this.path[i] = this.path[i].trim();

            // Store global flag
            this.global = (global || false);

            // Parse extension configuration
            var callbackFns = {
                syntax: {
                    loading: (config && config.syntax && typeof config.syntax.loading == 'function' ? config.syntax.loading : null),
                    compilation: (config && config.syntax && typeof config.syntax.compilation == 'function' ? config.syntax.compilation : null)
                },
                resource: {
                    static: (config && config.resource && typeof config.resource.static == 'function' ? config.resource.static : null),
                    dynamic: (config && config.resource && typeof config.resource.dynamic == 'function' ? config.resource.dynamic : null)
                }
            }

            // Initialize extension syntax functions
            this.syntax = {
                /**
                 * Runs loading syntax processor for this extension
                 * @param syntax Unprocessed syntax
                 * @return {*} Processed syntax
                 */
                loading: function(syntax) {
                    if (callbackFns.syntax.loading) {
                        return callbackFns.syntax.loading( syntax );
                    } else {
                        return syntax;
                    }
                },
                /**
                 * Runs compilation syntax processor for this extension
                 * @param syntax Unprocessed syntax
                 * @return {*} Processed syntax
                 */
                compilation: function(syntax) {
                    if (callbackFns.syntax.compilation) {
                        return callbackFns.syntax.compilation( syntax );
                    } else {
                        return syntax;
                    }
                }
            }

            // Initialize extension resource functions
            var resource = null,
                $updateFn = function(res) {
                    // Update resource
                    resource = res;
                    // Update all subscribed documents
                    for (var i in documents) updateFn( documents[i], resource );
                };
            this.resource = {
                static: function() {
                    if (callbackFns.resource.static) {
                        // Update resource
                        resource = callbackFns.resource.static();
                        // Update all subscribed documents
                        for (var i in documents) updateFn( documents[i], resource );
                        // Return extended
                        return true;
                    } else {
                        // Return not extended
                        return false;
                    }
                },
                dynamic: function() {
                    if (callbackFns.resource.dynamic) {
                        callbackFns.resource.dynamic( $updateFn );
                        // Return extended
                        return true;
                    } else {
                        // Return not extended
                        return false;
                    }
                }
            }

            // Document registration
            var documents = { };
            /**
             * Subscribe a LiveCss Document to this extension
             * @param hash LiveCss Document's hash
             * @param document LiveCss Document object
             */
            this.subscribe = function(hash, document) {
                // Echo debug info
                if ($debug) console.log('> [LCSSExtension "' + path + '"]: ', 'Subscribed document [hash="' + hash + '"]');
                // Register document
                documents[ hash ] = document;
                // Update document with extension resource
                if (resource) updateFn( document, resource );
            }
            /**
             * Unsubscribe a LiveCss Document from this extension
             * @param hash LiveCss Document's hash
             */
            this.unsubscribe = function(hash) {
                // Echo debug info
                if ($debug && documents[ hash ]) console.log('> [LCSSExtension "' + path + '"]: ', 'Unsubscribed document [hash="' + hash + '"]');
                // Unregister document
                delete( documents[ hash ] );
            }

            /**
             * Updates LiveCss Document's scope with extension value
             * @param document LiveCss Document object
             * @param resource Resource to expose on scope
             */
            var updateFn = function(document, resource) {
                // Inject extension resource to scope
                var target = document.$scope;
                for (var i=0; i<pathArray.length - 1; i++) {
                    if (!target[ pathArray[i] ]) target[ pathArray[i] ] = { }
                    target = target[ pathArray[i] ];
                }
                target[ pathArray[ pathArray.length - 1 ] ] = resource;
                // Refresh document
                document.$refresh();
            }

            // Register extension
            extensions[ path ] = this;

            // Initialize resource extension functions
            this.resource.static();
            this.resource.dynamic();

            // Echo debug info
            if ($debug) console.log('> [LCSSExtension "' + path + '"]: ', 'Created');

        }

    }

})();
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
         * LiveCss Document Provider
         * - Returns LiveCssDocument class modified to meet service definition interface ({ $get: function() { ... } })
         * @returns {{$get: *}}
         * @constructor
         */
        var LiveCssDocumentProvider = ['LCSSGlobalsProvider', 'LCSSRuntimeProvider', function (LCSSGlobalsProvider, LCSSRuntimeProvider) {
            // Set debugging flag
            $debug = LCSSGlobalsProvider.$debug;
            // Store reference to the LiveCSS Globals object
            LiveCssGlobals = LCSSGlobalsProvider;
            // Store reference to the LiveCSS Runtime object
            LiveCssRuntime = LCSSRuntimeProvider;
            // Extend LiveCss Document class to meet service interface
            LiveCssDocument.$get = [ 'LCSSExtension', function(LCSSExtension) {
                // Store reference to the LiveCSS Extension object
                LiveCssExtension = LCSSExtension;
                // Return LiveCss Document class
                return LiveCssDocument;
            } ];
            // Return LiveCss Document class
            return LiveCssDocument;
        }];

        /**
         * Defines LiveCSS document provider
         * - Exposes LiveCss Document class
         */
        angular.module('LCSS').provider('LCSSDocument', LiveCssDocumentProvider);

    }

    // LiveCss Document class
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * Holds reference to LiveCSS Globals object (Injected by provider on runtime)
         * @type {null}
         */
        var LiveCssGlobals = false;
        /**
         * Holds reference to LiveCSS Runtime object (Injected by provider on runtime)
         * @type {null}
         */
        var LiveCssRuntime = false;
        /**
         * Holds reference to LiveCSS Extension object (Injected by provider on runtime)
         * @type {null}
         */
        var LiveCssExtension = false;

        /**
         * Defines default LiveCss document parameters
         * @type LiveCssDocumentParameters object
         */
        var LiveCssDefaultParameters = {
            import: []
        };

        /**
         * LiveCss Document class
         * @param el Html element containing LiveCss syntax
         * @param params LiveCssDocumentParameters object
         * @constructor
         */
        var LiveCssDocument = function (el, params) {

            // Check AngularJS execution phase (Need to have reference to root scope to start)
            if (!LiveCssGlobals || !LiveCssGlobals.$scope) throw new Error('A new LiveCss Document can only be created during AngularJS runtime phase!');

            // Instantiate local scope (Inherits from LiveCss root scope, which in turn inherits from $rootScope)
            var $scope = this.$scope = LiveCssGlobals.$scope.$new();

            // Initialize parameters
            params = params || {};
            var parameters = this.parameters = ProcessLiveCssDocumentParameters(el, params, $scope);

            // Calculate syntax hash
            var hash = this.$hash = $scope.$$lcss = GetSyntaxHash(el.innerHTML);

            // Register with runtime
            var registeredDoc = LiveCssRuntime.document.register(hash, this);
            if (registeredDoc === this) {

                // If registered, continue initialization
                // --------------------------------------

                // Initialize host element
                var hostEl = this.$hostEl = new LiveCssDocumentHostElement(this);

                // Initialize syntax object
                var syntax = this.syntax = new LiveCssDocumentSyntax(hash, this, el.innerHTML);

                // Initialize watcher function
                this.$refresh = new LiveCssDocumentScopeWatcher(this);

                // Initialize processor functions
                var processingFns = LiveCssDocumentProcessingFactory(this);
                var compileFn = this.compile = processingFns.compile;
                var linkFn = this.link = processingFns.link;

                // Watch imports for changes and manage subscriptions to extensions
                var self = this;
                var cancelImportWatcherFn = $scope.$watch(
                    function () {
                        return parameters.import;
                    },
                    function (newImport, oldImport) {

                        // Unsubscribe from old extensions
                        var oldExtensions = LiveCssExtension.get(oldImport);
                        for (var i = 0; i < oldExtensions.length; i++) oldExtensions[i].unsubscribe(hash);

                        // Subscribe to new extensions
                        var newExtensions = LiveCssExtension.get(newImport);
                        for (var i = 0; i < newExtensions.length; i++) newExtensions[i].subscribe(hash, self);

                    },
                    true
                );

                // Define unload functionality
                var unloadFn = this.$unload = function() {

                    // Stop watching extension subscriptions
                    cancelImportWatcherFn();
                    // Destroy scope
                    $scope.$destroy();
                    // Remove host element
                    hostEl.destroy();

                    // Echo debug info
                    if ($debug) console.log('> [LCSSDocument "' + hash + '"]: ', 'Unloaded!!');

                }
                // Define destroy functionality
                var destroyFn = this.$destroy = function() {

                    // Unsubscribe from all extensions
                    var extensions = LiveCssExtension.get();
                    for (var i=0; i<extensions.length; i++) extensions[i].unsubscribe( hash );
                    // Unregister from runtime
                    LiveCssRuntime.document.unregister( hash );
                    // Unload document
                    unloadFn();

                    // Echo debug info
                    if ($debug) console.log('> [LCSSDocument "' + hash + '"]: ', 'Destroyed!!');

                }

            } else {

                // If duplicate document - uninitialize
                // -------------------------------------

                // Destroy scope
                $scope.$destroy();

            }

            // Return wrapper
            return {
                hash: function() { return registeredDoc.$hash; },

                parameters: registeredDoc.parameters,
                $scope: registeredDoc.$scope,
                syntax: registeredDoc.syntax,
                $destroy: registeredDoc.$destroy
            }

        };

        // Extend prototype
        LiveCssDocument.defaultParameters = LiveCssDefaultParameters;
        LiveCssDocument.target = document.head;

    }

    // LiveCss Document Initialization
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * Processes document parameters from all available sources (passed params variable, element attributes, default parameters)
         * @param el HTML element containing LiveCss syntax
         * @param params LiveCssDocumentParameters object
         * @param $scope Reference to document's local scope
         * @returns Processed parameters object
         * @constructor
         */
        var ProcessLiveCssDocumentParameters = function (el, params, $scope) {
            // Initialize parameters
            var parameters = {};
            // Import default parameters
            for (var param in LiveCssDefaultParameters) parameters[param] = LiveCssDefaultParameters[param];
            // Import from attributes
            var lazyEvalAttributes = [ 'watch' ];
            for (var i = 0; i < el.attributes.length; i++) {
                if (lazyEvalAttributes.indexOf( el.attributes[i].name ) > -1) {
                    parameters[el.attributes[i].name] = el.attributes[i].value;
                } else {
                    parameters[el.attributes[i].name] = $scope.$eval(el.attributes[i].value);
                }
            }
            // Import from passed parameters variable
            for (var param in params) parameters[param] = params[param];
            // Return composed parameters
            return parameters;
        }

        /**
         * Hashes LiveCSS syntax for later comparison and duplicate removal
         * @param syntax LiveCSS syntax
         * @return {*} LiveCss syntax hash
         * @constructor
         */
        var GetSyntaxHash = function(syntax) {
            var hash = 0;
            if (syntax.length == 0) return hash;
            for (var i = 0; i < syntax.length; i++) {
                var char = syntax.charCodeAt(i);
                hash = ((hash<<5)-hash) + char;
                hash = hash & hash;
            }
            return '$LCSS:' + hash.toString();
        }

    }

    // LiveCss Document Scope Watcher
    // -----------------------------------------------------------------------------------------------------------------
    {

        var LiveCssDocumentScopeWatcher = function(doc) {

            // Get raw scope schema
            var $scope = doc.$scope.$new(true),
                scopeProperties = { };
            for (var i in $scope) scopeProperties[i] = true;
            $scope.$destroy();

            /**
             * Extracts only properties unique for the scope
             * @param $scope Scope object
             */
            var stripScope = function($scope) {
                var stripped = { };
                for (var i in $scope) if (!scopeProperties[i]) stripped[i] = $scope[i];
                return stripped;
            }

            // Holds previous evaluation of watched values
            var scheduled = false,
                previous = null;
            // Check watched values against previous values
            return function() {

                // If not scheduled, check if compilation needed
                if (!scheduled) {
                    // Set scheduled status
                    scheduled = true;
                    setTimeout(function() {

                        // Reset scheduled status
                        scheduled = false;

                        // Get new value for watched expression
                        var watched = (doc.parameters.watch ? doc.$scope.$eval(doc.parameters.watch) : stripScope(doc.$scope));
                        // Compare new and previous values
                        if ((typeof previous !== typeof watched) || (!angular.equals(previous, watched))) {
                            // Echo debug info
                            if ($debug) console.log('> [LCSSDocument "' + doc.$hash + '"]: ', 'Detected $scope changes!');
                            // Store changes and signal runtime loop
                            previous = watched;
                            doc.syntax.$awaiting = doc.syntax.$await.linking;
                            LiveCssRuntime.run();
                        }

                        // Notify child scopes of potential change
                        // doc.$scope.$broadcast('$$lcss-refresh');                                                     // TODO: Re-enable event, or find a better communication channel for interpolation!

                    });
                }

            }

        }

    }

    // LiveCss Document Host
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * LiveCss Document's host element wrapper object
         * @param doc Parent LiveCss Document object
         * @constructor
         */
        var LiveCssDocumentHostElement = function(doc) {

            // Define injection point (target element)
            var targetEl = LiveCssDocument.target;

            // Instantiate & inject host element
            var hostEl = document.createElement('livecss-document');
            hostEl.setAttribute('hash', doc.$hash);
            var attributes = {
                url: 'syntaxUrl',
                import: 'import'
            };
            if ($debug) for (var i in attributes) hostEl.setAttribute(i, (doc.parameters[ attributes[i] ] || null));
            hostEl.style.display = 'none';
            targetEl.appendChild( hostEl );

            // Instantiate & inject output element
            var outputEl = document.createElement('style');
            hostEl.appendChild( outputEl );

            /**
             * Gets host element for parent LiveCSS Document
             * @return {HTMLElement} Host element
             */
            this.element = function() { return hostEl; };
            /**
             * Updates processed (CSS) syntax for parent LiveCSS Document
             * @param syntax Processed, LiveCss Document syntax
             */
            this.update = function(syntax) { outputEl.innerHTML = syntax; }
            /**
             * Removes and destroys host element
             */
            this.destroy = function() {
                targetEl.removeChild( hostEl );
            }

        }

    }

    // LiveCss Document Syntax
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Stage configuration
        var LiveCssDocumentSyntaxAwaitables = { none: false, compilation: 1, linking: 2 },
            LiveCssDocumentSyntaxStages = { 'loaded': 'compilation', 'compiled': 'linking', 'linked': 'none'},
            LiveCssDocumentExtensionStages = { 'loaded': 'loading', 'linked': 'compilation' };
        /**
         * Syntax container object
         * @param hash Loaded LiveCss Document's hash
         * @param document Loaded LiveCss Document
         * @param loadedSyntax Loaded LiveCss Document's syntax
         * @constructor
         */
        var LiveCssDocumentSyntax = function(hash, document, loadedSyntax) {

            // Syntax properties
            var self = this;
            for (var key in LiveCssDocumentSyntaxStages) {
                (function(key) {
                    var nextState = LiveCssDocumentSyntaxStages[ key ],
                        syntax = null;
                    Object.defineProperty(self, key, {
                        get: function () {
                            // Return syntax
                            return syntax;
                        },
                        set: function (value) {
                            // Check for changes
                            if (syntax !== value) {
                                // Echo debug info
                                if ($debug) console.log('> [LCSSDocument "' + hash + '"]: ', 'Awaiting next processing stage: ' + nextState);
                                // Set syntax
                                syntax = value;
                                // Execute syntax extensions
                                if (LiveCssDocumentExtensionStages[ key ]) {
                                    var imports = document.parameters.import,
                                        extensions = LiveCssExtension.get( imports );
                                    for (var i=0; i<extensions.length; i++) syntax = extensions[i].syntax[ LiveCssDocumentExtensionStages[ key ] ]( syntax );
                                }
                                // Set "awaiting" flag
                                this.$awaiting = this.$await[ nextState ];
                                // If "awaiting" flag is "none" (no followup), push syntax to host element
                                document.$hostEl.update( syntax );
                                // Trigger LiveCss Runtime Loop cycle
                                if (this.$awaiting !== this.$await.none) LiveCssRuntime.run();
                            } else {
                                // Reset "awaiting" flag
                                this.$awaiting = this.$await.none;
                            }
                        }
                    });
                })(key);
            }

            // Awaiting status property
            var awaiting = false;
            Object.defineProperty(this, '$awaiting', {
                get: function() { return awaiting; },
                set: function(value) { awaiting = value; }
            });

            // Processing status property
            var processing = false;
            Object.defineProperty(this, '$processing', {
                get: function() { return processing; },
                set: function(value) { processing = value; }
            });

            // Store loaded syntax
            this.loaded = loadedSyntax;

        }

        // Extend LiveCssDocumentSyntax class prototype
        LiveCssDocumentSyntax.prototype.$await = LiveCssDocumentSyntaxAwaitables;

    }

    // LiveCss Document Processors
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * Initializes processing functions for a LiveCss Document object
         * @param doc LiveCss Document object
         * @return {Function} Object containing processing function
         * @constructor
         */
        var LiveCssDocumentProcessingFactory = function(doc) {                                                          // TODO: Handle GC bottleneck (<60 FPS issue)

            // Initialize shared state object
            var processingState = {
                compilation: { },
                linking: { },
                interpolation: { }
            };

            // Create static references to link functions and their dependencies (avoids GC work!)
            var linkReferences = {
                linkedEl: null,
                $scope: null
            }
            var linkDigestFn = function() {

                // Digest linking scope
                linkReferences.$scope.$digest();
                // Destroy scope and all children
                linkReferences.$scope.$destroy();

                // Schedule linked syntax processing
                setTimeout( linkApplyFn );
            };
            var linkApplyFn = function(linkedEl) {

                // Echo debug info
                if ($debug) {
                    // Echo to console
                    console.log('> [LCSSDocument "' + doc.$hash + '"]: ', 'Linking ...');
                    // Expose on compilation element
                    if (!processingState.linking.count) processingState.linking.count = 0;
                    processingState.linking.count++;
                    processingState.compilation.compilationEl.attr('linking-iteration', processingState.linking.count);
                    var now = new Date();
                    processingState.compilation.compilationEl.attr('linking-timestamp', now.toTimeString());
                }

                // Strip out linked syntax
                doc.syntax.linked = linkReferences.linkedEl[0].innerHTML;

                // Set syntax processing flag
                doc.syntax.$processing = false;

                // Cleat linking element
                linkReferences.linkedEl.remove();


            };

            // Return processing functions
            return {

                /**
                 * Compiler function
                 */
                compile: function () {

                    // Set syntax processing flag
                    doc.syntax.$processing = true;

                    // Inject $compile service
                    if (!processingState.compilation.$compile) processingState.compilation.$compile = angular.injector(['LCSS']).get('$compile');

                    // Initialize and inject compilation element
                    if (!processingState.compilation.compilationEl) {
                        processingState.compilation.compilationEl = angular.element( '<lcss-compilation>' + doc.syntax.loaded + '</lcss-compilation>' );
                        angular.element( doc.$hostEl.element()).append( processingState.compilation.compilationEl );
                    }

                    // Echo debug info
                    if ($debug) {
                        // Echo to console
                        console.log('> [LCSSDocument "' + doc.$hash + '"]: ', 'Compiling ...');
                        // Expose on compilation element
                        if (!processingState.compilation.count) processingState.compilation.count = 0;
                        processingState.compilation.count++;
                        processingState.compilation.compilationEl.attr('compilation-iteration', processingState.compilation.count);
                        var now = new Date();
                        processingState.compilation.compilationEl.attr('compilation-timestamp', now.toTimeString());
                        processingState.compilation.compilationEl.attr('linking-iteration', null);
                        processingState.compilation.compilationEl.attr('linking-iteration', null);
                    }

                    // Compile syntax and store linking function
                    doc.syntax.compiled = processingState.compilation.$compile(
                        processingState.compilation.compilationEl
                    );

                    // Set syntax processing flag
                    doc.syntax.$processing = false;

                },

                /**
                 * Linker function
                 */
                link: function() {

                    // Set syntax processing flag
                    doc.syntax.$processing = true;

                    // Check if compiled
                    if (doc.syntax.compiled) {

                        // Link
                        doc.syntax.compiled( doc.$scope.$new(), function(linkedEl, $scope) {

                            // Set link digest function dependencies
                            linkReferences.linkedEl = linkedEl;
                            linkReferences.$scope = $scope;

                            // Schedule link digest function (... will in turn schedule link apply function)
                            setTimeout( linkDigestFn );

                        });

                    } else {

                        // Set syntax processing flag
                        doc.syntax.$processing = false;

                        // Compile
                        this.compile();

                    }

                }

            };

        };

    }

})();
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
         * Defines LiveCSS parser service
         * - Parses LiveCSS syntax and returns LiveCss Document references
         * - Run as: " LCSSParser( LiveCssDocumentParameters ) "
         *           LiveCssDocumentParameters = {
         *              global: [ true/false ] (optional),
         *              import: [ string[] ] (optional),
         *              syntax: [ string ] (optional),
         *              syntaxUrl: [ string ] (optional),
         *           }
         */
        angular.module('LCSS').provider('LCSSParser', [function () { return { $get: LiveCssParserFactory } }]);

    }

    // Syntax loading
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * LiveCss Parser service factory
         */
        var LiveCssParserFactory = ['$http', '$q', 'LCSSGlobals', 'LCSSDocument', function ($http, $q, LCSSGlobals, LCSSDocument) {

            // Set debugging flag
            $debug = LCSSGlobals.$debug;

            /**
             * LiveCSS Parser Initialization function
             * @param params LiveCssDocumentParameters object
             * @returns {*} Promise that will resolve to array of LiveCss Document objects created from loaded syntax
             * @constructor
             */
            var LiveCssParserLoadFn = function (params) {

                // Initialize parameters
                params = params || LCSSDocument.defaultParameters;

                // Resolve and return promise for parsed documents' references
                var defered =  $q.defer();

                // Get and parse syntax
                if (params.syntax) {
                    // Process syntax
                    var docs = LiveCssSyntaxParserFn(params.syntax, params, LCSSDocument);
                    // Echo debug info
                    if ($debug) console.log('> [LCSSParser]: ', 'Loaded ' + docs.length + ' documents from raw syntax');
                    // Resolve documents
                    defered.resolve( docs );
                } else if (params.syntaxUrl) {
                    // Get syntax from Url and process syntax
                    $http.get(params.syntaxUrl).then(
                        function (response) {
                            // Process syntax
                            var docs = LiveCssSyntaxParserFn(response.data, params, LCSSDocument);
                            // Echo debug info
                            if ($debug) console.log('> [LCSSParser]: ', 'Loaded ' + docs.length + ' documents from "' + params.syntaxUrl + '"');
                            // Resolve documents
                            defered.resolve( docs );
                        },
                        function (error) {
                            // Throw load syntax error
                            defered.reject();
                            throw new Error('Failed loading LiveCSS syntax from "' + params.syntaxUrl + '":', error);
                        }
                    );
                } else {
                    // Process empty syntax
                    var docs = LiveCssSyntaxParserFn(null, params, LCSSDocument);
                    // Echo debug info
                    if ($debug) console.log('> [LCSSParser]: ', 'Loaded ' + docs.length + ' documents from empty syntax');
                    // Resolve documents
                    defered.resolve( docs );
                }

                // Return promise
                return defered.promise;

            };

            // Return LiveCssParserFn
            return LiveCssParserLoadFn;
        }];
    }

    // Syntax parsing
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * Parses raw LiveCss syntax and returns LiveCss document references
         * @param syntax LiveCss raw syntax
         * @param params LiveCssDocumentParameters object
         * @param LCSSDocument LiveCss Document Service reference
         * @constructor
         */
        var LiveCssSyntaxParserFn = function (syntax, params, LCSSDocument) {

            // Host syntax inside html element for parsing
            var hostEl = document.createElement('syntax');
            hostEl.innerHTML = syntax;

            // Strip out nested elements and any orphaned syntax
            var documentElements = [ ],
                orphanedSegments = [ ];
            for (var i = 0; i < hostEl.childNodes.length; i++) {
                if (hostEl.childNodes[i].nodeName === '#text') {
                    // Digest text node
                    orphanedSegments.push( hostEl.childNodes[i].textContent );
                } else if (hostEl.childNodes[i].nodeName === '#comment') {
                    // Digest comment node
                    orphanedSegments.push( '/*' + hostEl.childNodes[i].textContent + '*/' );
                } else {
                    // Digest HtmlElement node
                    documentElements.push( hostEl.childNodes[i] );
                }
            }

            // Compose orphaned segments into extra document
            var orphanedDocumentContent = '';
            for (var i = 0; i < orphanedSegments.length; i++) {
                var segment = orphanedSegments[i].trim();
                if (segment && segment.length) orphanedDocumentContent += segment + '\r\n';
            }
            if (orphanedDocumentContent && orphanedDocumentContent.trim().length) {
                var orphanedDocument = document.createElement('style');
                orphanedDocument.innerHTML = '\r\n' + orphanedDocumentContent.trim() + '\r\n';
                documentElements.push( orphanedDocument );
            }

            // Wrap syntax into LiveCss Document objects
            var lcssDocuments = [];
            for (var i in documentElements) {
                lcssDocuments.push( new LCSSDocument(documentElements[i], params) );
            }
            return lcssDocuments;

        };
    }

})();
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
         * LiveCss Provider
         * @returns {{$get: *}}
         * @constructor
         */
        var LiveCssProvider = function () {
            LCSS.$get = function() { return LCSS; };
            return LCSS;
        }

        /**
         * Defines LiveCSS document service
         * - Exposes a LiveCss Root Object
         */
        angular.module('LCSS').provider('LCSS', LiveCssProvider);

    }

    // LiveCss ROOT
    // -----------------------------------------------------------------------------------------------------------------
    {

        var LCSS = { }

    }

    // LiveCss INIT
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Holds initialized status
        var initialized = {
            config: false,
            run: false
        };

        // Initializes LiveCSS when module is configured
        angular.module('LCSS').config(
            [
                'LCSSGlobalsProvider', 'LCSSDocumentProvider',
                function( LCSSGlobalsProvider, LCSSDocumentProvider ) {
                    // Check initialized flag
                    if (!initialized.config) {

                        // Set debugging flag
                        $debug = LCSSGlobalsProvider.$debug;

                        // Expose LiveCss document class
                        LCSS.Document = LCSS.Doc = LCSSDocumentProvider;
                        // Expose target function (sets host element for embedded LiveCss syntax elements)
                        LCSS.target = function(targetEl) { LCSSDocumentProvider.target = targetEl; }

                        // Set initialized flag
                        initialized.config = true;

                    }
                }
            ]
        );

        // Initializes LiveCSS runtime when module runs
        angular.module('LCSS').run(
            [
                'LCSSGlobals', 'LCSSDocument', 'LCSSParser', '$rootScope',
                function( LCSSGlobals, LCSSDocument, LCSSParser, $rootScope ) {
                    // Check initialized flag
                    if (!initialized.run) {

                        // Expose LiveCss parser function
                        LCSS.parse = LCSSParser;
                        // Expose LiveCss document class
                        LCSS.Document = LCSS.Doc = LCSSDocument;

                        // Link child scope of $rootScope to LCSSDocument class and expose on $rootScope
                        $rootScope.LCSS = LCSSGlobals.$scope = $rootScope.$new();

                        // Set initialized flag
                        initialized.run = true;

                    }
                }
            ]
        );

    }

})();
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
            LCSSExtensionProvider.create('Math', {
                resource: {
                    static: function() { return Math; }
                }
            }, true);

        }]);

    }

})();
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
            LCSSExtensionProvider.create('Window', {
                resource: {
                    dynamic: function($updateFn) {
                        var resizeHandler = function(e) {
                            $updateFn({
                                size: {
                                    width: window.innerWidth,
                                    height: window.innerHeight
                                }
                            });
                        };
                        window.addEventListener('resize', resizeHandler);
                        resizeHandler();
                    }
                }
            });

        }]);

    }

})();
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

            // Initialize extension element
            var element = document.createElement('lcss-cleardom-extension');

            /**
             * Strips out all text and comment nodes and removes all DOM elements
             * @param element Elements to strip content from
             * @return {Array} Array of text content stripped out from passed element
             */
            var stripDOM = function(element) {
                var texts = [ ];
                for (var i=0; i<element.childNodes.length; i++) {
                    // Extract child node content
                    if (element.childNodes[i].nodeName == "#text") {
                        texts.push( element.childNodes[i].textContent );
                    } else if (element.childNodes[i].nodeName == "#comment") {
                        texts.push( '/* ' + element.childNodes[i].textContent + '*/' );
                    } else {
                        var inner = stripDOM( element.childNodes[i] );
                        for (var j=0; j<inner.length; j++) texts.push( inner[j] );
                    }
                    // Remove child node
                    element.removeChild( element.childNodes[i] );
                }
                return texts;
            }

            // Create extension
            LCSSExtensionProvider.create('lcss.ClearDOM', {
                syntax: {
                    compilation: function(syntax) {
                        // Set syntax
                        element.innerHTML = syntax;
                        // Remove DOM
                        var texts = stripDOM(element),
                            text = '';
                        for (var i=0; i<texts.length; i++) text += texts[i];
                        // Return syntax
                        return text;
                    }
                }
            }, true);

        }]);

    }

})();