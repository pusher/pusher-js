// Include this file to use CrashKit for reporting errors in your application.
// Visit http://crashkitapp.appspot.com/ for details.
//
// Copyright (c) 2009 Andrey Tarantsov, YourSway LLC (http://crashkitapp.appspot.com/)
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
//
// Huge thanks goes to Eric Wendelin, Luke Smith and Loic Dachary
// for inspiring us and giving us a head-start in JS stack trace collection.
// See: http://eriwen.com/javascript/js-stack-trace/
//
// This file consists of three parts:
// 1) definition of CrashKit.report
// 2) definition of CrashKit.computeStackTrace
// 3) integration code that sends CrashKit.report notifications to CrashKit servers

var CrashKit = {};


// CrashKit.report: cross-browser processing of unhandled exceptions
//
// Syntax:
//   CrashKit.report.subscribe(function(stackInfo) { ... })
//   CrashKit.report(exception)
//   try { ...code... } catch(ex) { CrashKit.report(ex); }
//
// Supports:
//   - Firefox: full stack trace with line numbers
//   - Opera:   full stack trace with line numbers
//   - Safari:  line number for the topmost element only, some frames may be missing
//   - IE:      line number for the topmost element only, some frames may be missing
//
// Requires CrashKit.computeStackTrace.
//
// Tries to catch all unhandled exceptions and report them to the subscribed handlers.
// Note that CrashKit.report(ex) will rethrow the exception. Make sure it gets rethrown
// in every catch block if you want to get useful stack traces in IE.
//
// A handler receives stackInfo described in CrashKit.computeStackTrace docs.
//
CrashKit.report = (function() {
    var handlers = [];
    var lastException = null, lastExceptionStack = null;

    var subscribe = function(handler) {
        handlers.push(handler);
    };

    var notifyHandlers = function(stack) {
        var exception = null;
        for(var i in handlers)
            try {
                handlers[i](stack);
            } catch(inner) {
                exception = inner;
            }
        if (exception) { throw exception; }
    };

    var onerrorHandler = function(message, url, lineNo) {
        var stack = null;
        if (lastExceptionStack) {
            CrashKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo);
            stack = lastExceptionStack;
            lastExceptionStack = null;
            lastException = null;
        } else {
            var location = {'url': url, 'line': lineNo};
            location.func = CrashKit.computeStackTrace.guessFunctionName(location.url, location.line);
            location.context = CrashKit.computeStackTrace.gatherContext(location.url, location.line);
            stack = {'mode': 'onerror', 'message': message, 'stack': [location]};
        }
        notifyHandlers(stack);
        return false;
    };

    var report = function(ex) {
        if (lastExceptionStack) {
            if (lastException == ex) {
                return; // already caught by an inner catch block, ignore
            } else {
                var s = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers(s);
            }
        }

        var stack = CrashKit.computeStackTrace(ex, 1);
        lastExceptionStack = stack;
        lastException = ex;
        window.setTimeout(function() {
            if (lastException == ex) {
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers(stack);
            }
        }, (stack.incomplete ? 500 : 1));
        throw ex; // re-throw to propagate to the top level (and cause window.onerror)
    };

    window.onerror = onerrorHandler;

    // jQuery integration (not really tested)
    if(typeof jQuery != 'undefined') {
      // override jQuery.fn.bind to wrap every provided function in try/catch
      var jQueryBind = jQuery.fn.bind;
      jQuery.fn.bind = function(type, data, fn) {
          if (!fn && data && typeof data == 'function') {
              fn = data;
              data = null;
          }
          if (fn) {
              var origFn = fn;
              var wrappedFn = function() {
                  try {
                      return origFn.apply(this, arguments);
                  } catch (ex) {
                      CrashKit.report(ex);
                  }
              };
              fn = wrappedFn;
          }
          return jQueryBind.call(this, type, data, fn);
      };
    }

    report.subscribe = subscribe;
    return report;
})();


// CrashKit.computeStackTrace: cross-browser stack traces in JavaScript
//
// Syntax:
//   s = CrashKit.computeStackTrace.ofCaller([depth])
//   s = CrashKit.computeStackTrace(exception) -- consider using CrashKit.report instead (see below)
// Returns:
//   s.name              - exception name
//   s.message           - exception message
//   s.stack[i].url      - JavaScript or HTML file URL
//   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
//   s.stack[i].line     - line number, or null if unknown
//   s.stack[i].context  - an array of source code lines, the middle element corresponds to the correct line#
//   s.mode              - 'firefox', 'opera' or 'callers' -- method used to collect the stack trace
//
// Supports:
//   - Firefox: full stack trace with line numbers
//   - Opera:   full stack trace with line numbers
//   - Safari:  line number for the topmost stacktrace element only
//   - IE:      no line numbers whatsoever
//
// * Tries to guess names of anonymous functions by looking for assignments in the source code.
// * In IE and Safari has to guess source file names by searching for func bodies inside all page scripts.
// * Beware: some func names may be guessed incorrectly and duplicate funcs may be mismatched.
//
// CrashKit.computeStackTrace should only be used for tracing purposes. Logging of unhandled exceptions
// should be done with CrashKit.report, which builds on top of CrashKit.computeStackTrace and provides
// better IE support by utilizing window.onerror event.
//
// Note: In IE and Safari, no stack trace is recorded inside exception object, so computeStackTrace
// instead walks its *own* chain of callers. This means that:
//  * in Safari, some methods may be missing from the stack trace;
//  * in IE, the topmost function in the stack trace will always be the caller of computeStackTrace.
// This is okay for tracing (because you are likely to be calling computeStackTrace from the function
// you want to be the topmost element of the stack trace anyway), but not okay for logging unhandled
// exceptions (because your catch block will likely be far away from the inner function that actually
// caused the exception).
//
// Tracing example:
//     function trace(message) {
//         var stackInfo = CrashKit.computeStackTrace.ofCaller();
//         var data = message + "\n";
//         for(var i in stackInfo.stack) {
//             var item = stackInfo.stack[i];
//             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
//         }
//         if (window.console)
//             console.info(data);
//         else
//             alert(data);
//     }
//
CrashKit.computeStackTrace = (function() {
    var debug = false;
    var sourceCache = {};

    if (typeof XMLHttpRequest == "undefined") {  // IE 5.x-6.x:
        XMLHttpRequest = function() {
            try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch(e) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch(e) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch(e) {}
            try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {}
            throw new Error( "This browser does not support XMLHttpRequest." );
        };
    }

    var loadSource = function(url) {
        try {
            var request = new XMLHttpRequest();
            request.open("GET", url, false);
            request.send("");
            return request.responseText;
        } catch(e) {
            // alert(e.message);
            return "";
        }
    };

    var getSource = function(url) {
        if (!(url in sourceCache))
            sourceCache[url] = loadSource(url).split("\n");
        return sourceCache[url];
    };

    var guessFunctionNameFromLines = function(lineNo, source) {
	var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/;
	var reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/;
	// Walk backwards from the first line in the function until we find the line which
	// matches the pattern above, which is the function definition
	var line = "";
	var maxLines = 10;
	for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo-i] + line;
            if (line !== undefined)
            {
                var m = reGuessFunction.exec(line);
                if (m) {
                    return m[1];
                } else {
                    m = reFunctionArgNames.exec(line);
                } if (m && m[1]) {
                    return m[1];
                }
            }
        }
        return "?";
    };

    var guessFunctionName = function(url, lineNo) {
        var source = getSource(url);
        return guessFunctionNameFromLines(lineNo, source);
    };

    var gatherContext = function(url, lineNo) {
        var source = getSource(url);
        var context = [], anyDefined = false;
        lineNo = lineNo - 1; // convert to int and to 0-based indexes
        for(var l = lineNo - 2; l <= lineNo + 2; l++) {
            var item = source[l];
            if (typeof item != "undefined")
                anyDefined = true;
            context.push(item);
        }
        return (anyDefined ? context : null);
    };

    var escapeRegExp = function(text) {
        if (!arguments.callee.sRE) {
            var specials = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'];
            arguments.callee.sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
        }
        return text.replace(arguments.callee.sRE, '\\$1');
    };

    var escapeCodeAsRegExpForMatchingInsideHTML = function(body) {
        return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)')
                .replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
    };

    var findSourceInUrls = function(re, urls, singleLineExpected) {
        for (var i in urls) {
            var source = getSource(urls[i]);
            if (source) {
                source = source.join("\n");
                var m = re.exec(source);
                if (m) {
                    var result = {'url': urls[i], 'line': null};
                    result.startLine = source.substring(0, m.index).split("\n").length;
                    if (singleLineExpected)
                        result.line = result.startLine;
                    // console.info("Found function in " + urls[i]);
                    return result;
                }
            }
        }
        return null;
    };

    var findSourceByFunctionBody = function(func) {
        var htmlUrls = [window.location.href];
        var urls = [window.location.href];
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            if (script.src)
                urls.push(script.src);
        }
        var code = ""+func;

        var codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]+)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/;
        var eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/;
        var re;
        var isOneLiner = false;
        if (!codeRE.test(code))
            re = new RegExp(escapeRegExp(code));
        else {
            var name = RegExp.$1, args = RegExp.$2, body = RegExp.$3;
            args = args.split(",").join("\\s*,\\s*");
            name = (name ? "\\s+" + name : '');
            isOneLiner = (body.split("\n").length == 1);
            body = escapeRegExp(body)
                .replace(/;$/, ';?') // semicolon is inserted if the function ends with a comment
                .replace(/\s+/g, '\\s+');
            re = new RegExp("function" + name + "\\s*\\(" + args + "\\)\\s*{\\s*" + body + "\\s*}");
        }

        var result = findSourceInUrls(re, urls, isOneLiner);
        if (result) return result;

        if (eventRE.test(code)) {
            var event = RegExp.$1, body = RegExp.$2;
            body = escapeCodeAsRegExpForMatchingInsideHTML(body);

            re = new RegExp("on" + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');
            result = findSourceInUrls(re, urls, true);
            if (result) return result;

            re = new RegExp(body);
            result = findSourceInUrls(re, urls, true);
            if (result) return result;
        }

        if (window.console)
            console.info("Function code not found in HTML and all SCRIPTs (please contact CrashKit support):\n" + code);
        return null;
    };

    // Contents of Exception in various browsers.
    //
    // WEBKIT:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://localhost:5005/static/javascript/crashkit-ie-test.html
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://localhost:5005/static/javascript/crashkit-ie-test.html#
    // ex.lineNumber = 59
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'


    var computeStackTraceFromFirefoxStackProp = function(ex) {
        if (!ex.stack)
            return null;

        // In Firefox, ex.stack contains a stack trace as a string. Example value is:
        //
        // qqq("hi","hi","hi")@file:///Users/andreyvit/Projects/crashkit/javascript-client/sample.js:7
        // ("hi","hi","hi")@file:///Users/andreyvit/Projects/crashkit/javascript-client/sample.js:3
        // ppp("hi","hi","hi")@file:///Users/andreyvit/Projects/crashkit/javascript-client/sample.html#:17
        // ("hi","hi","hi")@file:///Users/andreyvit/Projects/crashkit/javascript-client/sample.html#:12
        // xxx("hi")@file:///Users/andreyvit/Projects/crashkit/javascript-client/sample.html#:8
        // onclick([object MouseEvent])@file:///Users/andreyvit/Projects/crashkit/javascript-client/sample.html#:1

        var lineRE = /^\s*(?:(\w*)\(.*\))?@((?:file|http).*):(\d+)\s*$/i;
        var lines = ex.stack.split("\n");
        var stack = [];
        for(var i in lines) {
            var line = lines[i];
            if (lineRE.test(line)) {
                var element = {'url': RegExp.$2, 'func': RegExp.$1, 'line': RegExp.$3};
                if (!element.func && element.line)
                    element.func = guessFunctionName(element.url, element.line);
                if (element.line)
                    element.context = gatherContext(element.url, element.line);
                stack.push(element);
            }
        }
        if (!stack.length)
            return null; // ex.stack is defined, but cannot be parsed
        return {'mode': 'firefox', 'name': ex.name, 'message': ex.message, 'stack': stack};
    };

    var computeStackTraceFromOperaMultiLineMessage = function(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/crashkit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/crashkit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/crashkit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { CrashKit.report(ex); }
        //   ...
        //
        // Note that we don't try to detect Opera because browser detection is evil.
        // Instead, we try to parse any multi-line exception message as Opera stack trace.

        var lines = ex.message.split("\n");
        if (lines.length < 4)
            return null;

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i;
        var stack = [];
        var scripts = document.getElementsByTagName('script');
        var inlineScriptBlocks = [];
        for (var i in scripts)
            if (!scripts[i].src)
                inlineScriptBlocks.push(scripts[i]);
        for (var i=2, len=lines.length; i < len; i += 2) {
            var item = null;
            if (lineRE1.test(lines[i]))
                item = {'url': RegExp.$2, 'func': RegExp.$3, 'line': RegExp.$1};
            else if (lineRE2.test(lines[i])) {
                item = {'url': RegExp.$3, 'func': RegExp.$4};
                var relativeLine = (RegExp.$1 - 0);  // relative to the start of the <SCRIPT> block
                var script = inlineScriptBlocks[RegExp.$2 - 1];
                if (script) {
                    var source = getSource(item.url);
                    if (source) {
                        source = source.join("\n");
                        var pos = source.indexOf(script.innerText);
                        if (pos >= 0) {
                            item.line = relativeLine + source.substring(0, pos).split("\n").length;
                        }
                    }
                }
            } else if (lineRE3.test(lines[i])) {
                var url = window.location.href.replace(/#.*$/, ''), line = RegExp.$1;
                var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i+1]));
                var source = findSourceInUrls(re, [url], true);
                if (source)
                    item = {'url': url, 'line': source.line, 'func': ''};
            }
            if (item) {
                if (!item.func)
                    item.func = guessFunctionName(item.url, item.line);
                var context = gatherContext(item.url, item.line);
                var midline = (context ? context[Math.floor(context.length/2)] : null);
                if (context && midline.replace(/^\s*/, '') == lines[i+1].replace(/^\s*/, ''))
                    item.context = context;
                else {
                    // if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
                    item.context = [lines[i+1]];
                }
                stack.push(item);
            }
        }
        if (!stack.length)
            return null; // could not parse multiline exception message as Opera stack trace

        return {'mode': 'opera', 'name': ex.name, 'message': lines[0], 'stack': stack};
    };

    var augmentStackTraceWithInitialElement = function(stackInfo, url, lineNo) {
        var initial = {'url': url, 'line': lineNo};
        if (initial.url && initial.line) {
            stackInfo.incomplete = false;

            if (!initial.func)
                initial.func = guessFunctionName(initial.url, initial.line);
            if (!initial.context)
                initial.context = gatherContext(initial.url, initial.line);
            if (stackInfo.stack.length > 0)
                if (stackInfo.stack[0].url == initial.url)
                    if (stackInfo.stack[0].line == initial.line) {
                        return; // already in stack trace
                    } else if (!stackInfo.stack[0].line && stackInfo.stack[0].func == initial.func) {
                        stackInfo.stack[0].line = initial.line;
                        stackInfo.stack[0].context = initial.context;
                        return;
                    }
            stackInfo.stack.splice(0, 0, initial);
            stackInfo.partial = true;
            return true;
        } else {
            stackInfo.incomplete = true;
        }
    };

    var computeStackTraceByWalkingCallerChain = function(ex, depth) {
        var fnRE  = /function\s*([\w\-$]+)?\s*\(/i;
        var stack = [];

        var funcs = {}, recursion = false;
        for(var curr = arguments.callee.caller; curr && !recursion; curr = curr.caller) {
            var fn = curr.name || '';
            if (!fn)
                fn = fnRE.test(curr.toString()) ? RegExp.$1 || '' : '';

            var source = findSourceByFunctionBody(curr);
            var url = null, line = null;
            if (source) {
                url  = source.url;
                line = source.line;
                if (!fn)
                    fn = guessFunctionName(url, source.startLine);
            }

            recursion = !!funcs[curr];
            funcs[curr] = true;

            var item = {'url': url, 'func': fn, 'line': line};
            if (recursion) item.recursion = true;
            stack.push(item);
        }
        stack.splice(0, depth);

        var result = {'mode': 'callers', 'name': ex.name, 'message': ex.message, 'stack': stack};
        augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber);
        return result;
    };

    var computeStackTrace = function(ex, depth) {
        var stack = null;
        depth = (typeof depth == 'undefined' ? 0 : depth-0);

        try {
            stack = computeStackTraceFromFirefoxStackProp(ex);
            if (stack) return stack;
        } catch(e) { if(debug) throw e; }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) return stack;
        } catch(e) { if(debug) throw e; }

        try {
            stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
            if (stack) return stack;
        } catch(e) { if(debug) throw e; }

        return { 'mode': 'failed' };
    };

    var computeStackTraceOfCaller = function(depth) {
        depth = (typeof depth == 'undefined' ? 0 : depth-0) + 1; // "+ 1" because "ofCaller" should drop one frame
        try {
            (0)();
        } catch(ex) {
            return computeStackTrace(ex, depth+1);
        }
    };

    computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
    computeStackTrace.guessFunctionName = guessFunctionName;
    computeStackTrace.gatherContext = gatherContext;
    computeStackTrace.ofCaller = computeStackTraceOfCaller;

    return computeStackTrace;
})();


// this part is specific to CrashKit web application
(function() {
    var crashKitHost = null;
    var webServiceUrl = null;

    var computeWebServiceUrl = function() {
        var els = document.getElementsByTagName("SCRIPT");
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var src = el.src;
            if (src && src.indexOf("crashkit-javascript.js?") >= 0) {
                crashKitHost = src.substring(src.indexOf("://") + 3);
                crashKitHost = crashKitHost.substring(0, crashKitHost.indexOf("/"));

                var x = src.substring(src.indexOf("?") + 1).split("/");
                var proto = (("https:" == document.location.protocol) ? "https://" : "http://");
                webServiceUrl = proto + crashKitHost + "/" + x[0] + "/products/" + x[1] + "/post-report/0/0";
            }
        }
    };

    var encodeJSON = function() {
	var	c = {"\b":"b","\t":"t","\n":"n","\f":"f","\r":"r",'"':'"',"\\":"\\","/":"/"},
		d = function(n){return n<10?"0".concat(n):n},
		e = function(c,f,e){e=eval;delete eval;if(typeof eval==="undefined")eval=e;f=eval(""+c);eval=e;return f},
		i = function(e,p,l){return 1*e.substr(p,l)},
		p = ["","000","00","0",""],
		rc = null,
		rd = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/,
		rt = /^([0-9]+|[0-9]+[,\.][0-9]{1,3})$/,
		rs = /(\x5c|\x2F|\x22|[\x0c-\x0d]|[\x08-\x0a])/g,
		s = function(i,d){return "\\".concat(c[d])},
		ru = /([\x00-\x07]|\x0b|[\x0e-\x1f])/g,
		u = function(i,d){
			var	n=d.charCodeAt(0).toString(16);
			return "\\u".concat(p[n.length],n)
		},
		v = function(k,v){return $[typeof result](result)!==Function&&(v.hasOwnProperty?v.hasOwnProperty(k):v.constructor.prototype[k]!==v[k])},
		$ = {
			"boolean":function(){return Boolean},
			"function":function(){return Function},
			"number":function(){return Number},
			"object":function(o){return o instanceof o.constructor?o.constructor:null},
			"string":function(){return String},
			"undefined":function(){return null}
		},
		$$ = function(m){
			function $(c,t){t=c[m];delete c[m];try{e(c)}catch(z){c[m]=t;return 1}};
			return $(Array)&&$(Object)
		};
	try { rc = new RegExp('^("(\\\\.|[^"\\\\\\n\\r])*?"|[,:{}\\[\\]0-9.\\-+Eaeflnr-u \\n\\r\\t])+?$') }
	catch(z) { rc=/^(true|false|null|\[.*\]|\{.*\}|".*"|\d+|\d+\.\d+)$/ };

        var encodeJSON = function(self) {
            if (self === null) return "null";
            if (self === undefined) return "null";
            var result, type = typeof self;
            var tmp = $[type](self);
            if (tmp == null) return null;
            switch (tmp) {
                case Array:
                    result = [];
                    for(var	i = 0, j = 0, k = self.length; j < k; j++) {
                        if(self[j] !== undefined && (tmp = encodeJSON(self[j])))
                            result[i++] = tmp;
                    };
                    return "[".concat(result.join(","), "]");
                case Boolean:
                    return String(self);
                case Date:
                    return '"'.concat(self.getFullYear(), '-', d(self.getMonth() + 1), '-', d(self.getDate()), '"');
                case Function:
                    return "";
                case Number:
                    return isFinite(self) ? String(self) : "null";
                case String:
                    return '"'.concat(self.replace(rs, s).replace(ru, u), '"');
                default:
                    var	i = 0, key;
                    result = [];
                    for (key in self) {
                        if (self[key] !== undefined && (tmp = encodeJSON(self[key])))
                            result[i++] = '"'.concat(key.replace(rs, s).replace(ru, u), '":', tmp);
                    };
                    return "{".concat(result.join(","), "}");
            }
        };
        return encodeJSON;
    }();

    var encodeError = function (stack) {
        return encodeJSON([{
            "userActionOrScreenNameOrBackgroundProcess": '',
            "severity": "major",
            "exception": stack,
            "data": {
                "cookie": document.cookie,
                "url": window.location.href
            },
            "env": {
                "user_agent": navigator.userAgent,
                "opera": !!window.opera,
                "vendor": navigator.vendor,
                "platform": navigator.platform
            },
            "language": "javascript"
        }]);
    };

    var sendPayload = function(text){
        var request = new XMLHttpRequest();
        request.open("POST", webServiceUrl, false);
        request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        request.send(text);
        if (!request.getResponseHeader("Date") || request.status != 200) {
            // oops
        }
    };

    var sendToCrashKit = function(stack) {
        if (webServiceUrl == null)
            computeWebServiceUrl();
        if (webServiceUrl == null)
            return;
        var json = encodeError(stack);
        if (window.console)
            window.console.info("Error report sent to " + crashKitHost + ":\n" + json);
        sendPayload(json);
    };

    CrashKit.report.subscribe(sendToCrashKit);
})();