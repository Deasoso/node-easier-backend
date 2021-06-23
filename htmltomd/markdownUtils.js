"use strict";
var renderer_1 = require("@joplin/renderer");
var stringPadding = require('string-padding');
var urlUtils = require('./urlUtils');
var MarkdownIt = require('markdown-it');
// Taken from codemirror/addon/edit/continuelist.js
var listRegex = /^(\s*)([*+-] \[[x ]\]\s|[*+-]\s|(\d+)([.)]\s))(\s*)/;
var emptyListRegex = /^(\s*)([*+-] \[[x ]\]|[*+-]|(\d+)[.)])(\s+)$/;
var MarkdownTableJustify;
(function (MarkdownTableJustify) {
    MarkdownTableJustify[MarkdownTableJustify["Left"] = 'left'] = "Left";
    MarkdownTableJustify[MarkdownTableJustify["Center"] = 'center'] = "Center";
    MarkdownTableJustify[MarkdownTableJustify["Right"] = 'right,'] = "Right";
})(MarkdownTableJustify = exports.MarkdownTableJustify || (exports.MarkdownTableJustify = {}));
var markdownUtils = {
    // Titles for markdown links only need escaping for [ and ]
    escapeTitleText: function (text) {
        return text.replace(/(\[|\])/g, '\\$1');
    },
    escapeLinkUrl: function (url) {
        url = url.replace(/\(/g, '%28');
        url = url.replace(/\)/g, '%29');
        url = url.replace(/ /g, '%20');
        return url;
    },
    escapeTableCell: function (text) {
        // Disable HTML code
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        // Table cells can't contain new lines so replace with <br/>
        text = text.replace(/\n/g, '<br/>');
        // "|" is a reserved characters that should be escaped
        text = text.replace(/\|/g, '\\|');
        return text;
    },
    escapeInlineCode: function (text) {
        // https://github.com/github/markup/issues/363#issuecomment-55499909
        return text.replace(/`/g, '``');
    },
    unescapeLinkUrl: function (url) {
        url = url.replace(/%28/g, '(');
        url = url.replace(/%29/g, ')');
        url = url.replace(/%20/g, ' ');
        return url;
    },
    prependBaseUrl: function (md, baseUrl) {
        // eslint-disable-next-line no-useless-escape
        return md.replace(/(\]\()([^\s\)]+)(.*?\))/g, function (_match, before, url, after) {
            return before + urlUtils.prependBaseUrl(url, baseUrl) + after;
        });
    },
    // Returns the **encoded** URLs, so to be useful they should be decoded again before use.
    extractFileUrls: function (md, onlyImage) {
        if (onlyImage === void 0) { onlyImage = false; }
        var markdownIt = new MarkdownIt();
        markdownIt.validateLink = renderer_1.validateLinks; // Necessary to support file:/// links
        var env = {};
        var tokens = markdownIt.parse(md, env);
        var output = [];
        var searchUrls = function (tokens) {
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                if ((onlyImage === true && token.type === 'image') || (onlyImage === false && (token.type === 'image' || token.type === 'link_open'))) {
                    for (var j = 0; j < token.attrs.length; j++) {
                        var a = token.attrs[j];
                        if ((a[0] === 'src' || a[0] === 'href') && a.length >= 2 && a[1]) {
                            output.push(a[1]);
                        }
                    }
                }
                if (token.children && token.children.length) {
                    searchUrls(token.children);
                }
            }
        };
        searchUrls(tokens);
        return output;
    },
    extractImageUrls: function (md) {
        return markdownUtils.extractFileUrls(md, true);
    },
    // The match results has 5 items
    // Full match array is
    // [Full match, whitespace, list token, ol line number, whitespace following token]
    olLineNumber: function (line) {
        var match = line.match(listRegex);
        return match ? Number(match[3]) : 0;
    },
    extractListToken: function (line) {
        var match = line.match(listRegex);
        return match ? match[2] : '';
    },
    isListItem: function (line) {
        return listRegex.test(line);
    },
    isEmptyListItem: function (line) {
        return emptyListRegex.test(line);
    },
    createMarkdownTable: function (headers, rows) {
        var output = [];
        var minCellWidth = 5;
        var headersMd = [];
        var lineMd = [];
        for (var i = 0; i < headers.length; i++) {
            var h = headers[i];
            headersMd.push(stringPadding(h.label, minCellWidth, ' ', stringPadding.RIGHT));
            var justify = h.justify ? h.justify : MarkdownTableJustify.Left;
            if (justify === MarkdownTableJustify.Left) {
                lineMd.push('-----');
            }
            else if (justify === MarkdownTableJustify.Center) {
                lineMd.push(':---:');
            }
            else {
                lineMd.push('----:');
            }
        }
        output.push("| " + headersMd.join(' | ') + " |");
        output.push("| " + lineMd.join(' | ') + " |");
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var rowMd = [];
            for (var j = 0; j < headers.length; j++) {
                var h = headers[j];
                var value = (h.filter ? h.filter(row[h.name]) : row[h.name]) || '';
                var valueMd = h.disableEscape ? value : markdownUtils.escapeTableCell(value);
                rowMd.push(stringPadding(valueMd, minCellWidth, ' ', stringPadding.RIGHT));
            }
            output.push("| " + rowMd.join(' | ') + " |");
        }
        return output.join('\n');
    },
    countTableColumns: function (line) {
        if (!line)
            return 0;
        var trimmed = line.trim();
        var pipes = (line.match(/\|/g) || []).length;
        if (trimmed[0] === '|') {
            pipes -= 1;
        }
        if (trimmed[trimmed.length - 1] === '|') {
            pipes -= 1;
        }
        return pipes + 1;
    },
    matchingTableDivider: function (header, divider) {
        if (!header || !divider)
            return false;
        var invalidChars = divider.match(/[^\s\-:|]/g);
        if (invalidChars) {
            return false;
        }
        var columns = markdownUtils.countTableColumns(header);
        var cols = markdownUtils.countTableColumns(divider);
        return cols > 0 && (cols >= columns);
    },
    titleFromBody: function (body) {
        if (!body)
            return '';
        var mdLinkRegex = /!?\[([^\]]+?)\]\(.+?\)/g;
        var emptyMdLinkRegex = /!?\[\]\((.+?)\)/g;
        var filterRegex = /^[# \n\t*`-]*/;
        var lines = body.trim().split('\n');
        var title = lines[0].trim();
        return title.replace(filterRegex, '').replace(mdLinkRegex, '$1').replace(emptyMdLinkRegex, '$1').substring(0, 80);
    }
};
exports.__esModule = true;
exports["default"] = markdownUtils;
