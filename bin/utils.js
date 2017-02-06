var Promise = require("bluebird");
var path = require("path");

exports.replace = function(str, regex, fn) {
  var promises = [];
  var replacer = [];

  var m;
  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    promises.push(
      Promise.resolve()
      .then(function(m) {
        return fn.apply(null, m);
      }.bind(null, m))
      .then(function(m, replace) {
        replacer[m.index] = [m, replace];
      }.bind(null, m))
    );
  }

  return Promise.all(promises)
  .then(function() {
    var offset = 0;

    for (var i in replacer) {
      if (replacer.hasOwnProperty(i)) {
        str = str.substring(0, replacer[i][0].index + offset)
            + replacer[i][1]
            + str.substring(replacer[i][0].index + offset + replacer[i][0][0].length);
        offset += replacer[i][1].length - replacer[i][0][0].length;
      }
    }

    return str;
  });
};

/**
 * Returns the file's filename when it has been copied.
 * @param {?string} file the filename.
 * @return {?string} the file's filename when it has been copied.
 */
exports.getFilename = function(filename) {
  if (path.relative("src", filename).indexOf("..") !== 0) {
    filename = path.relative("src", filename);
  } else if (path.relative("bower_components", filename).indexOf("..") !== 0) {
    filename = "vendor/" + path.relative("bower_components", filename);
  }

  filename = filename.replace(/\\/g, "/");

  return filename;
};

exports.flatten = function(arr) {
  var flattenArray = [];
  for (var i = 0; i < arr.length; i++) {
    flattenArray = flattenArray.concat(arr[i]);
  }
  return flattenArray;
};
