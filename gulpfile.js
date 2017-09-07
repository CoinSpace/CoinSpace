var gulp = require('gulp');
var shell = require('gulp-shell');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var del = require('del');
var _ = require('lodash');
var merge = require('merge-stream');
var minimist = require('minimist');
var gulpif = require('gulp-if');
require('dotenv').config({path: '.env.prod'});

var paths = {
  build: 'phonegap/build'
};

var isRelease = minimist(process.argv.slice(2)).release;

/* Android tasks */

gulp.task('build-android', ['platform-add-android'], function() {
  return gulp.src('')
    .pipe(gulpif(isRelease,
      shell('cordova build android --release', {cwd: paths.build}),
      shell('cordova build android', {cwd: paths.build})))
    .pipe(gulpif(isRelease, shell([
      'jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../release.keystore '+
      '-storepass coinspace platforms/android/build/outputs/apk/*-release-unsigned.apk coinspace',
      'zipalign -f -v 4 platforms/android/build/outputs/apk/*-release-unsigned.apk ../deploy/coinspace-release.apk'
    ], {cwd: paths.build})));
});

gulp.task('run-android', shell.task('cordova run android', {cwd: paths.build}));

gulp.task('platform-add-android', ['copy-config', 'copy-build'], shell.task([
  'cordova platform add android@6.1.0',
  'cordova plugin add cordova-plugin-geolocation@2.4.3',
  'cordova plugin add cordova-plugin-whitelist@1.3.2',
  'cordova plugin add cordova-plugin-inappbrowser@1.7.1',
  'cordova plugin add cordova-plugin-splashscreen@4.0.3',
  'cordova plugin add phonegap-plugin-barcodescanner@6.0.8',
  'cordova plugin add cordova-plugin-dialogs@1.3.3',
  'cordova plugin add cordova-plugin-x-socialsharing@5.2.0',
  'cordova plugin add cordova-facebook-audnet-sdk@4.23.0',
  'cordova plugin add cordova-plugin-facebookads@4.23.2'
], {cwd: paths.build}));

/* Windows tasks */

gulp.task('platform-add-windows', ['platform-config-windows'], function() {
  var ssh = function (cmd) {
    cmd = cmd.replace(/\/\/\//g, '\\');
    var fullCmdLine = 'ssh win8 \'' + 'c:\\pstools\\PsExec.exe -i cmd /c "' + cmd + '"\'';
    console.log('executing ssh: ' + fullCmdLine);
    return fullCmdLine
  };

  var bom = function (files) {
    console.log('adding bom: ' + files)
    return 'node tasks/bom-add.js "' + files + '"';
  };

  return gulp.src('')
    .pipe(shell([
      '<%= ssh("y: && cd phonegap/build && cordova platform add windows")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-geolocation")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-whitelist")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-splashscreen")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add phonegap-plugin-barcodescanner")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-dialogs")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-inappbrowser")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-x-socialsharing")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-websql")%>',
      '<%= bom("phonegap/build/platforms/windows/www/**/*.js")%>',
      '<%= bom("phonegap/build/platforms/windows/www/index.html")%>',
      '<%= bom("phonegap/build/platforms/windows/www/assets/css/*.css")%>',
      '<%= bom("phonegap/build/platforms/windows/www/css/*.css")%>',
      '<%= ssh("y: && cd phonegap && copy images///windows///icons///* build///platforms///windows///images")%>',
      '<%= ssh("y: && cd phonegap && copy images///windows///screens///* build///platforms///windows///images")%>',
      '<%= ssh("if exist c:///coinspace rmdir c:///coinspace /s /q")%>',
      '<%= ssh("xcopy y:///phonegap///build///* c:///coinspace /s /e /i")%>',
      '<%= ssh("c:///coinspace///platforms///windows///CordovaApp.sln")%>',
    ], {
      templateData: {ssh: ssh, bom: bom},
      quiet: true
    }));
});

gulp.task('platform-config-windows', ['copy-config', 'copy-build'], function() {
  return gulp.src(paths.build + '/www/index.html')
    .pipe(replace('<!-- CONFIG-PLATFORM -->', '<script>window.buildPlatform = "windows";</script>'))
    .pipe(gulp.dest(paths.build + '/www'));
});

/* iOS tasks */

gulp.task('build-ios', ['platform-add-ios'], function () {
  return gulp.src('')
    .pipe(gulpif(isRelease,
      shell('cordova build ios --buildConfig=../build.json --release', {cwd: paths.build}),
      shell('cordova build ios --buildConfig=../build.json', {cwd: paths.build})));
});

gulp.task('platform-add-ios', ['platform-config-ios'], shell.task([
  'cordova platform add ios@4.3.1',
  'cordova plugin add cordova-plugin-geolocation@2.4.3',
  'cordova plugin add cordova-plugin-whitelist@1.3.2',
  'cordova plugin add cordova-plugin-splashscreen@4.0.3',
  'cordova plugin add phonegap-plugin-barcodescanner@6.0.8',
  'cordova plugin add cordova-plugin-dialogs@1.3.3',
  'cordova plugin add cordova-plugin-inappbrowser@1.7.1',
  'cordova plugin add cordova-plugin-apple-watch@0.11.5',
  'cordova plugin add cordova-plugin-statusbar@2.2.3',
  'cordova plugin add cordova-plugin-x-socialsharing@5.2.0',
  'cordova plugin add cordova-plugin-touch-id@3.2.0',
  'cordova plugin add cordova-plugin-console@1.0.7',
  'cordova plugin add cordova-facebook-audnet-sdk@4.23.0',
  'cordova plugin add cordova-plugin-facebookads@4.23.2'
], {cwd: paths.build}));

gulp.task('platform-config-ios', ['copy-config', 'copy-build'], function () {
  var index =  gulp.src(paths.build + '/www/index.html')
    .pipe(replace('<!-- CONFIG-PLATFORM -->', '<script>window.buildPlatform = "ios";</script>'))
    .pipe(gulp.dest(paths.build + '/www'));

  var config =  gulp.src(paths.build + '/config.xml')
    .pipe(replace('id="com.coinspace.app"', 'id="com.coinspace.wallet"'))
    .pipe(gulp.dest(paths.build));

  return merge(index, config);
});

/* Common tasks */

gulp.task('copy-config', ['clean'], function() {
  return gulp.src('phonegap/config.xml.template')
    .pipe(rename('config.xml'))
    .pipe(gulp.dest(paths.build))
});

gulp.task('copy-build', ['clean', 'build-js'], function() {
  var csp = {
    'default-src': ["'self'", 'blob:', 'gap:'],
    'connect-src': [
      "'self'", 'blob:',
      'https://apiv2.bitcoinaverage.com',
      'https://btc.blockr.io', 'https://tbtc.blockr.io', 'https://ltc.blockr.io', 'https://insight.bitpay.com',
      'https://btc.coin.space', 'https://ltc.coin.space', 'https://eth.coin.space',
      'https://' + process.env.DB_HOST, 'https://proxy.coin.space', process.env.PHONEGAP_URL
    ],
    'font-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https://www.gravatar.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'script-src': ["'self'", 'blob:', "'unsafe-eval'", "'unsafe-inline'"]
  };

  var cspString = '';
  _.forIn(csp, function(value, key) {
    cspString += key + ' ' + value.join(' ') + ';';
  });

  var files = gulp.src(['build/**', '!build/index.html'])
    .pipe(gulp.dest(paths.build + '/www'))
  var deviceready = gulp.src(['phonegap/deviceready.js'])
    .pipe(gulp.dest(paths.build + '/www/assets/js'))
  var html = gulp.src('build/index.html')
    .pipe(replace('<!-- CORDOVA.JS -->', '<script src="cordova.js"></script>'))
    .pipe(replace('<!-- CONFIG -->', '<script>window.buildType = "phonegap";</script>'))
    .pipe(replace('<!-- CORDOVA-WHITELIST-CSP -->', '<meta http-equiv="Content-Security-Policy" content="' + cspString + '">'))
    .pipe(replace('<div id="logo_animation">', '<div id="logo_animation" style="display: none;">'))
    .pipe(replace('<script src="assets/js/loader.js"></script>','<script src="assets/js/deviceready.js"></script>'))
    .pipe(gulp.dest(paths.build + '/www'));
  return merge(files, deviceready, html);
});

gulp.task('build-js', shell.task('npm run build'))

gulp.task('clean', function(cb) {
  del(paths.build, cb)
});
