var gulp = require("gulp");
var gclean = require('gulp-clean');
var ClosureCompiler = require('./bin/compiler.js');

var config = {
  "config": {
    "title": "Test example",
    "what": "test"
  },
  "defines": {
    "test": {
      "test.MY_TEST_SENTENCE": "This is the end of the file."
    }
  },
  "compiler": {
    "closure": {
      "baseFile": null
    },
    "calcdeps": {
      "baseFile": null
    },
    "dependencies": [
      [
        "./test/js/**/*.js",
        "!./test/js/**/*_test.js"
      ]
    ]
  }
};

gulp.task("clean", function() {
  return gulp.src(["./dist"])
    .pipe(gclean());
});

gulp.task("test", ["clean"], function() {
  return gulp.start(["test:closure", "test:calcdeps"]);
});

gulp.task("test:closure", function() {
  var cc = new ClosureCompiler("closure", config);

  return gulp.src(["test/test.html"])
    .pipe(cc.compile())
    .pipe(gulp.dest("./dist/closure"));
});

gulp.task("test:calcdeps", function() {
  var cc = new ClosureCompiler("calcdeps", config);

  return gulp.src(["test/test.html"])
    .pipe(cc.compile())
    .pipe(gulp.dest("./dist/calcdeps"));
});
