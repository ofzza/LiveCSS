module.exports = function(grunt) {

    // Project settings
    var liveCssProjectServerPath = 'http://localhost/Ofzza/JS LiveCSS',
        ngVersions = {
        '1.2.0': 'https://code.angularjs.org/1.2.0/angular.js',
        '1.2.1': 'https://code.angularjs.org/1.2.1/angular.js',
        '1.2.2': 'https://code.angularjs.org/1.2.2/angular.js',
        '1.2.3': 'https://code.angularjs.org/1.2.3/angular.js',
        '1.2.4': 'https://code.angularjs.org/1.2.4/angular.js',
        '1.2.5': 'https://code.angularjs.org/1.2.5/angular.js',
        '1.2.6': 'https://code.angularjs.org/1.2.6/angular.js',
        '1.2.7': 'https://code.angularjs.org/1.2.7/angular.js',
        '1.2.8': 'https://code.angularjs.org/1.2.8/angular.js',
        '1.2.9': 'https://code.angularjs.org/1.2.9/angular.js',
        '1.3.0': 'https://code.angularjs.org/1.3.0/angular.js',
        '1.3.1': 'https://code.angularjs.org/1.3.1/angular.js',
        '1.3.2': 'https://code.angularjs.org/1.3.2/angular.js',
        '1.3.3': 'https://code.angularjs.org/1.3.3/angular.js',
        '1.3.4': 'https://code.angularjs.org/1.3.4/angular.js',
        '1.3.5': 'https://code.angularjs.org/1.3.5/angular.js',
        '1.3.6': 'https://code.angularjs.org/1.3.6/angular.js',
        '1.3.7': 'https://code.angularjs.org/1.3.7/angular.js',
        '1.3.8': 'https://code.angularjs.org/1.3.8/angular.js',
        '1.3.9': 'https://code.angularjs.org/1.3.9/angular.js',
        '1.4.0-beta.0': 'https://code.angularjs.org/1.4.0-beta.0/angular.js',
        '1.4.0-beta.1': 'https://code.angularjs.org/1.4.0-beta.1/angular.js',
        '1.4.0-beta.2': 'https://code.angularjs.org/1.4.0-beta.2/angular.js',
        '1.4.0-beta.3': 'https://code.angularjs.org/1.4.0-beta.3/angular.js',
        '1.4.0-beta.4': 'https://code.angularjs.org/1.4.0-beta.4/angular.js',
        '1.4.0-beta.5': 'https://code.angularjs.org/1.4.0-beta.5/angular.js',
        '1.4.0-beta.6': 'https://code.angularjs.org/1.4.0-beta.6/angular.js'
    }

    // Support concurrency
    require('load-grunt-tasks')(grunt);

    // Initialize configuration object
    var conf = {
        pkg: grunt.file.readJSON('package.json'),

            meta : {
        title :         '// Live CSS, Dynamic CSS module for AngularJS',
            version :       '// > <%= pkg.version %>',
            copyright :     '// > ofzza, ' + (new Date()).getFullYear() + '.',
            build :         '// > build: <%= grunt.template.today() %>'
        },

        /* Clear previous build */
        clean: {
            test: ['./test/versioned']
        },

        /* Concatenate LiveCSS files */
        concat : {
            'build-lcss': {
                src: [

                    /* Core components */
                    './src/livecss-globals.js',
                    './src/livecss-runtime.js',
                    './src/livecss-extension.js',
                    './src/livecss-document.js',
                    './src/livecss-parser.js',
                    './src/livecss-directive.js',

                    /* Main module */
                    './src/livecss.js',

                    /* Bundled extensions */
                    './src/extensions/**/*.js'

                ],
                    dest: './dist/livecss-latest.js',
                    filter: 'isFile'
            }
        },

        /* Copy LiveCSS to versioned file */
        copy : {
            /* ... to dist */
            'version-lcss' : {
                src :   [ './dist/livecss-latest.js' ],
                dest :  './dist/livecss.<%= pkg.version.replace(/\\./g, \'-\') %>.js'
            },
            /* ... to demo */
            'copy-to-demo' : {
                src :   [ './dist/livecss-latest.js' ],
                dest :  './demo/livecss.js'
            },
            /* ... to web */
            'copy-to-web' : {
                src :   [ './dist/livecss-latest.js' ],
                dest :  './public_html/res/js/livecss.js'
            },
            /* ... to web */
            'copy-to-test' : {
                src :   [ './dist/livecss-latest.js' ],
                dest :  './test/src/livecss.js'
            }
        },

        /* Minimize 'dist' export */
        uglify : {
            options : {
                banner : '<%= meta.title + \'\\r\\n\' + meta.version + \'\\r\\n\' + meta.copyright + \'\\r\\n\' + meta.build + \'\\r\\n\' %>'
            },
            'minify-build' : {
                src :   [ '<banner>', './dist/livecss-latest.js' ],
                dest :  './dist/livecss.<%= pkg.version.replace(/\\./g, \'-\') %>.min.js'
            }
        },

        /* Compress demo project */
        compress: {
            'compress-demo': {
                options: {
                    mode: 'zip',
                    archive: 'demo.zip'
                },
                files: [{
                    src: ['./demo/*'],
                    dest: './',
                    filter: 'isFile'
                }]
            }
        },

        /* Define watcher task */
        watch : {
            build: {
                files: [
                    /* Package file */
                    './package.json',
                    /* Live CSS code */
                    './src/**/*'
                ],
                tasks: ['concat:build-lcss', 'copy:version-lcss', 'copy:copy-to-web', 'uglify']
            },
            demo: {
                files: [
                    /* Live CSS demo */
                    './demo/**/*'
                ],
                tasks: ['compress:compress-demo']
            },
            test: {
                files: [
                    /* Live CSS tests */
                    './test/src/**/*'
                ],
                tasks: ['clean:test', 'copy:copy-to-test', 'replace']
            }
        },
        /* Define concurrent watcher tasks */
        concurrent: {
            watch: {
                options: {
                    logConcurrentOutput: true
                },
                tasks: ['watch:build', 'watch:demo', 'watch:test']
            }
        },

        shell: {
            'test': { command: 'protractor ./test/conf.js --verbose' }
        }
    };

    // Append test multiplication to configuration object
    {
        conf.replace = { };
        for (var i in ngVersions) {
            conf.replace[i] = {
                options: {
                    patterns: [
                        { match: 'angularjs-version',       replacement: i },
                        { match: 'angularjs-url',           replacement: ngVersions[i] },
                        { match: 'livecss-project-server',  replacement: liveCssProjectServerPath }
                    ]
                },
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: './test/src/',
                        src: ['**/*'],
                        dest: './test/versioned/' + i + '/'
                    }
                ]
            }
        }
    }


    // Init project configuration.
    grunt.config.init(conf);

    // Load plugin(s)
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent ');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-shell');

    // Testing task(s).
    grunt.registerTask('test', [
        'clean:test',
        'copy:copy-to-test',
        'replace',
        'shell:test'
    ]);

    // Default task(s).
    grunt.registerTask('default', [
        'concat:build-lcss',
        'copy:version-lcss', 'copy:copy-to-demo', 'copy:copy-to-web',
        'uglify',
        'compress:compress-demo',
        'concurrent:watch'
    ]);

};