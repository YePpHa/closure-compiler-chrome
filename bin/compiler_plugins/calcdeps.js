var minimist = require("minimist");
var Entities = require("html-entities").AllHtmlEntities;
var ClosureCompiler = require("google-closure-compiler").compiler;
var shortid = require("shortid");
var temp = require("temp-write");
var gutil = require("gulp-util");
var chalk = require("chalk");
var fs = require("fs");
var path = require("path");

var utils = require("../utils.js");
var calcdeps = require("../calcdeps.js");
var ConfigPlug = require("./config.js");

var DEFINE_REGEX = /^([\s]*)goog\.define\([\s]*['"](.+?)['"][\s]*,[\s]*(.+?)[\s]*\)/gm;

function CalcDeps(compiler, config, compilerType) {
  this.compiler = compiler;
  this.config = config;

  this.depsFiles = this.config.compiler.dependencies;

  this.namespaces = {};
  this.processedNamespaces = {};
  this.deps = {};

  this.compilerType = compilerType || "calcdeps";
}

CalcDeps.prototype.isAlreadyProcessed = function(namespace, compiler, defines) {
  return this.processedNamespaces[namespace]
      && this.processedNamespaces[namespace][compiler]
      && this.processedNamespaces[namespace][compiler][defines];
};

CalcDeps.prototype.setDefines = function(contents, defines) {
  contents = "" + contents;

  contents = contents.replace(DEFINE_REGEX, function(m0, prefix, name, value) {
    if (defines.hasOwnProperty(name)) {
      return prefix + "goog.define(" + JSON.stringify(name) + ", " + JSON.stringify(defines[name]) + ")";
    }
    return m0;
  });

  return new Buffer(contents);
};

/**
 * Returns the dependencies for the namespace.
 * @param {?string} namespace the namespace.
 * @return {Array<string>} the dependencies.
 */
CalcDeps.prototype.getDependencies = function(namespace, compilerType) {
  if (!this.deps[namespace])
    this.deps[namespace] = {};
  if (!this.deps[namespace][compilerType]) {
    var baseFile = this.config.compiler[compilerType].baseFile;
    if (!baseFile) {
      baseFile = path.join(__dirname, "closure-primitives", "base.js");
    }

    this.deps[namespace][compilerType] = calcdeps({
      "path": this.depsFiles,
      "mode": "list"
    }, [baseFile, "ns:" + namespace]);
  }

  return this.deps[namespace][compilerType];
};

CalcDeps.prototype.parseArguments = function(argv) {
  return minimist(argv, {
    alias: {
      "type": "t",
      "compiler": "c",
      "defines": "d"
    },
    default: {
      "type": "json",
      "compiler": this.compilerType
    }
  });
};

CalcDeps.prototype.getRelativeDependencies = function(namespace, compilerType) {
  var deps = this.getDependencies(namespace, compilerType).slice(0);
  for (var i = 0; i < deps.length; i++) {
    deps[i] = utils.getFilename(deps[i]);
  }
  return deps;
};

CalcDeps.prototype.run = function(argv) {
  argv = this.parseArguments(argv);
  if (!argv._.length === 0) throw new Error("Namespace was not specified.");
  var namespace = argv._[0];
  var closure = argv.compiler === "closure";

  if (!this.namespaces[namespace]) {
    this.namespaces[namespace] = shortid.generate();
  }
  var processed = this.isAlreadyProcessed(namespace, argv.compiler, argv.defines);
  if (!this.processedNamespaces[namespace])
    this.processedNamespaces[namespace] = {};
  if (!this.processedNamespaces[namespace][argv.compiler])
    this.processedNamespaces[namespace][argv.compiler] = {};
  this.processedNamespaces[namespace][argv.compiler][argv.defines] = true;

  // The dependencies from calcdeps (goog.require('namespace')).
  var fileDependencies = [];

  // The entries from compiler (${calcdeps --type json namespace})
  var fileEntries = [];

  var defines = null;
  if (!closure && argv.defines) {
    defines = ConfigPlug.getValue(this.config, argv.defines);
  }

  return Promise.resolve()
  .then(function() {
    if (processed) {
      // It has already been processed, we only need the file names.
      if (closure) {
        return ["/js/" + this.namespaces[namespace] + ".js"];
      } else {
        return this.getRelativeDependencies(namespace, argv.compiler);
      }
    } else {
      gutil.log("calcdeps", "Compiling " + namespace + " using " + (argv.compiler ? argv.compiler : "calcdeps") + ".");
      var deps = this.getDependencies(namespace, argv.compiler);
      var p = [];
      for (var i = 0; i < deps.length; i++) {
        p.push(this.compiler.handleFile(deps[i]));
      }
      return Promise.all(p)
      .then(function(p) {
        var entries = [];
        var deps = [];
        for (var i = 0; i < p.length; i++) {
          entries = entries.concat(p[i].entries);
          if (p[i].file) {
            deps.push(p[i].file);
          }
        }

        if (defines) {
          for (var i = 0; i < entries.length; i++) {
            entries[i].contents = this.setDefines(entries[i].contents, defines);
          }

          for (var i = 0; i < deps.length; i++) {
            deps[i].contents = this.setDefines(deps[i].contents, defines);
          }
        }

        if (closure) {
          var tmpfile = temp.sync("");
          var closureConfig = {
            js: deps.map(function(file) {
      				return temp.sync(file.contents, file.path);
      			}),
            compilation_level: 'ADVANCED',
            output_wrapper: '(function(){%output%})();',
            dependency_mode: 'STRICT',
            entry_point: "goog:" + namespace,
            js_output_file: tmpfile
          };
          if (defines) {
            closureConfig.define = ConfigPlug.getValue(this.config, argv.defines);
          }

          var cc = new ClosureCompiler(closureConfig);
          var compilerProcess = cc.run();
          var stdOutData = '', stdErrData = '';

          compilerProcess.stdout.on('data', function (data) {
            stdOutData += data;
          });
          compilerProcess.stderr.on('data', function (data) {
            stdErrData += data;
          });

          return Promise.all([
            new Promise(function(resolve, reject) {
              compilerProcess.on('close', function(code) {
                resolve(code);
              })
            }),
            new Promise(function(resolve, reject) {
              compilerProcess.stdout.on('end', function() {
                resolve();
              })
            }),
            new Promise(function(resolve, reject) {
              compilerProcess.stderr.on('end', function() {
                resolve();
              })
            })
          ])
          .then(function(results) {
            var code = results[0];

            if (stdErrData.trim().length > 0) {
              console.warn(chalk.yellow("calcdeps") + ": " + stdErrData);
            }

            if (code !== 0) {
              throw new Error("Compilation error");
            }

            return {
              deps: [new gutil.File({
                cwd: "/",
                base: "/",
                path: "/js/" + this.namespaces[namespace] + ".js",
                contents: fs.readFileSync(tmpfile)
              })],
              entries: entries
            };
          }.bind(this));
        }

        return {
          deps: deps,
          entries: entries
        };
      }.bind(this))
      .then(function(files) {
        fileDependencies = files.deps;
        fileEntries = files.entries;

        if (closure) {
          return ["/js/" + this.namespaces[namespace] + ".js"];
        } else {
          return this.getRelativeDependencies(namespace, argv.compiler);
        }
      }.bind(this))
    }
  }.bind(this))
  .then(function(deps) {
    var content = null;
    if (argv.type === "json") {
      return JSON.stringify(deps);
    } else if (argv.type === "json-string") {
      return JSON.stringify(deps[0]);
    } else if (argv.type === "html") {
      var html = [];
      var entities = new Entities();
      for (var i = 0; i < deps.length; i++) {
        html.push("<script type=\"text/javascript\" src=\"" + (deps[i].substring(0, 1) === "/" ? "" : "/") + entities.encode(deps[i]) + "\"></script>");
      }

      return html.join("\n");
    } else if (argv.type === "content") {
      var files = fileDependencies.concat(fileEntries);
      var contents = deps.map(function(dep) {
        for (var i = 0; i < files.length; i++) {
          if (files[i].path === dep) {
            return files[i].contents;
          }
        }
        return "";
      });

      return contents.join(";");
    } else if (argv.type === "json-content") {
      var files = fileDependencies.concat(fileEntries);
      var contents = deps.map(function(dep) {
        for (var i = 0; i < files.length; i++) {
          if (files[i].path === dep) {
            return files[i].contents;
          }
        }
        return "";
      });

      return JSON.stringify(contents);
    } else {
      throw new Error("Unknown argument type " + argv.type + ".");
    }
  }.bind(this))
  .then(function(content) {
    return {
      content: content,
      files: argv.type === "content" ? fileEntries : fileDependencies.concat(fileEntries)
    };
  });
};

module.exports = CalcDeps;
