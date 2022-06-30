'use strict';
const Transform = require('readable-stream').Transform;
const rs = require('replacestream');
const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');



// Configure all options we can enable
let defaultOptions = {
  removeHtmlComments: true,
  removeRazorComments: true,
  removeCssComments: true,
  minifyCss: true,
  minifyJs: true,
  collapseWhitespace: false,
  optionalClosingTags: true,
  urlSchemes: true,
  comments: [],
  uglifyjsOptions: {},
  cleancssOptions: {}
};

// Pre-process options
if (defaultOptions.removeHtmlComments) {
  defaultOptions.comments.push({
    start: "<!--",
    end: "-->"
  });
}
if (defaultOptions.removeRazorComments) {
  defaultOptions.comments.push({
    start: "@\\*",
    end: "\\*@"
  });
}


// Module to export
module.exports = function (options) {
  if (typeof options === "undefined") {
    options = defaultOptions;
  } else {
    const userRequested = Object.assign(defaultOptions, options);
    options = userRequested;
  }

  return new Transform({
    objectMode: true,
    transform: function (file, _enc, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      function doReplace() {
        if (file.isStream()) {
          file.contents = file.contents.pipe(rs());
          return callback(null, file);
        }

        if (file.isBuffer()) {
          let temp = String(file.contents);

          // CLEAN UP FILE AND MINIMIZE IT
          const keepIntegrity = 'pre,textarea';
          const voidElements = 'area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr';

          // Optimize all inline script blocks
          if (options.minifyJs) {
            temp = temp.replace(/(<script.*?>)([\s\S]*?)(<\/script>)/gm, function (_match, p1, p2, p3, _offset, _string) {
              const minification = UglifyJS.minify(p2, options.uglifyjsOptions);

              // Will NOT minify <script> blocks if we
              // find any razor code inside of it
              if (!minification.error && p2.match(/(@\(|@{)/) === null) {
                return p1 + minification.code + p3;
              } else {
                return p1 + p2 + p3;
              }
            });
          }

          // Optimize all inline css blocks
          if (options.minifyCss) {
            temp = temp.replace(/(<style.*?>)([\s\S]*?)(<\/style>)/gm, function (_match, p1, p2, p3, _offset, _string) {
              const minification = new CleanCSS(options.cleancssOptions).minify(p2);

              // Will NOT minify <style> blocks if we
              // find any razor code inside of it
              if (!minification.errors && p2.match(/(@\(|@{)/) === null) {
                return p1 + minification.styles + p3;
              } else {
                return p1 + p2 + p3;
              }
            });
          }


          // Keep the integrity of these blocks
          let integrityBlockContents = [];
          const tags = keepIntegrity.split(',');

          for (let i = 0; i < tags.length; i++) {
            const reg = new RegExp("(<" + tags[i] + ".*?>)([\\s\\S]*?)(<\\/" + tags[i] + ">)", "gm");

            temp = temp.replace(reg, function (_match, p1, p2, p3, _offset, _string) {
              const contents = "<INTEGRITY-" + tags[i] + "-" + tags[i].length + "></INTEGRITY-" + tags[i] + "-" + tags[i].length + ">";
              integrityBlockContents.push({
                placeholder: contents,
                original: p1 + p2 + p3
              });

              return contents;
            });
          }

          // Remove optional tags
          // https://www.w3.org/TR/html5/syntax.html#optional-tags
          if (options.optionalClosingTags) {
            temp = temp.replace(/(<\/body>|<\/html>|<\/li>|<\/rt>|<\/rp>|<\/optgroup>|<\/option>|<\/td>|<\/th>|<\/p>)/gm, "");
          }

          // Remove trailing slash on the void tags
          const voidTags = voidElements.split(",");
          for (let i = 0; i < voidTags.length; i++) {

            let reg = new RegExp("(<" + voidTags[i] + ".+)(\\s\\/>)", "gm");
            temp = temp.replace(reg, "$1>");
            reg = new RegExp("(<" + voidTags[i] + ".+)(\\/>)", "gm");
            temp = temp.replace(reg, "$1>");
          }

          // Collapse whitespace within tag attributes
          temp = temp.replace(/([a-zA-Z0-9-_]+)\s*=\s*([']|[\"])([\W\w]*?)\2/gm, function (_match, p1, p2, p3, _offset, _string) {
            const quotesNeeded = p3.match(/[\s<>`\/=@]/gm);
            const value = options.urlSchemes ? p3.replace(/https?:\/\//gm, "//") : p3;

            if (!quotesNeeded) {
              return p1 + "=" + value;
            } else {
              return p1 + "=" + p2 + value + p2;
            }
          });

          // Replace whitespace at beginning of lines;
          // breaks razor @ directives if on!
          if (options.collapseWhitespace) {
            temp = temp.replace(/^[\s\t]*/gm, ' ');
          } else {
            temp = temp.replace(/^[\s\t]*/gm, '');
          }


          // Replace end of lines
          temp = temp.replace(/^((?!@:|@model|@using|@inject).+)(\r\n|\r|\n)/gm, "$1");

          // Replace any comments
          for (let i = 0; i < options.comments.length; i++) {
            // Validate
            if (typeof options.comments[i].start !== "undefined" &&
              typeof options.comments[i].end !== "undefined") {


              const reg = new RegExp(options.comments[i].start + "([\\s\\S]*?)" + options.comments[i].end, "gm");
              temp = temp.replace(reg, "");
            }
          }
          // Replace css comments
          if (options.removeCssComments) {
            const reg = new RegExp("(<style.*?>)([\\s\\S]*?)(<\\/style>)", "gm");

            temp = temp.replace(reg, function (_match, p1, p2, p3, _offset, _string) {
              p2 = p2.replace(/\/\*[\s\S]*?\*\//gm, '');

              return p1 + p2 + p3;
            });
          }

          // Re-insert blocks that have integrity
          for (let i = 0; i < integrityBlockContents.length; i++) {
            temp = temp.replace(integrityBlockContents[i].placeholder, "\r\n" + integrityBlockContents[i].original);
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