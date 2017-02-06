# Closure Compiler Gulp
Gulp addon for using Closure Compiler to create Chrome extensions.

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
