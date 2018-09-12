'use strict';
var Transform = require('readable-stream').Transform;
var rs = require('replacestream');
var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');

module.exports = function(options) {
  return new Transform({
    objectMode: true,
    transform: function(file, enc, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      function doReplace() {
        if (file.isStream()) {
          file.contents = file.contents.pipe(rs());
          return callback(null, file);
        }

        if (file.isBuffer()) {
          var temp = String(file.contents);

          // CLEAN UP FILE AND MINIMIZE IT

          // Optimize all inline script blocks
          temp = temp.replace(/(<script.*?>)([\s\S]*?)(<\/script>)/gm, function(match, p1, p2, p3, offset, string){
            var minification = UglifyJS.minify(p2);

            // Will NOT minify <script> blocks if we
            // find any razor code inside of it
            if (!minification.error && p2.match(/(@\(|@{)/) === null){
              return p1 + minification.code + p3;
            } else {
              return p1 + p2 + p3;
            }
          });

          // Optimize all inline css blocks
          temp = temp.replace(/(<style.*?>)([\s\S]*?)(<\/style>)/gm, function(match, p1, p2, p3, offset, string){
            var minification = new CleanCSS().minify(p2);

            // Will NOT minify <style> blocks if we
            // find any razor code inside of it
            if (!minification.errors && p2.match(/(@\(|@{)/) === null){
              return p1 + minification.styles + p3;
            } else {
              return p1 + p2 + p3;
            }
          });

          // Keep the integrity of <pre> blocks
          var preBlockContents = [];

          temp = temp.replace(/(<pre.*?>)([\s\S]*?)(<\/pre>)/gm, function(match, p1, p2, p3, offset, string){

            var ret = "<d222222-" + preBlockContents.length + "></d222222>";
            preBlockContents.push({
              p1: p1,
              p2: p2,
              p3: p3  
            });

            return ret;
          });

          // Replace whitespace at beginning of lines
          temp = temp.replace(/^[\s\t]*/gm, '');

          // Replace end of lines
          temp = temp.replace(/^((?!@:|@model|@using).+)\r?\n/gm, '$1');
          
          // Re-insert <pre> blocks
          for (var i = 0; i < preBlockContents.length; i++){

            temp = temp.replace("<d222222-" + i + "></d222222>",
              "\r\n" + preBlockContents[i].p1 + preBlockContents[i].p2 + preBlockContents[i].p3 + "\r\n");
          }
          
          file.contents = new Buffer(temp);

          return callback(null, file);
        }

        callback(null, file);
      }

      doReplace();
    }
  });
};
