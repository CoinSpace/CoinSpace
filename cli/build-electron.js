#!/usr/bin/env node

var program = require("commander");
var fse = require("fs-extra");
var path = require("path");
var utils = require("./utils");
var warning = require("chalk").yellow;
var webpack = require("webpack");
var electronBuildPath = "electron/build";

program
  .name("build-electron.js")
  .option("-e, --env <env>", "environment", "dev")
  .option("--release", "release mode")
  .option("--run", "debug mode")
  .parse(process.argv);

var envFile = `.env.${program.env}`;
console.log(`ENV_FILE: ${warning(envFile)}`);

console.log("Start building (webpack)...");

process.env["ENV_FILE"] = envFile;
process.env["ENV"] = program.env;
process.env["BUILD_TYPE"] = "electron";
var webpackConfig = require("../webpack.prod");

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    "process.env.BUILD_TYPE": JSON.stringify("electron")
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({ colors: true }));

  fse.removeSync(electronBuildPath);
  fse.copySync("build", path.resolve(electronBuildPath));
  // copy assets for electron appx installer
  fse.copySync("electron/images/win", path.resolve(`${electronBuildPath}/appx/images`));

  if (program.release) {
    // build electron to electron/dist
    console.log("Start building (electron)...");
    utils.shell(
      "npm run electron-builder"
    );
    console.log("Electron build Done!");
  } else if (program.run) {
    // run electron app
    console.log("Debug Electron app building (electron)...");
    utils.shell("npm run electron");
    console.log("Stop electron run!");
  } else {
    console.log("Webpack build Done!");
  }
});
