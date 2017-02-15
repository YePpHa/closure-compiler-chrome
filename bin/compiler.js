var Promise = require("bluebird");
var fs = require("fs");
var through = require("through");
var gutil = require("gulp-util");
var minimist = require("minimist");
var utils = require("./utils.js");
var path = require("path");
var a = require("async");

var plugins = {
  calcdeps: require("./compiler_plugins/calcdeps.js"),
  config: require("./compiler_plugins/config.js"),
  i18n: require("./compiler_plugins/i18n.js")
};

function Compiler(closure, config) {
  this.plugins = {
    "calcdeps": new plugins.calcdeps(this, config, closure),
    "config": new plugins.config(this, config.config || {}),
    "i18n": new plugins.i18n(this, config)
  };
}

Compiler.prototype.getFile = function(filename) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Handles the file
 * @param {?string} filename the filename.
 */
Compiler.prototype.handleFile = function(filename) {
  var files = [];

  return this.getFile(filename)
  .then(function(data) {
    // Convert data to a string.
    data = "" + data;

    return utils.replace(data, /\$\{([^}]+)\}/g, function(m, m1) {
      var cmd = m1.split(" ");

      if (!this.plugins[cmd[0]]) {
        throw new Error("The plugin " + cmd[0] + " is not defined.");
      }

      return Promise.resolve()
      .then(function() {
        return this.plugins[cmd[0]].run(cmd.splice(1))
      }.bind(this))
      .then(function(result) {
        if (result.files) {
          files = files.concat(result.files);
        }

        return result.content;
      });
    }.bind(this));
  }.bind(this))
  .then(function(data) {
    return new gutil.File({
      base: "/",
			contents: new Buffer(data),
			cwd: "/",
			path: "/" + utils.getFilename(filename)
    });
  })
  .then(function(file) {
    return {
      entries: files,
      file: file
    };
  }.bind(this));
};

Compiler.prototype.compile = function() {
  function appendFiles(file) {
    if (file.isNull()) return;
    if (file.isStream()) {
			return this.emit("error", new gutil.PluginError("DevCompiler", "Streaming not supported"));
		}

    files.push(file);
  }

  function build() {
    var promisedFiles = [];

    for (var i = 0; i < files.length; i++) {
      promisedFiles = promisedFiles.concat(self.handleFile(path.relative(files[i].cwd, files[i].path)));
    }

    Promise.all(promisedFiles)
    .then(function(dataFiles) {
      var flattenFiles = [];
      for (var i = 0; i < dataFiles.length; i++) {
        flattenFiles.push(dataFiles[i].file);
        flattenFiles = flattenFiles.concat(dataFiles[i].entries);
      }

      var uniqueList = [];
      for (var i = 0; i < flattenFiles.length; i++) {
        if (uniqueList.indexOf(flattenFiles[i].path) !== -1) continue;
        uniqueList.push(flattenFiles[i].path);

        this.emit("data", flattenFiles[i]);
      }
      self.files = null;
      this.emit("end");
    }.bind(this));
  }
  var self = this;
  var files = [];

  return through(appendFiles, build);
};

module.exports = Compiler;
