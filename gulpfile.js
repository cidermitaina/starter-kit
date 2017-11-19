"use strict";

//require
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync");
const notify = require('gulp-notify');
const watch = require('gulp-watch');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const fs = require('fs');
const data = require('gulp-data');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const frontnote = require("gulp-frontnote");


//path
const SRC = './src';
const HTDOCS = './public';
const BASE_PATH = '/';
const DEST = `${HTDOCS}${BASE_PATH}`;


// css
gulp.task("sass", () => {
    return gulp.src(`${SRC}/scss/**/*.scss`)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sass())
        .pipe(autoprefixer({browsers: ['last 6 versions']}))
        .pipe(gulp.dest(`${DEST}assets/css/`))
});

gulp.task('css', gulp.series('sass'));


//styleguide
gulp.task("styleguide", () => {
    return gulp.src(`${SRC}/scss/**/*.scss`)
        .pipe(frontnote({
            out: DEST + './guide',
            css: [BASE_PATH + "assets/css/index.css", ,"https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css","https://fonts.googleapis.com/earlyaccess/notosansjapanese.css",BASE_PATH +"assets/css/bootstrap.min.css"]
    }))
});


//js
gulp.task('browserify', function () {
  return browserify('./src/js/main.js')
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .on('error', function(err){
        console.log(err.message);
        console.log(err.stack);
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(`${DEST}assets/js/`));
});

gulp.task('js', gulp.parallel('browserify'));


//html
gulp.task("ejs", () => {
    return gulp.src(
        ["src/ejs/**/*.ejs",'!' + "src/ejs/**/_*.ejs"]
    )
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(data(function(file) {
            const jsondata = require(`./src/ejs/${BASE_PATH}/json/config.json`);
            const pages = require(`./src/ejs/${BASE_PATH}/json/pages.json`);

            if (file.path.length !== 0) {
                let path = file.path.split('¥').join('/');
                path = path.split('\\').join('/');
                const filename =path.match(/^.+\/src\/ejs\/(.+)\.ejs$/)[1];
                var meta = {};
                if (pages[filename]) {
                  meta = pages[filename];
                } else {
                  meta = pages.default;
                }
            }
            return {
              metadata: meta,
              jsondata: jsondata
            };
        }))
        .pipe(ejs())
        .pipe(rename({extname: '.html'}))
        .pipe(gulp.dest(`${HTDOCS}`))
});

gulp.task('html', gulp.series('ejs'));


// server
gulp.task('browser-sync', () => {
    browserSync({
        server: {
            proxy: "localhost:3000",
            baseDir: HTDOCS
        },
        startPath: `${BASE_PATH}`,
        ghostMode: false
    });
    watch([`${SRC}/scss/**/*.scss`], gulp.series('sass', browserSync.reload));
    watch([`${SRC}/js/**/*.js`], gulp.series('browserify', browserSync.reload));
    watch([
        `${SRC}/ejs/**/*.ejs`,
    ], gulp.series('ejs', browserSync.reload));

});

gulp.task('server', gulp.series('browser-sync'));

// default
gulp.task('build', gulp.parallel('css', 'js', 'html'));
gulp.task('default', gulp.series('build', 'server'));
