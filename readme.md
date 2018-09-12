An attempt to minimize .cshtml files with gulp.
 

# Usage
```
var minifyCshtml = require('gulp-cshtml-minify'),
    gulp = require('gulp');

gulp.src("test.cshtml")
    .pipe(minify())
    .pipe(gulp.dest("result"));
```
---

# Features

##### Handles 'pre' blocks

##### Minifies inline 'script' blocks with uglify-js

##### Minifies inline 'style' blocks with clean-css