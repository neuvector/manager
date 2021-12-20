// Karma configuration
// Generated on Wed Nov 04 2020 17:16:16 GMT-0800 (Pacific Standard Time)

module.exports = function(config) {
  config.set({

    client: {
      captureConsole: false
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/angular/angular.min.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/ag-grid/dist/ag-grid.min.js',
      'bower_components/pako/dist/pako.min.js',
      'js/**/*.module.js',
      'js/**/*.js',
      'test/ut/**/*.spec.js',
      'test/ut/**/*.data.js'
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'js/**/*.js': ['babel', 'coverage'],
      'test/ut/spec/**/*.js': ['babel']
    },


    babelPreprocessor: {
      options: {
        presets: ['babel-preset-env'],
        sourceMap: 'inline'
      },
      filename: function (file) {
        return file.originalPath.replace(/\.js$/, '.es5.js');
      },
      sourceFileName: function (file) {
        return file.originalPath;
      }
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type : 'html',
      dir : 'test/ut/coverage/'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      // 'PhantomJS',
      // 'Chrome'
      'ChromeHeadless'
    ],

    customLaunchers:{
      HeadlessChrome:{
        base: 'ChromeHeadless',
        flags: [
          '--disable-web-security',
          '--disable-gpu',
          '--no-sandbox'
        ]
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    plugins: [
     'karma-jasmine',
     'karma-coverage',
     'karma-phantomjs-launcher',
     'karma-chrome-launcher',
     'karma-babel-preprocessor'
    ]
  })
}
