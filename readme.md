Unless you are building mission-critical web applications, you don't need every single optimization in order
to minimize your HTML/.cshtml. You need the optimizations that give you the most bang for your buck. This library 
follows the same goals and makes the optimizations that 90% of your code can benefit from, saving the 10% for you
to handle on your own. 

This library/package is meant to be used at *compile time* in order to reduce any overhead that a runtime 
.cshtml minifier might incur.
 

# Usage
```
var minifyCshtml = require('gulp-cshtml-minify'),
    gulp = require('gulp');

gulp.src("test.cshtml")
    .pipe(minifyCshtml())
    .pipe(gulp.dest("result"));
```
---

# Features / roadmap
- [X] Removes leading and trailing whitespace
- [ ] Add option to collapse whitespace to one space instead
- [X] Handles `@using` and `@model` directives
- [X] Preserves `<pre>` and `<textarea>` blocks properly
- [X] Removes HTML comments
- [ ] Removes Razor comments
- [X] Minifies inline `<script>` blocks with uglify-js
- [X] Minifies inline `<style>` blocks with clean-css
- [ ] Add option to toggle script minification
- [ ] Add option to toggle style minification
- [X] Remove optional end tags
- [ ] Collapse whitespace within tag attributes
- [ ] Remove quotes around eligible tag attribute values
- [ ] Remove optional `<meta>` closing slash
- [ ] Remove url schemes
- [ ] ?

# Sample
### Input
```
@model MyDomain.Project.Model
@using Microsoft.AspNetCore.Http.Features

@{
    var consentFeature = Context.Features.Get<ITrackingConsentFeature>();
    var showBanner = !consentFeature?.CanTrack ?? false;
    var cookieString = consentFeature?.CreateConsentCookie();
}

<style type="text/css">
    body{
        color:red;
        margin:0 15px 2.5rem 25px;
    }

    .card .header{
        float:left;
    }
</style>

@if (showBanner)
{
    <nav id="cookieConsent" class="navbar navbar-default navbar-fixed-top" role="alert">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#cookieConsent .navbar-collapse">
                    <span class="sr-only">Toggle cookie consent banner</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <span class="navbar-brand"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></span>
            </div>
            <div class="collapse navbar-collapse">
                <!-- 
                <p class="navbar-text">
                    Use this space to summarize your privacy and cookie use policy.
                </p> -->
                <div class="navbar-right">
                    <a asp-controller="Home" asp-action="Privacy" class="btn btn-info navbar-btn">Learn More</a>
                    <button type="button" class="btn btn-default navbar-btn" data-cookie-string="@cookieString">Accept</button>
                </div>
                <pre>
                        I should
                        not
                        be
                        minified
                </pre>
            </div>
        </div>
    </nav>
    <script type="text/javascript">
        (function () {
            document.querySelector("#cookieConsent button[data-cookie-string]").addEventListener("click", function (el) {
                document.cookie = el.target.dataset.cookieString;
                document.querySelector("#cookieConsent").classList.add("hidden");
            }, false);

            var superLongName = 2;
            var verysuperlongname = 3;
            var total = superLongName + verysuperlongname;
            console.log(total);
        })();
    </script>
}
```

### Output
```
@model MyDomain.Project.Model
@using Microsoft.AspNetCore.Http.Features
@{var consentFeature = Context.Features.Get<ITrackingConsentFeature>();var showBanner = !consentFeature?.CanTrack ?? false;var cookieString = consentFeature?.CreateConsentCookie();}<style type="text/css">body{color:red;margin:0 15px 2.5rem 25px;}.card .header{float:left;}</style>@if (showBanner){<nav id="cookieConsent" class="navbar navbar-default navbar-fixed-top" role="alert"><div class="container"><div class="navbar-header"><button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#cookieConsent .navbar-collapse"><span class="sr-only">Toggle cookie consent banner</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button><span class="navbar-brand"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></span></div><div class="collapse navbar-collapse"><div class="navbar-right"><a asp-controller="Home" asp-action="Privacy" class="btn btn-info navbar-btn">Learn More</a><button type="button" class="btn btn-default navbar-btn" data-cookie-string="@cookieString">Accept</button></div>
<pre>
                        I should
                        not
                        be
                        minified
                </pre></div></div></nav><script type="text/javascript">!function(){document.querySelector("#cookieConsent button[data-cookie-string]").addEventListener("click",function(e){document.cookie=e.target.dataset.cookieString,document.querySelector("#cookieConsent").classList.add("hidden")},!1);console.log(5)}();</script>}
```

# Other options
In case we couldn't help you, there are other options you may want to try to reduce your .cshtml:

* [https://github.com/Taritsyn/WebMarkupMin](https://github.com/Taritsyn/WebMarkupMin) (.net runtime middleware)
* [https://github.com/deanhume/html-minifier](https://github.com/deanhume/html-minifier) (.exe that processes files)