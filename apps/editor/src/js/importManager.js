/**
 * @fileoverview Implement Module for managing import external data such as image
 * @author Sungho Kim(sungho-kim@nhnent.com) FE Development Team/NHN Ent.
 */

'use strict';

var excelTableParser = require('./excelTableParser');

var util = tui.util;

var FIND_EXCEL_DATA = /.+(\t.+?){1,}[\r\n]/;
/**
 * ImportManager
 * @exports ImportManager
 * @constructor
 * @class
 * @param {EventManager} eventManager eventManager
 */
function ImportManager(eventManager) {
    this.eventManager = eventManager;

    this._initDropEvent();
    this._initPasteEvent();
    this._initDefaultImageImporter();
}

ImportManager.prototype._initDropEvent = function() {
    var self = this;

    this.eventManager.listen('drop', function(ev) {
        var items = ev.data.dataTransfer && ev.data.dataTransfer.files;
        self._processBlobItems(items, ev.data);
    });
};

ImportManager.prototype._initPasteEvent = function() {
    var self = this;

    this.eventManager.listen('paste', function(ev) {
        self._processClipboard(ev.data);
    });
};

ImportManager.prototype._initDefaultImageImporter = function() {
    this.eventManager.listen('addImageBlobHook', function(blob, callback) {
        var reader = new FileReader();

        reader.onload = function(event) {
            callback(event.target.result);
        };

        reader.readAsDataURL(blob);
    });
};

ImportManager.prototype._emitAddImageBlobHook = function(item) {
    var self = this,
        blob = item.name ? item : item.getAsFile(); //Blob or File

    this.eventManager.emit('addImageBlobHook', blob, function(url) {
        self.eventManager.emit('command', 'AddImage', {imageUrl: url, altText: blob.name || 'image'});
    });
};

ImportManager.prototype._addExcelTable = function(content) {
    var tableInfo = excelTableParser(content),
        headRowLength = 1;

    this.eventManager.emit('command', 'Table', tableInfo.col, tableInfo.row + headRowLength, tableInfo.data);
};

ImportManager.prototype._processClipboard = function(evData) {
    var blobItems,
        cbData = evData.clipboardData,
        types = cbData.types;

    blobItems = cbData && cbData.items;

    if (blobItems && types.length === 1 && util.inArray('Files', types) !== -1) {
        this._processBlobItems(blobItems, evData);
    } else {
        this._precessDataTransfer(cbData, evData);
    }
};

ImportManager.prototype._processBlobItems = function(items, evData) {
    var self = this;

    if (items) {
        util.forEachArray(items, function(item) {
            if (item.type.indexOf('image') !== -1) {
                evData.preventDefault();
                evData.codemirrorIgnore = true;
                self._emitAddImageBlobHook(item);
                return false;
            }
        });
    }
};

ImportManager.prototype._precessDataTransfer = function(cbData, evData) {
    var types = util.toArray(cbData.types),
        content;

    if (util.inArray('text/rtf', types) !== -1 && util.inArray('text/plain', types) !== -1) {
        content = cbData.getData('text/plain');

        if (FIND_EXCEL_DATA.test(content)) {
            evData.preventDefault();
            evData.codemirrorIgnore = true;
            this._addExcelTable(content);
        }
    }
};

module.exports = ImportManager;
