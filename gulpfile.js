var gulp = require('gulp');
var shell = require('gulp-shell');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var del = require('del');
var _ = require('lodash');
var merge = require('merge-stream');
var minimist = require('minimist');
var gulpif = require('gulp-if');
var env = require('./phonegap/env.json');

var paths = {
  build: 'phonegap/build'
};

var isRelease = minimist(process.argv.slice(2)).release;

gulp.task('build-android', ['copy-res'], function() {
  return gulp.src('')
    .pipe(gulpif(isRelease,
      shell('cordova build android --release', {cwd: paths.build}),
      shell('cordova build android', {cwd: paths.build})))
    .pipe(gulpif(isRelease, shell([
      'jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../release.keystore '+
      '-storepass coinspace platforms/android/ant-build/*-release-unsigned.apk coinspace',
      'zipalign -f -v 4 platforms/android/ant-build/*-release-unsigned.apk ../deploy/coinspace-release.apk'
    ], {cwd: paths.build})));
});
gulp.task('run-android', shell.task('cordova run android', {cwd: paths.build}));

gulp.task('copy-res', ['add-platform'], function() {
  var mapping = {
    'drawable-ldpi/icon.png': 'icons/36.png',
    'drawable-mdpi/icon.png': 'icons/48.png',
    'drawable-hdpi/icon.png': 'icons/72.png',
    'drawable-xhdpi/icon.png': 'icons/96.png',
    'drawable/icon.png': 'icons/96.png',
    'drawable-land-xhdpi/screen.png': 'screens/xhdpi-land.9.png',
    'drawable-port-xhdpi/screen.png': 'screens/xhdpi-port.9.png',
    'drawable-land-mdpi/screen.png': 'screens/mdpi-land.9.png',
    'drawable-port-mdpi/screen.png': 'screens/mdpi-port.9.png',
    'drawable-land-hdpi/screen.png': 'screens/hdpi-land.9.png',
    'drawable-port-hdpi/screen.png': 'screens/hdpi-port.9.png',
    'drawable-land-ldpi/screen.png': 'screens/ldpi-land.9.png',
    'drawable-port-ldpi/screen.png': 'screens/ldpi-port.9.png'
  };
  var tasks = _.map(mapping, function(src, dst) {
    return gulp.src('phonegap/images/android/' + src)
      .pipe(rename(dst))
      .pipe(gulp.dest(paths.build + '/platforms/android/res'))
  });
  return merge(tasks);
})

gulp.task('add-platform', ['copy-config', 'copy-build'], shell.task([
  'cordova platform add android',
  'cordova plugin add org.apache.cordova.geolocation',
  'cordova plugin add com.phonegap.plugins.barcodescanner'
], {cwd: paths.build}));

gulp.task('copy-config', ['clean'], function() {
  return gulp.src('phonegap/config.xml.template')
    .pipe(rename('config.xml'))
    .pipe(gulp.dest(paths.build))
})

gulp.task('copy-build', ['clean', 'build-js'], function() {
  var files = gulp.src(['build/**', '!build/index.html'])
    .pipe(gulp.dest(paths.build + '/www'))
  var deviceready = gulp.src(['phonegap/deviceready.js'])
    .pipe(gulp.dest(paths.build + '/www/assets/js'))
  var html = gulp.src('build/index.html')
    .pipe(replace('<!-- CORDOVA.JS -->', '<script src="cordova.js"></script>'))
    .pipe(replace('<!-- CONFIG -->', '<script>window.buildType = "phonegap";</script>'))
    .pipe(replace('<script src="assets/js/loader.js"></script>','<script src="assets/js/deviceready.js"></script>'))
    .pipe(gulp.dest(paths.build + '/www'));
  return merge(files, deviceready, html);
})

gulp.task('build-js', shell.task('npm run build', {env: env}))

gulp.task('clean', function(cb) {
  del(paths.build, cb)
});