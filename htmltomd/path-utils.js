/* eslint no-useless-escape: 0*/
"use strict";
var _ = require('./locale')._;
function dirname(path) {
    if (!path)
        throw new Error('Path is empty');
    var s = path.split(/\/|\\/);
    s.pop();
    return s.join('/');
}
exports.dirname = dirname;
function basename(path) {
    if (!path)
        throw new Error('Path is empty');
    var s = path.split(/\/|\\/);
    return s[s.length - 1];
}
exports.basename = basename;
function filename(path, includeDir) {
    if (includeDir === void 0) { includeDir = false; }
    if (!path)
        throw new Error('Path is empty');
    var output = includeDir ? path : basename(path);
    if (output.indexOf('.') < 0)
        return output;
    var splitted = output.split('.');
    splitted.pop();
    return splitted.join('.');
}
exports.filename = filename;
function fileExtension(path) {
    if (!path)
        throw new Error('Path is empty');
    var output = path.split('.');
    if (output.length <= 1)
        return '';
    return output[output.length - 1];
}
exports.fileExtension = fileExtension;
function isHidden(path) {
    var b = basename(path);
    if (!b.length)
        throw new Error("Path empty or not a valid path: " + path);
    return b[0] === '.';
}
exports.isHidden = isHidden;
function safeFileExtension(e, maxLength) {
    if (maxLength === void 0) { maxLength = null; }
    // In theory the file extension can have any length but in practice Joplin
    // expects a fixed length, so we limit it to 20 which should cover most cases.
    // Note that it means that a file extension longer than 20 will break
    // external editing (since the extension would be truncated).
    // https://discourse.joplinapp.org/t/troubles-with-webarchive-files-on-ios/10447
    if (maxLength === null)
        maxLength = 20;
    if (!e || !e.replace)
        return '';
    return e.replace(/[^a-zA-Z0-9]/g, '').substr(0, maxLength);
}
exports.safeFileExtension = safeFileExtension;
function safeFilename(e, maxLength, allowSpaces) {
    if (maxLength === void 0) { maxLength = null; }
    if (allowSpaces === void 0) { allowSpaces = false; }
    if (maxLength === null)
        maxLength = 32;
    if (!e || !e.replace)
        return '';
    var regex = allowSpaces ? /[^a-zA-Z0-9\-_\(\)\. ]/g : /[^a-zA-Z0-9\-_\(\)\.]/g;
    var output = e.replace(regex, '_');
    return output.substr(0, maxLength);
}
exports.safeFilename = safeFilename;
var friendlySafeFilename_blackListChars = '/<>:\'"\\|?*#';
for (var i = 0; i < 32; i++) {
    friendlySafeFilename_blackListChars += String.fromCharCode(i);
}
var friendlySafeFilename_blackListNames = ['.', '..', 'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
function friendlySafeFilename(e, maxLength) {
    if (maxLength === void 0) { maxLength = null; }
    // Although Windows supports paths up to 255 characters, but that includes the filename and its
    // parent directory path. Also there's generally no good reason for dir or file names
    // to be so long, so keep it at 50, which should prevent various errors.
    if (maxLength === null)
        maxLength = 50;
    if (!e || !e.replace)
        return _('Untitled');
    var output = '';
    for (var i = 0; i < e.length; i++) {
        var c = e[i];
        if (friendlySafeFilename_blackListChars.indexOf(c) >= 0) {
            output += '_';
        }
        else {
            output += c;
        }
    }
    if (output.length <= 4) {
        if (friendlySafeFilename_blackListNames.indexOf(output.toUpperCase()) >= 0) {
            output = '___';
        }
    }
    while (output.length) {
        var c = output[output.length - 1];
        if (c === ' ' || c === '.') {
            output = output.substr(0, output.length - 1);
        }
        else {
            break;
        }
    }
    while (output.length) {
        var c = output[0];
        if (c === ' ') {
            output = output.substr(1, output.length - 1);
        }
        else {
            break;
        }
    }
    if (!output)
        return _('Untitled');
    return output.substr(0, maxLength);
}
exports.friendlySafeFilename = friendlySafeFilename;
function toFileProtocolPath(filePathEncode, os) {
    if (os === void 0) { os = null; }
    if (os === null)
        os = process.platform;
    if (os === 'win32') {
        filePathEncode = filePathEncode.replace(/\\/g, '/'); // replace backslash in windows pathname with slash e.g. c:\temp to c:/temp
        filePathEncode = "/" + filePathEncode; // put slash in front of path to comply with windows fileURL syntax
    }
    filePathEncode = encodeURI(filePathEncode);
    filePathEncode = filePathEncode.replace(/\+/g, '%2B'); // escape '+' with unicode
    return "file://" + filePathEncode.replace(/\'/g, '%27'); // escape '(single quote) with unicode, to prevent crashing the html view
}
exports.toFileProtocolPath = toFileProtocolPath;
function toSystemSlashes(path, os) {
    if (os === void 0) { os = null; }
    if (os === null)
        os = process.platform;
    if (os === 'win32')
        return path.replace(/\//g, '\\');
    return path.replace(/\\/g, '/');
}
exports.toSystemSlashes = toSystemSlashes;
function rtrimSlashes(path) {
    return path.replace(/[\/\\]+$/, '');
}
exports.rtrimSlashes = rtrimSlashes;
function ltrimSlashes(path) {
    return path.replace(/^\/+/, '');
}
exports.ltrimSlashes = ltrimSlashes;
function trimSlashes(path) {
    return ltrimSlashes(rtrimSlashes(path));
}
exports.trimSlashes = trimSlashes;
function quotePath(path) {
    if (!path)
        return '';
    if (path.indexOf('"') < 0 && path.indexOf(' ') < 0)
        return path;
    path = path.replace(/"/, '\\"');
    return "\"" + path + "\"";
}
exports.quotePath = quotePath;
function unquotePath(path) {
    if (!path.length)
        return '';
    if (path.length && path[0] === '"') {
        path = path.substr(1, path.length - 2);
    }
    path = path.replace(/\\"/, '"');
    return path;
}
exports.unquotePath = unquotePath;
function extractExecutablePath(cmd) {
    if (!cmd.length)
        return '';
    var quoteType = ['"', '\''].indexOf(cmd[0]) >= 0 ? cmd[0] : '';
    var output = '';
    for (var i = 0; i < cmd.length; i++) {
        var c = cmd[i];
        if (quoteType) {
            if (i > 0 && c === quoteType) {
                output += c;
                break;
            }
        }
        else {
            if (c === ' ')
                break;
        }
        output += c;
    }
    return output;
}
exports.extractExecutablePath = extractExecutablePath;
