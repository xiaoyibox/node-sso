var argv = require("yargs").argv,
    stripDebug = require('gulp-strip-debug'),//删除代码中的console.log
    gulp = require('gulp'),//gulp插件
    uglify = require('gulp-uglify'),//混淆js
    clean = require('gulp-clean'),//清理文件
    less = require('gulp-less'),//转换less用的
    autoprefixer = require('gulp-autoprefixer'),//增加私有变量前缀
    minifycss = require('gulp-minify-css'),//压缩
    concat = require('gulp-concat'),//合并
    template = require('gulp-template'),//替换变量以及动态html用
    rename = require('gulp-rename'),//重命名
    imagemin = require('gulp-imagemin'),//图片压缩
    rev  = require('gulp-rev'),//加MD5后缀
    jshint = require('gulp-jshint'),//js校验
    jade = require('gulp-jade'),
    nodemon = require('gulp-nodemon'),
    $ = require('gulp-load-plugins')(),
    spriter = require('gulp-css-spriter'),
    map = require("map-stream"),
    co = require('co'),
    debug = require('debug')('node-sso:gulpfile'),
    jsdoc = require('gulp-jsdoc3'),
    gulpSequence = require('gulp-sequence').use(gulp);



gulp.task('doc', function (cb) {
    gulp.src(['doc.md', './src/**/*.js'], {read: false})
        .pipe(jsdoc(cb));
});

/* custome Reporter by jshint */
var customerReporter = map(function(file,cb){
    if(!file.jshint.success){
        //打印出错误信息
        console.log("jshint fail in:" + file.path);
        file.jshint.results.forEach(function(err){
            if(err){
                console.log(err);
                console.log("在 "+file.path+" 文件的第"+err.error.line+" 行的第"+err.error.character+" 列发生错误");
            }
        });
    }
});


/* clear all auto files,include every env */
gulp.task('cleanAll',function(){
    gulp.src(['dist/*'],{read:false})
        .pipe(clean());
});
gulp.task('cleanPublicJS',function(){
    gulp.src(['./public/js/*'],{read:false})
        .pipe(clean());
});


/* jshint */
gulp.task('jshint', function(){
    return gulp.src(['./src/**/*.js','./bin/**/*.js','./public/javascripts/**/*.js'
        , './routes/**/*.js','./app.js'
    ])
        .pipe($.jshint())
        //.pipe($.jshint.reporter('jshint-stylish'))
        //.pipe($.jshint.reporter('fail'));
        .pipe(customerReporter);
});
gulp.task('copy',function () {
    return gulp.src([
        './views/**/*',
        './package.json',
        './pm2Conf.json',
        './public/libs/**/*'
    ], {base: './'})
        .pipe(gulp.dest('./dist'))
});

/* css by less : merge & compress */
gulp.task('css-min',function () {
    gulp.src("./public/stylesheets/**/*.less")
        .pipe(less())
        .pipe(concat('nodesso.css'))
        .pipe(gulp.dest('./public/css'))
        .pipe(rename({suffix:'.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('./public/css'));
});

/* js merge and compress */
/* bin/www、pubilc、routes、src、app.js、 */
gulp.task('js-min-bin',function(){
    gulp.src("./bin/www")
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
            compress: true,//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe(gulp.dest("./dist/bin/"));
});
gulp.task('js-min-public',function(){
    gulp.src("./public/javascripts/**/*.js")
        .pipe(concat('nodesso.main.js'))
        .pipe(gulp.dest('./public/js'))
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
            compress: true,//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest("./dist/public/js"));
});
gulp.task('js-min-routes',function(){
    gulp.src("./routes/**/*.js")
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
            compress: true,//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe(gulp.dest("./dist/routes/"));
});
gulp.task('js-min-src',function(){
    gulp.src("./src/**/*.js")
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
            compress: true,//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe(gulp.dest("./dist/src/"));
});

gulp.task('js-min-app',function(){
    gulp.src("./app.js")
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
            compress: true,//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe(gulp.dest("./dist/"));
});


//获取参数
function getArgs(){
    console.log(JSON.stringify(argv));
    return {
        env : argv.p || !argv.d,
    mod : argv.m || 'all',
    modh : argv.h || 'all'
    }
}

gulp.task('args',function(){
    var envData = getArgs();
    console.log(JSON.stringify(envData));
});

gulp.task('build',
    gulpSequence('cleanAll','copy','js-min-public',['css-min','js-min-bin','js-min-routes','js-min-src','js-min-app'],'cleanPublicJS'));




