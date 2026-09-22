/**
 * Markdown & Content Pipeline
 * Renders GitHub Flavored Markdown with interactive checklists, hashtags, and secure media links.
 */

class MarkdownPipeline {
  constructor() {
    this._initMarked();
  }

  _initMarked() {
    if (typeof marked !== 'undefined' && marked.setOptions) {
      marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false
      });
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Transforms raw text into sanitized HTML
   */
  render(text, itemType = null, itemId = null) {
    if (!text || typeof text !== 'string') return '';

    let rawHtml = '';
    try {
      if (typeof marked !== 'undefined' && marked.parse) {
        rawHtml = marked.parse(text);
      } else {
        rawHtml = this.escapeHtml(text);
      }
    } catch (e) {
      console.error('[MarkdownPipeline] Parse error:', e);
      rawHtml = this.escapeHtml(text);
    }

    // Sanitize base output with DOMPurify
    let clean = rawHtml;
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
      clean = DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'data-url', 'data-action', 'data-item-id', 'data-item-type', 'data-check-idx'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form']
      });
    }

    // 1. Checklist checkboxes transform
    if (itemType && itemId !== null) {
      let checkIdx = 0;
      clean = clean.replace(/<input disabled="" type="checkbox"( checked="")?>/gi, (match, checked) => {
        const idx = checkIdx++;
        const isChecked = !!checked;
        return `<label class="md-check"><input type="checkbox" ${isChecked ? 'checked' : ''} data-item-type="${itemType}" data-item-id="${itemId}" data-check-idx="${idx}" class="md-checklist-input" /></label>`;
      });
    }

    // 2. Universal Hashtags (#tag)
    clean = clean.replace(/(^|\s)#([a-zA-Z0-9_\-]+)/g, '$1<span class="hashtag" data-tag="$2">#$2</span>');

    // 3. Convert external links to safe clickable anchors
    clean = clean.replace(/<a href="([^"]+)".*?>(.*?)<\/a>/gi, (match, href, content) => {
      return `<a class="md-link" data-url="${href}" href="javascript:void(0);" title="${href}">${content}</a>`;
    });

    return clean;
  }

  /**
   * Helper to format image paths into secure doingit-media:// protocol URIs
   */
  formatMediaUri(filePath) {
    if (!filePath) return '';
    if (filePath.startsWith('doingit-media://')) return filePath;
    // Replace backslashes with forward slashes and encode
    const normalized = filePath.replace(/\\/g, '/');
    return `doingit-media://${encodeURIComponent(filePath)}`;
  }
}

window.markdownPipeline = new MarkdownPipeline();
