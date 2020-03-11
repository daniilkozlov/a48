/**
 * @fileoverview Implements markdown preview
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import on from 'tui-code-snippet/domEvent/on';
import off from 'tui-code-snippet/domEvent/off';

import Preview from './preview';
import MarkdownRenderer from './markdownRenderer';
import codeBlockManager from './codeBlockManager';
import domUtils from './utils/dom';
import { findAdjacentElementToScrollTop } from './scroll/helper';
import { removeOffsetInfoByNode } from './scroll/cache/offsetInfo';

const htmlRenderer = new MarkdownRenderer({ nodeId: true });

/**
 * Class Markdown Preview
 * @param {HTMLElement} el - base element
 * @param {EventManager} eventManager - event manager
 * @param {Convertor} convertor - convertor
 * @param {boolean} isViewer - true for view only mode
 * @param {Number} delayTime - lazyRunner delay time
 * @ignore
 */
class MarkdownPreview extends Preview {
  constructor(el, eventManager, convertor, isViewer, delayTime) {
    super(el, eventManager, convertor, isViewer, delayTime);
    this._initEvent();
    this.lazyRunner.registerLazyRunFunction(
      'invokeCodeBlock',
      this._invokeCodeBlockPlugins,
      this.delayCodeBlockTime,
      this
    );
  }

  /**
   * Initialize event
   * @private
   */
  _initEvent() {
    this.eventManager.listen('contentChangedFromMarkdown', this.update.bind(this));
    this.eventManager.listen('previewNeedsRefresh', value => {
      this.refresh(value || '');
    });

    on(this.el, 'scroll', event => {
      this.eventManager.emit('scroll', {
        source: 'preview',
        data: findAdjacentElementToScrollTop(event.target.scrollTop, this._previewContent)
      });
    });
  }

  _invokeCodeBlockPlugins(codeBlockNodes) {
    const contentEl = this._previewContent;

    codeBlockNodes.forEach(node => {
      const codeEl = contentEl.querySelector(`[data-nodeid="${node.id}"] > code`);

      if (codeEl) {
        const lang = codeEl.getAttribute('data-language');
        const html = codeBlockManager.createCodeBlockHtml(lang, codeEl.textContent);

        codeEl.innerHTML = html;
      }
    });
  }

  update(changed) {
    const { nodes, removedNodeRange } = changed;
    const contentEl = this._previewContent;
    const newHtml = this.eventManager.emitReduce(
      'convertorAfterMarkdownToHtmlConverted',
      nodes.map(node => htmlRenderer.render(node)).join('')
    );

    if (!removedNodeRange) {
      contentEl.insertAdjacentHTML('afterbegin', newHtml);
    } else {
      const [startNodeId, endNodeId] = removedNodeRange;
      const startEl = contentEl.querySelector(`[data-nodeid="${startNodeId}"]`);
      const endEl = contentEl.querySelector(`[data-nodeid="${endNodeId}"]`);

      if (startEl) {
        startEl.insertAdjacentHTML('beforebegin', newHtml);
        let el = startEl;

        while (el !== endEl) {
          const nextEl = el.nextElementSibling;

          el.parentNode.removeChild(el);
          removeOffsetInfoByNode(el);
          el = nextEl;
        }
        if (el.parentNode) {
          domUtils.remove(el);
          removeOffsetInfoByNode(el);
        }
      }
    }
    this.eventManager.emit('previewRenderAfter', this);

    const codeBlockNodes = nodes.filter(node => node.type === 'codeBlock');

    if (codeBlockNodes.length > 0) {
      this.lazyRunner.run('invokeCodeBlock', codeBlockNodes);
    }
  }

  /**
   * render
   * @param {string} html - html string to render
   * @override
   */
  render(html) {
    super.render(html);

    this.eventManager.emit('previewRenderAfter', this);
  }

  remove() {
    off(this.el, 'scroll');
    this.el = null;
  }
}

export default MarkdownPreview;
