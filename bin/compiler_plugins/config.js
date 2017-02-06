var minimist = require("minimist");
var Entities = require("html-entities").AllHtmlEntities;
var calcdeps = require("../calcdeps.js");
var utils = require("../utils.js");

function Config(compiler, config) {
  this.compiler = compiler;
  this.config = config;
}

Config.getValue = function(obj, name) {
  var tokens = name.split(".");
  var value = obj;
  for (var i in tokens) {
    if (value.hasOwnProperty(tokens[i])) {
      value = value[tokens[i]];
    } else {
      throw new Error(name + " was not found in the config file.");
    }
  }

  return value;
};

Config.prototype.parseArguments = function(argv) {
  return minimist(argv, {
    alias: {
      "type": "t"
    },
    default: {
      "type": "json"
    }
  });
};

Config.prototype.run = function(argv) {
  argv = this.parseArguments(argv);
  if (!argv._.length === 0) throw new Error("Namespace was not specified.");
  var name = argv._[0];
  var value = Config.getValue(this.config, name);

  var content = null;
  if (argv.type === "json") {
    content = JSON.stringify(value);
  } else if (argv.type === "html") {
    var entities = new Entities();
    content = entities.encode(value);
  } else {
    throw new Error("Unknown argument type " + argv.type + ".");
  }

  return {
    content: content
  };
};

module.exports = Config;
