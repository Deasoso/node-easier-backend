"use strict";
var TurndownService = require('@joplin/turndown');
var turndownPluginGfm = require('@joplin/turndown-plugin-gfm').gfm;
var markdownUtils_1 = require("./markdownUtils");
const parse = function (html, options) {
    if (options === void 0) { options = {}; }
    var turndown = new TurndownService({
        headingStyle: 'atx',
        anchorNames: options.anchorNames ? options.anchorNames.map(function (n) { return n.trim().toLowerCase(); }) : [],
        codeBlockStyle: 'fenced',
        preserveImageTagsWithSize: !!options.preserveImageTagsWithSize,
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
        br: ''
    });
    turndown.use(turndownPluginGfm);
    turndown.remove('script');
    turndown.remove('style');
    var md = turndown.turndown(html);
    if (options.baseUrl)
        md = markdownUtils_1["default"].prependBaseUrl(md, options.baseUrl);
    return md;
};
exports.parse = parse;
