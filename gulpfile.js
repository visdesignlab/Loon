var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var tsify = require('tsify');
var fancy_log = require('fancy-log');
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var buffer = require("vinyl-buffer");

var paths = {
    pages: ['static/script/src/*.html']
};


var watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: ['static/script/src/main.ts'],
    cache: {},
    packageCache: {}
}).plugin(tsify));

// gulp.task('copy-html', function () {
//     return gulp.src(paths.pages)
//         .pipe(gulp.dest('dist'));
// });

function bundle() {
    return watchedBrowserify
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))

        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))

        .pipe(gulp.dest('static/script/dist'));
}

gulp.task('default', gulp.series(bundle));
watchedBrowserify.on('update', bundle);
watchedBrowserify.on('log', fancy_log);