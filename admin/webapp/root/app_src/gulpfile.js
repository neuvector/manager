let args = require("yargs").argv,
  gulp = require("gulp"),
  $ = require("gulp-load-plugins")(),
  del = require("del"),
  replace = require("gulp-replace"),
  revHash = require("rev-hash"),
  htmlReplace = require("gulp-html-replace"),
  sass = require("gulp-sass")(require("node-sass")),
  uglifyEs = require("gulp-uglify-es").default,
  uglifyCss = require("gulp-uglifycss"),
  stripDebug = require("gulp-strip-debug"),
  strip = require("gulp-strip-comments"),
  karma = require("karma").Server,
  exec = require("gulp-exec"),
  merge = require("gulp-merge-json"),
  filter = require("gulp-filter");

// production mode
let isProduction = false;
// styles sourcemaps
let useSourceMaps = false;

let date = new Date().toJSON().replace(/-/g, "/");

let revisionHash = revHash(date);

// Application paths
let paths = {
  app: "../app/",
  version: "../app/metadata/js-version.json",
  markup: "html/",
  styles: "sass/",
  scripts: "js/",
  i18n: "i18n/"
};

// Vendor paths
let vendor = {
  // vendor scripts for app starts
  base: {
    source: require("./vendor.base.json"),
    dest: "../app/js",
    name: "base.js"
  },
  // vendor scripts for lazy loading
  app: {
    source: require("./vendor.json"),
    dest: "../vendor"
  }
};

// Source config
let source = {
  scripts: [
    paths.scripts + "app.module.js",
    paths.scripts + "infra/**/*.module.js",
    paths.scripts + "infra/**/*.js",
    paths.scripts + "nv/**/*.module.js",
    paths.scripts + "nv/**/*.js"
  ],
  version: "../app/metadata/js-version.json",
  html: {
    views: [paths.markup + "views/**/*.*", "!" + paths.markup + "index.*"],
    pages: [paths.markup + "pages/**/*.*", "!" + paths.markup + "index.*"]
  },
  styles: {
    app: [paths.styles + "*.*"],
    watch: [paths.styles + "**/*"]
  },
  i18n: paths.i18n + "**/*.json"
};

// Build destination config
let build = {
  scripts: paths.app + "js",
  styles: paths.app + "css",
  templates: {
    index: "../",
    views: paths.app
  },
  views: paths.app + "views/**/*.html",
  pages: paths.app + "pages/**/*.html",
  img: paths.app + "img/**/*.*",
  version: paths.app + "metadata/",
  i18n: paths.app + "i18n/"
};

// Build plugin config
let vendorUglifyOpts = {
  mangle: {
    except: ["$super"]
  }
};

// log to console using
const log = msg => {
  $.util.log($.util.colors.blue(msg));
};

const handleError = function(err)  {
  log(err.toString());
  this.emit("end");
};

gulp.task("i18n:app_en", function() {
  log("Merge en");
  return gulp
    .src(paths.i18n + "en/*.json")
    .pipe(merge({ fileName: "en.json" }))
    .pipe(gulp.dest(build.i18n));
});

gulp.task("i18n:app_zh_cn", () => {
  log("Merge zh_cn");
  return gulp
    .src(paths.i18n + "zh_cn/*.json")
    .pipe(merge({ fileName: "zh_cn.json" }))
    .pipe(gulp.dest(build.i18n));
});

gulp.task("i18n:app", gulp.series("i18n:app_en", "i18n:app_zh_cn"));

gulp.task("scripts:app", () => {
  log("Building scripts..");
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp
    .src(source.scripts)
    .pipe($.jsvalidate())
    .on("error", handleError)
    .pipe($.if(useSourceMaps, $.sourcemaps.init()))
    .pipe($.concat("app.js"))
    .pipe(replace("revisionHash", revisionHash))
    .pipe($.ngAnnotate())
    .on("error", handleError)
    .pipe($.if(isProduction, stripDebug()))
    .pipe($.if(isProduction, strip()))
    .pipe($.if(isProduction, uglifyEs()))
    .on("error", handleError)
    .pipe($.if(useSourceMaps, $.sourcemaps.write()))
    .pipe(gulp.dest(build.scripts));
});

// js-version file
gulp.task("json:js-version", () => {
  log("Set JS version");
  return gulp
    .src(source.version)
    .pipe(
      replace(/\"js_version\"\:.*/, '"js_version": ' + '"' + revisionHash + '"')
    )
    .pipe(gulp.dest(build.version));
});

gulp.task("vendor:base", () => {
  log("Copying base vendor assets..");
  let jsFilter = filter(["**/*.js"], { restore: true });
  return gulp
    .src(vendor.base.source)
    .pipe($.expectFile(vendor.base.source))
    .pipe(jsFilter)
    .pipe($.if(isProduction, strip()))
    .pipe($.if(isProduction, $.uglify()))
    .pipe($.concat(vendor.base.name))
    .pipe(gulp.dest(vendor.base.dest));
});

gulp.task("vendor:base.map", async () => {
  log("Copying base vendor maps..");

  let mapFilter = filter(["**/ui-scroll.js.map"], { restore: true });

  return gulp
    .src(vendor.base.source)
    .pipe($.expectFile(vendor.base.source))
    .pipe(mapFilter)
    .pipe(gulp.dest(vendor.base.dest));
});

// copy file from bower folder into the app vendor folder which is for lazyload
gulp.task("vendor:app", () => {
  log("Copying vendor assets..");

  let jsFilter = filter(["**/*.js", "!**/devextreme/js/dx.all.js"], {
    restore: true
  });
  let cssFilter = filter(
    [
      "**/*.css",
      "!**/devextreme/css/dx.common.css",
      "!./devextreme/css/dx.light.css"
    ],
    { restore: true }
  );

  return gulp
    .src(vendor.app.source, { base: "bower_components" })
    .pipe($.expectFile(vendor.app.source))
    .pipe(jsFilter)
    .pipe($.if(isProduction, strip()))
    .pipe($.if(isProduction, $.uglify(vendorUglifyOpts)))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(
      uglifyCss({
        maxLineLen: 1,
        uglyComments: true
      })
    )
    .pipe(cssFilter.restore)
    .pipe(gulp.dest(vendor.app.dest));
});

gulp.task("vendor:appAnt", () => {
  log("Copying vendor assets on node_modules..");
  let jsFilter = filter(["**/*.js", "!**/@antv/g6/dist/g6.min.js"], {
    restore: true
  });
  let cssFilter = filter([], { restore: true });
  return gulp
    .src(vendor.app.source, { base: "node_modules" })
    .pipe($.expectFile(vendor.app.source))
    .pipe(jsFilter)
    .pipe($.if(isProduction, strip()))
    .pipe($.if(isProduction, $.uglify(vendorUglifyOpts)))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(
      uglifyCss({
        maxLineLen: 1,
        uglyComments: true
      })
    )
    .pipe(cssFilter.restore)
    .pipe(gulp.dest(vendor.app.dest));
});

gulp.task(
  "vendor",
  gulp.parallel("vendor:base", "vendor:base.map", "vendor:app", "vendor:appAnt"),
  done => {
    console.log("vendor build finished.");
    done();
  }
);

gulp.task("styles:app", () => {
    log("Building application styles..");
    return gulp
        .src(source.styles.app)
        .pipe($.if(useSourceMaps, $.sourcemaps.init()))
        .pipe(sass())
        .on("error", handleError)
        .pipe(
            uglifyCss({
                maxLineLen: 1,
                uglyComments: true
            })
        )
        .pipe($.if(useSourceMaps, $.sourcemaps.write()))
        .pipe(gulp.dest(build.styles))
        .pipe(exec("touch " + build.styles + "/app.css"));
});

gulp.task("html:views", () => {
    gulp.src(source.html.views).pipe(gulp.dest(build.templates.views + "views"));
    gulp.src(source.html.pages).pipe(gulp.dest(build.templates.views + "pages"));
});

gulp.task("index:Rev", done => {
    gulp
        .src("templates/index.html")
        .pipe(
            htmlReplace({
                css: "app/css/app.css?v=" + revisionHash,
                baseJs: "app/js/base.js?v=" + revisionHash,
                appJs: "app/js/app.js?v=" + revisionHash
            })
        )
        .pipe(gulp.dest(build.templates.index));
    done();
});

//---------------
// Watch on dev
//---------------

gulp.task("watch", () => {
    log("Starting watch and LiveReload..");

    $.livereload.listen();

    gulp.watch(source.scripts, gulp.series("scripts:app"));
    gulp.watch(source.i18n, gulp.series("i18n:app"));
    gulp.watch(source.styles.watch, gulp.series("styles:app"));

    let livereloadDelay = 1500;
    let watchSource = [].concat(
        source.scripts,
        source.styles.watch,
        source.i18n,
        build.pages,
        build.views,
        build.img
    );

    const srcWatch = gulp.watch(watchSource);
    srcWatch.on("change", path => {
        setTimeout(() => {
            $.livereload.changed(path);
        }, livereloadDelay);
    });
});

//---------------
// Entry tasks
//---------------
gulp.task("prod", done => {
    log("Starting production build...");
    isProduction = true;
    done();
});

gulp.task(
  "assets",
  gulp.series("i18n:app", "scripts:app", "styles:app", "index:Rev")
);

//Unit test
gulp.task("test", done => {
    karma.start(
        {
            configFile: __dirname + "/karma.conf.js",
            singleRun: true
        },
        () => {
            done();
        }
    );
});

// build for production (minify)
gulp.task(
  "build",
  gulp.parallel("prod", "vendor", "assets", "json:js-version"),
    done => {
        console.log("gulp build finished.");
        done();
    }
);

gulp.task("useSources", () => {
    useSourceMaps = true;
});

// lint javascript
gulp.task("lint", () => gulp
    .src(source.scripts)
    .pipe($.jshint())
    .pipe($.jshint.reporter("jshint-stylish", {verbose: true}))
    .pipe($.jshint.reporter("fail")));

// Remove all files from the build paths
gulp.task("clean", done => {
    let delConfig = [].concat(build.styles, build.scripts, vendor.app.dest);

    log("Cleaning: " + $.util.colors.blue(delConfig));
    del(delConfig, {force: true}, done);
});

// default dev build (no minify)
gulp.task("default", gulp.parallel("vendor", "assets", "watch"));

// build with sourcemaps (no minify)
gulp.task("sourcemaps", gulp.series("useSources", "default"));

// dev build without watch (no minify)
gulp.task("build:dev", gulp.parallel("vendor", "assets"));
