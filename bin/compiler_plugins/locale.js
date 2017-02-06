var fs = require("fs");
var path = require("path");
var glob = require("glob");
var minimist = require("minimist");

function getFolders(dir) {
  return fs.readdirSync(dir)
  .filter(function(file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

function getLocales(loc) {
  var locales = {};
  var folders = getFolders(loc);

  folders.forEach(function(folder) {
    var locale = path.basename(folder);

    var filename = path.join(loc, locale, '__base.json');

    try {
      var stat = fs.statSync(filename);
      if (!stat.isFile()) {
        console.warn("__base.json is not a file for " + locale + ".");
        return;
      }
    } catch (e) {
      console.warn("Missing __base.json file for " + locale + ".");
      return;
    }
    locales[locale] = JSON.parse(fs.readFileSync(path.join(loc, locale, '__base.json')));
  });

  return locales;
}

function getLocaleObject(loc) {
  var detail = {};
  var folders = getFolders(loc);

  var regionLocales = {};

  folders.forEach(function(folder) {
    var locale = path.basename(folder);

    var subTag = locale.match(/^\w{2,3}([-_]|$)/g);
    var regionSubTag = locale.match(/[-_]([a-zA-Z]{2}|\d{3})([-_]|$)/);

    subTag = subTag ? subTag[0].replace(/[_-]/g, '') : '';
    regionSubTag = regionSubTag ? regionSubTag[0].replace(/[_-]/g, '') : '';

    var data = {};
    var files = glob.sync(path.join(loc, locale, '**/*.json'));

    files.forEach(function(file) {
      if (path.basename(file) === "__base.json") return;
      var content = JSON.parse(fs.readFileSync(file).toString("utf-8"));
      for (var key in content) {
        data[key] = content[key];
      }
    });

    if (regionSubTag) {
      regionLocales[locale] = data;
    } else {
      detail[locale] = data;
    }
  });

  for (var locale in regionLocales) {
    var subTag = locale.match(/^\w{2,3}([-_]|$)/g);
    subTag = subTag ? subTag[0].replace(/[_-]/g, '') : '';

    var data = {};
    if (detail[subTag]) {
      data = JSON.parse(JSON.stringify(detail[subTag]));
    }

    for (var key in regionLocales[locale]) {
      data[key] = regionLocales[locale][key];
    }
    detail[locale] = data;
  }

  return detail;
}

function Locale() {

}

Locale.prototype.parseArguments = function(argv) {
  return minimist(argv, {
    alias: {
      "type": "t"
    },
    default: {
      "type": "json",
      "options": false
    }
  });
};

Locale.prototype.run = function(argv) {
  argv = this.parseArguments(argv);
  var value = null;
  if (argv.options) {
    value = getLocales("./src/i18n", true);
  } else {
    value = getLocaleObject("./src/i18n");
  }

  var content = null;
  if (argv.type === "json") {
    content = JSON.stringify(value);
  } else {
    throw new Error("Unknown argument type " + argv.type + ".");
  }

  return {
    content: content
  };
};


module.exports = Locale;
