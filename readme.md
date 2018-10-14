# Why minify?
Your site can experience [a 27% higher conversion rate by improving page speed by 1 second](https://developer.akamai.com/blog/2015/09/01/mobile-web-performance-monitoring-conversion-rate). Or [read about these stories](https://blog.hubspot.com/marketing/page-load-time-conversion-rates); and consider that [Google ranks your page higher on search engine results the faster it loads](http://www.thesempost.com/google-mobile-first-index-page-speed-ranking/). No matter what
your website, you want people to use it. The slower it loads, the less patient people are going to be waiting around for
the content.

Minification is just one of the ways you can make your website more accessible to others, besides other options like [adding a load balancer to help distribute network traffic](https://www.nginx.com/resources/glossary/load-balancing/) or [upgrading to the latest and greatest version of your framework](https://visualstudiomagazine.com/articles/2018/08/22/bing-net-core.aspx) (which you *SHOULD* do if you are using .NET Core). Thankfully, minification is easy and this library aims to give you the biggest possible performance improvement for your .cshtml/html files.

Why not use [another minification library that's recommended by Google](https://developers.google.com/speed/docs/insights/MinifyResources)? That library only works on HTML files, but rest assured, we are taking heavy inspiration from this library in order to make use of the same minification techniques for .cshtml files. In case our library's approach of using [gulp](https://gulpjs.com/) to minify your .cshtml does not work for you, I would recommend [an .exe in order to minify your .cshtml](https://github.com/deanhume/html-minifier) and steer you away from [options like this](https://github.com/Taritsyn/WebMarkupMin) if you can help it. (Minifying at runtime incurs a performance penalty).

# How it works
This minification library works by taking the biggest offenders to page weight and nullifies them. We reduce the number of bytes your .cshtml/html is made of, which makes it quicker to send the page to the end user. What do we do exactly? The list isn't comprehensive (and more features are being added), but here is what we have right now:

- [X] Removes leading/trailing whitespace
- [X] Removes HTML/Razor comments
- [X] Minifies inline `<script>` blocks with [uglify-js](https://www.npmjs.com/package/uglify-js)
- [X] Minifies inline `<style>` blocks with [clean-css](https://www.npmjs.com/package/clean-css)
- [X] Remove optional closing tags
- [X] Collapse whitespace within tag attributes
- [X] Remove quotes around eligible tag attribute values
- [X] Remove optional closing slashes on void elements
- [X] Remove url schemes

# How to use
1. `npm install gulp-cshtml-minify`
2.
```
var minifyCshtml = require('gulp-cshtml-minify'),
    gulp = require('gulp');

gulp.src("test.cshtml")
    .pipe(minifyCshtml())
    .pipe(gulp.dest("result"));
```

# Options
You can pass in a number of options into the function to customize what options are turned on and off. The values shown below are the default options and will be set as such if you do not pass in any custom options when running the library (as seen in the above example).
```
var minifyCshtml = require('gulp-cshtml-minify'),
    gulp = require('gulp');

gulp.src("test.cshtml")
    .pipe(minifyCshtml({
        removeHtmlComments: true,
        removeRazorComments: true,
        minifyCss: true,
        minifyJs: true,
        collapseWhitespace: false, /* collapses whitespace to one space */
        optionalClosingTags: true, /* removes optional tags */
        urlSchemes: true /* https:// -> // */
    }))
    .pipe(gulp.dest("result"));
```

*Note* - Collapsing whitespace [can cause issues if you are relying on spacing to display inline elements](http://perfectionkills.com/experimenting-with-html-minifier/#collapse_whitespace).

*Note* - Removing optional closing tags [in seldom circumstances may lead to unexpected behavior](https://www.w3.org/TR/html5/syntax.html#optional-tags).

*Note* - Shortening the url schemes may cause problems if you load resources over https when your page is loaded over http, [which should no longer apply to the majority](https://security.googleblog.com/2018/02/a-secure-web-is-here-to-stay.html) (but may apply to you).

# Benchmarks
I have taken random pages from different websites to show you the performance of this library. This will be built into a nice command you can run on your own in the package at a later date but for now will remain solely as text. *Please note* - that these numbers are not taking into account GZIP, which [on its own can reduce text content by 60-88%](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/optimize-encoding-and-transfer). But don't just gzip and not minify, read [here](https://stackoverflow.com/questions/807119/gzip-versus-minify), [here](https://multiplethreads.wordpress.com/2015/08/01/minify-and-gzip/) or [here](https://madskristensen.net/blog/effects-of-gzipping-vs-minifying-html-files/) why you should be doing both.

| Url        | Original           | Minified  | Savings |
| ------------- |-------------| ----- | ----- |
| [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match) | 112.9KB | 97KB | 15%
| [Vox](https://www.vox.com/2018/9/21/17886892/star-wars-release-schedule-disney-bob-iger) | 157.5KB | 138KB | 12.4%
| [Food Network](https://www.foodnetwork.com/healthyeats/news/2018/9/dairy-free-ice-creams-favorites) | 151.8KB | 126.2KB | 17%
| [Olive Garden](https://www.olivegarden.com/menu-listing/dinner) | 620.1KB | 536.9KB | 14%