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