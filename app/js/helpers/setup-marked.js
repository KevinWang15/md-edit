function setupMarked() {
    var renderer = new marked.Renderer();
    var $rootScope = null;

    function getPath(path) {
        if (path.lastIndexOf('/') >= 0) {
            return path.substring(0, path.lastIndexOf('/') + 1);
        } else if (path.lastIndexOf('\\') >= 0) {
            return path.substring(0, path.lastIndexOf('\\') + 1);
        }
    }

    window.detectImages = function (md) {
        var localImages = [];
        var remoteImages = [];
        var original = renderer.image;

        renderer.image = function (href, title, text, original) {
            console.log(original);

            if (!/^((http|https|ftp):[\\\/])/m.test(href.trim())) {
                if (/^(\w:|\/)/.test(href)) {
                    //Absolute
                    localImages.push({
                        path: href,
                        original: href,
                        originalMd: original
                    });
                } else {
                    //Relative
                    localImages.push({
                        path: getPath($rootScope.fs.openFiles[$rootScope.fs.currentlyOpen].path) + href,
                        original: href,
                        originalMd: original
                    });
                }
            } else {
                remoteImages.push({
                    path: href,
                    original: href,
                    originalMd: original
                });
            }
        };

        window.marked(md);

        console.log(remoteImages);

        renderer.image = original;
        return {localImages: localImages, remoteImages: remoteImages};
    };

    renderer.image = function (href, title, text) {
        if (!$rootScope)
            $rootScope = angular.element($('html')).scope();
        if (!$rootScope) {
            return '<img src="' + href + '" alt="' + text + '"/>';
        }
        if (/^((\w|http|https|ftp):[\\\/]|\/)/m.test(href)) {
            //Absolute path
            return '<img src="' + href + '" alt="' + text + '"/>';
        } else {
            //Relative path
            return '<img src="' + getPath($rootScope.fs.openFiles[$rootScope.fs.currentlyOpen].path) + href + '" alt="' + text + '"/>';
        }
    };

    renderer.paragraph = function (text) {

        text = text.replace(/\$\$([^\$]+?)\$\$/g, function (wrap, match) {
            var ret = match;
            ret = ret.replace(/<\/?em>/mg, '_');
            try {
                ret = '<div class="math math-block">' + katex.renderToString(ret) + '</div>';
            } catch (err) {
                ret = match;
            }
            return ret;
        });

        text = text.replace(/\$([^\$]+?)\$/g, function (wrap, match) {
            var ret = match;
            ret = ret.replace(/<\/?em>/mg, '_');
            try {
                ret = katex.renderToString(ret);
            } catch (err) {
                ret = match;
            }
            return ret;
        });

        return '<p>' + text + '</p>';
    };

    window.marked.setOptions({
        gfm: true,
        tables: true,
        sanitize: true,
        smartLists: true,
        smartypants: false,
        pedantic: false,
        highlight: function (code, language) {
            try {
                return hljs.highlight(language, code).value;
            } catch (ex) {
                return hljs.highlightAuto(code).value
            }
        },
        renderer: renderer
    });
}