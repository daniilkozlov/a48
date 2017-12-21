/**
 * @fileoverview Implements WysiwygCommand
 * @author Sungho Kim(sungho-kim@nhnent.com) FE Development Team/NHN Ent.
 * @author Junghwan Park(junghwan.park@nhnent.com) FE Development Team/NHN Ent.
 */
import $ from 'jquery';

import CommandManager from '../commandManager';

/**
 * RemoveTable
 * Remove selected table
 * @extends Command
 * @module wysiwygCommands/TableRemove
 * @ignore
 */
const TableRemove = CommandManager.command('wysiwyg', /** @lends RemoveTable */{
  name: 'RemoveTable',
  /**
   *  커맨드 핸들러
   *  @param {WysiwygEditor} wwe WYsiwygEditor instance
   */
  exec(wwe) {
    const sq = wwe.getEditor();
    const range = sq.getSelection().cloneRange();

    if (sq.hasFormat('TABLE')) {
      sq.saveUndoState(range);
      const $table = $(range.startContainer).closest('table');

      $table.remove();
    }

    wwe.focus();
  }
});

export default TableRemove;
