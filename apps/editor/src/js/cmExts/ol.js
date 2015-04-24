'use strict';

var MarkdownCommand = require('../markdownCommand');

/**
 * OL
 * @exports OL
 * @extends {MarkdownCommand}
 * @constructor
 * @class
 */
var OL = MarkdownCommand.extend(/** @lends AddImage.prototype */{
    init: function OL() {
        MarkdownCommand.call(this, 'OL');
    },
    exec: function() {
        var replaceText,
            range,
            from,
            to;

        if (!this.isAvailable()) {
            return this.getPass();
        }

        range = this.getCurrentRange();

        from = {
            line: range.from.line,
            ch: range.from.ch
        };

        to = {
            line: range.to.line,
            ch: range.to.ch
        };

        replaceText = '1. ';

        this.doc.replaceRange(replaceText, from, to);

        this.cm.focus();
    }
});

module.exports = new OL();
