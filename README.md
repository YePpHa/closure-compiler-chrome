# Closure Compiler Gulp
[![Greenkeeper badge](https://badges.greenkeeper.io/YePpHa/closure-compiler-gulp.svg)](https://greenkeeper.io/)

Gulp addon for using Closure Compiler to i.e. create Chrome extensions.

## How does it work
Instead of inputting a namespace like in Google Closure Compiler a file is
needed instead. This file can take usage of the `${CMD}` tokens where it's
replaced by the output of the `CMD`. The `CMD` is using
[minimist](https://github.com/substack/minimist) to get the executable and the
arguments for the command.

Available executable commands:
* config - Example: `${config <PROPERTY IN CONFIG>}`
* calcdeps - Example: `${calcdeps -t json <NAMESPACE>}`
* i18n - Example: `${i18n -t json -b}`

## Commands
### config
**Name**
`config - Outputs the value of the given property.`

**Synopsis**
`config [property]`

**Description**
Outputs the value of the given property.

The property is from the `config` property in the `Object` when initializing a
new instance of `new ClosureCompiler("closure", Object)`. It uses dot notation
to traverse the object.

### calcdeps
**Name**
`calcdeps - Calculates the dependency of namespace and outputs the result.`

**Synopsis**
`calcdeps [-t|-c|-d] [namespace]`

**Description**
Calculates the dependency of namespace and outputs the result.

There are two modes it can calculate dependencies. It can either use Google
Closure Compiler or a simple
[calcdeps list](https://github.com/google/closure-library/blob/master/closure/bin/calcdeps.py).

In production it's recommended to use Google Closure Compiler. However, while
developing is ongoing it will be faster to use calcdeps to test changes.

The [defines](https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler#define-type-description)
can be set to an Object with key, value pairs where the key is name of the
define and the value is the value of the define. It uses dot notation to
traverse the `Object`.

Types
* `content`       A string with the content of all the files separated by `;`.
* `html`          The file list is converted into HTML script tags where `src`
                  refers to the file relative to the dist directory. It also
                  includes the attribute `type` with the value
                  `text/javascript`.
* `json`          An encoded JSON array with the files relative to the dist
                  directory or what `gulp.dest()` refers to.
* `json-content`  An encoded JSON array with the files' content.
* `json-string`   The first entry from `json`. It will output as a JSON encoded
                  string.

Options
* -t, --type      the type of the output.
* -c, --compiler  the compiler to use. Either `closure` or `calcdeps`.
* -d, --defines   The defines to include from `Object`.

### i18n
**Name**
`i18n - Merges the i18n language directories into a single object.`

**Synopsis**
`i18n [-t|-b]`

**Description**
Merges the i18n language directories into a single object.

It can only output as an encoded JSON object.

Options
* -t, --type      the type of the output (only json is available).
* -b, --base      whether to only include language base configurations or the
                  i18n object. The `base` only includes the `__base.json` file
                  and without the `base` the `__base.json` is excluded.

# Examples
## Gulp
```javascript
var gulp = require('gulp');
var ClosureCompiler = require('closure-compiler-gulp');

gulp.task('compile-js', function() {
  var cc = new ClosureCompiler("closure", require("./config.production.json"));

  return gulp.src(["src/manifest.json"])
    .pipe(cc.compile())
    .pipe(gulp.dest("./dist"));
});
```

## manifest.json
```json
{
  "manifest_version": 2,
  "name": ${config name},
  "description": ${config description},
  "version": ${config version},
  "default_locale": "en",
  "background": {
    "scripts": ${calcdeps --defines defines.general --type json my.awesome.app},
    "persistent": true
  },
  "permissions": [
    "*://www.some-website.com/"
  ]
}
```

## config.production.json
```json
{
  "config": {
    "name": "My awesome app",
    "description": "La la la.",
    "version": "2.1.0",
    "defines": {
      "general": {
        "awesome.enable": true,
        "thirdparty.config.lalala": false
      }
    }
  },
  "compiler": {
    "closure": {
      "baseFile": "./node_modules/google-closure-library/third_party/closure/goog/base.js"
    },
    "calcdeps": {
      "baseFile": null
    },
    "dependencies": [
      [
        "./node_modules/google-closure-library/closure/goog/**/*.js",
        "!./node_modules/google-closure-library/closure/goog/**/*_test.js"
      ], [
        "./node_modules/google-closure-library/third_party/closure/goog/**/*.js",
        "!./node_modules/google-closure-library/third_party/closure/goog/**/*_test.js"
      ], [
        "./src/js/**/*.js",
        "!./src/js/**/*_test.js"
      ]
    ]
  }
}
```
