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