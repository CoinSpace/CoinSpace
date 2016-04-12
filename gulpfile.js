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
  'cordova platform add android',
  'cordova plugin add cordova-plugin-geolocation',
  'cordova plugin add cordova-plugin-whitelist',
  'cordova plugin add cordova-plugin-inappbrowser',
  'cordova plugin add cordova-plugin-splashscreen',
  'cordova plugin add https://github.com/skyjam/CS-barcodescanner.git',
  'cordova plugin add cordova-plugin-dialogs',
  'cordova plugin add cordova-plugin-x-socialsharing'
], {cwd: paths.build}));

/* Windows tasks */

gulp.task('platform-add-windows', ['platform-config-windows'], function() {
  var ssh = function (cmd) {
    cmd = cmd.replace(/\/\//g, '\\');
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
      '<%= ssh("y: && cd phonegap/build && cordova plugin add cordova-plugin-dialogs")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add org.apache.cordova.inappbrowser")%>',
      '<%= ssh("y: && cd phonegap/build && cordova plugin add com.msopentech.websql@0.0.7")%>',
      '<%= bom("phonegap/build/platforms/windows/www/**/*.js")%>',
      '<%= ssh("y: && cd phonegap && copy images//windows//icons//* build//platforms//windows//images")%>',
      '<%= ssh("y: && cd phonegap && copy images//windows//screens//* build//platforms//windows//images")%>',
      '<%= ssh("if exist c://coinspace rmdir c://coinspace /s /q")%>',
      '<%= ssh("xcopy y://phonegap//build//platforms//windows//* c://coinspace /s /e /i")%>',
      '<%= ssh("c://coinspace//CordovaApp.sln")%>',
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

gulp.task('platform-add-ios', ['platform-config-ios'], shell.task([
    'cordova platform add ios',
    'cordova plugin add cordova-plugin-geolocation',
    'cordova plugin add cordova-plugin-whitelist',
    'cordova plugin add cordova-plugin-splashscreen',
    'cordova plugin add https://github.com/skyjam/CS-barcodescanner.git',
    'cordova plugin add cordova-plugin-dialogs',
    'cordova plugin add cordova-plugin-inappbrowser',
    'cordova plugin add cordova-plugin-apple-watch',
    'cordova plugin add cordova-plugin-statusbar',
    'cordova plugin add cordova-plugin-x-socialsharing',
    'cordova plugin add cordova-plugin-touch-id',
    'cordova plugin add cordova-plugin-console'
], {cwd: paths.build}));

gulp.task('platform-config-ios', ['copy-config', 'copy-build'], function() {
    return gulp.src(paths.build + '/www/index.html')
        .pipe(replace('<!-- CONFIG-PLATFORM -->', '<script>window.buildPlatform = "ios";</script>'))
        .pipe(gulp.dest(paths.build + '/www'));
});

gulp.task('build-ios', ['platform-add-ios'], function() {
    return gulp.src('')
        .pipe(gulpif(isRelease,
            shell('cordova build ios --release', {cwd: paths.build}),
            shell('cordova build ios', {cwd: paths.build})));
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
      'https://api.bitcoinaverage.com', 'https://chain.so',
      'https://btc.blockr.io', 'https://tbtc.blockr.io', 'https://ltc.blockr.io', 'insight.bitpay.com', 'live.coin.space',
      'https://' + env.DB_HOST, env.PROXY_URL.split('?')[0], env.PHONEGAP_URL
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

gulp.task('build-js', shell.task('npm run build', {env: env}))

gulp.task('clean', function(cb) {
  del(paths.build, cb)
});
