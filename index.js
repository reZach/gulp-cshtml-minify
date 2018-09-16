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
          var keepIntegrity = 'pre,textarea';

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

          // Keep the integrity of these blocks
          var integrityBlockContents = [];
          var tags = keepIntegrity.split(',');

          for (var i = 0; i < tags.length; i++){
            var reg = new RegExp("(<" + tags[i] + ".*?>)([\\s\\S]*?)(<\\/" + tags[i] + ">)", "gm");

            temp = temp.replace(reg, function(match, p1, p2, p3, offset, string){
              var contents = "<INTEGRITY-" + tags[i] + "-" + tags[i].length + "></INTEGRITY-" + tags[i] + "-" + tags[i].length + ">";
              integrityBlockContents.push({
                placeholder: contents,
                original: p1 + p2 + p3
              });

              return contents;
            });
          }

          // Replace whitespace at beginning of lines
          temp = temp.replace(/^[\s\t]*/gm, '');

          // Replace end of lines
          temp = temp.replace(/^((?!@:|@model|@using).+)\r?\n/gm, '$1');
          
          // Re-insert blocks that have integrity
          for (var i = 0; i < integrityBlockContents.length; i++){
            temp = temp.replace(integrityBlockContents[i].placeholder, "\r\n" + integrityBlockContents[i].original + "\r\n");
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
