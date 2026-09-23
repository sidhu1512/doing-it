/**
 * NotesView Component — Craft & Obsidian Inspired Notes & Scratchpad
 * Instant auto-saving scratchpad, filterable markdown cards, live checklists, image attachments, and tag filtering.
 */

class NotesViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.activeTag = 'all';

    this.render();
    this.bindEvents();
    this.renderNotesFeed();

    this.store.subscribe('notes', () => this.renderNotesFeed());
    this.store.subscribe('scratchpad', (val) => {
      const sp = this.container.querySelector('#scratchpad-area');
      if (sp && sp.value !== val) sp.value = val;
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="view-container">
        <!-- Scratchpad Card -->
        <div class="scratchpad-card">
          <div class="scratchpad-header">
            <span>Instant Scratchpad</span>
            <span style="font-size:10px; color:var(--text-muted);">Auto-saved</span>
          </div>
          <textarea id="scratchpad-area" class="scratchpad-textarea" placeholder="Jot quick thoughts, links, or code here..."></textarea>
        </div>

        <!-- Add Note Input Bar -->
        <div class="task-input-card">
          <div class="task-input-row">
            <input type="text" id="note-quick-input" class="task-text-input" placeholder="Create note or markdown card... (#tag, - [ ] checklist)" />
            <button class="task-action-btn" id="btn-create-note" title="Save Note (Enter)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Save</span>
            </button>
          </div>
        </div>

        <!-- Tag Filters Bar -->
        <div class="notes-filter-bar" id="notes-tag-bar"></div>

        <!-- Notes Feed -->
        <div id="notes-feed" style="display:flex; flex-direction:column; gap:10px;"></div>
      </div>
    `;
  }

  bindEvents() {
    const scratchpad = this.container.querySelector('#scratchpad-area');
    scratchpad.value = this.store.get('scratchpad') || '';

    scratchpad.addEventListener('input', () => {
      this.store.saveScratchpad(scratchpad.value);
    });

    const noteInput = this.container.querySelector('#note-quick-input');
    const btnCreate = this.container.querySelector('#btn-create-note');

    const handleCreate = () => {
      const val = noteInput.value.trim();
      if (!val) return;
      this.store.addNote({ text: val });
      noteInput.value = '';
    };

    noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCreate();
    });
    btnCreate.addEventListener('click', handleCreate);

    // Delegate Note Card Actions (Pin, Delete, Copy, Checklist Check)
    const feed = this.container.querySelector('#notes-feed');
    feed.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.btn-note-copy');
      if (copyBtn) {
        const id = Number(copyBtn.getAttribute('data-id'));
        const note = this.store.get('notes').find(n => n.id === id);
        if (note && navigator.clipboard) {
          await navigator.clipboard.writeText(note.text);
          if (window.toast) window.toast.show('Copied to clipboard', 'success');
        }
        return;
      }

      const pinBtn = e.target.closest('.btn-note-pin');
      if (pinBtn) {
        const id = Number(pinBtn.getAttribute('data-id'));
        this.store.toggleNotePin(id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-note-delete');
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        this.store.deleteNote(id);
        return;
      }

      // Checklist Toggle Inside Rendered Markdown
      const checkInput = e.target.closest('.md-checklist-input');
      if (checkInput) {
        const id = Number(checkInput.getAttribute('data-item-id'));
        const idx = Number(checkInput.getAttribute('data-check-idx'));
        this.toggleNoteChecklist(id, idx, checkInput.checked);
        return;
      }

      // Hashtag click in markdown
      const tagSpan = e.target.closest('.hashtag');
      if (tagSpan) {
        const tag = tagSpan.getAttribute('data-tag');
        if (tag) {
          this.activeTag = tag.toLowerCase();
          this.renderNotesFeed();
        }
        return;
      }

      // External link click in markdown
      const mdLink = e.target.closest('.md-link');
      if (mdLink) {
        e.preventDefault();
        e.stopPropagation();
        const url = mdLink.getAttribute('data-url');
        if (url && window.api && window.api.openExternalUrl) {
          window.api.openExternalUrl(url);
        }
        return;
      }

      // Rich link card click
      const richLinkCard = e.target.closest('.rich-link-card');
      if (richLinkCard) {
        e.preventDefault();
        e.stopPropagation();
        const url = richLinkCard.getAttribute('data-url');
        if (url && window.api && window.api.openExternalUrl) {
          window.api.openExternalUrl(url);
        }
        return;
      }
    });

    // Image paste listener
    this.container.addEventListener('paste', async (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      let savedImagePath = null;
      if (e.clipboardData && e.clipboardData.items) {
        for (const item of e.clipboardData.items) {
          if (item.type.indexOf('image/') === 0) {
            const file = item.getAsFile();
            if (file && window.api && window.api.saveBufferImage) {
              try {
                const arrayBuffer = await file.arrayBuffer();
                savedImagePath = await window.api.saveBufferImage(arrayBuffer);
                break;
              } catch (err) {
                console.error('[NotesView] Image paste error:', err);
              }
            }
          }
        }
      }

      if (!savedImagePath && window.api && window.api.saveClipboardImage) {
        if (!isInput || !e.clipboardData.getData('text/plain')) {
          try {
            savedImagePath = await window.api.saveClipboardImage();
          } catch (err) {}
        }
      }

      if (savedImagePath) {
        e.preventDefault();
        const caption = isInput && activeEl.value ? activeEl.value.trim() : 'Pasted image';
        if (isInput && activeEl.id === 'note-quick-input') activeEl.value = '';
        this.store.addNote({
          text: caption,
          image: savedImagePath,
          category: this.activeTag !== 'all' ? this.activeTag : 'personal'
        });
        if (window.toast) window.toast.show('Image attached to note', 'success');
      }
    });

    // Drag & drop image files onto feed
    const dropZone = this.container.querySelector('#notes-feed');
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dropZone) dropZone.classList.add('drag-over');
    });
    this.container.addEventListener('dragleave', (e) => {
      if (!this.container.contains(e.relatedTarget) && dropZone) {
        dropZone.classList.remove('drag-over');
      }
    });
    this.container.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (dropZone) dropZone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (const file of e.dataTransfer.files) {
          if (file.type.startsWith('image/')) {
            try {
              const arrayBuffer = await file.arrayBuffer();
              if (window.api && window.api.saveBufferImage) {
                const savedPath = await window.api.saveBufferImage(arrayBuffer);
                if (savedPath) {
                  this.store.addNote({
                    text: file.name.replace(/\.[^/.]+$/, '') || 'Attached image',
                    image: savedPath,
                    category: this.activeTag !== 'all' ? this.activeTag : 'personal'
                  });
                  if (window.toast) window.toast.show('Image note created', 'success');
                }
              }
            } catch (err) {
              console.error('[NotesView] Drop file error:', err);
            }
          }
        }
      }
    });

    // Delegate Tag Filter Bar
    const tagBar = this.container.querySelector('#notes-tag-bar');
    tagBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (pill) {
        this.activeTag = pill.getAttribute('data-tag');
        this.renderNotesFeed();
      }
    });
  }

  toggleNoteChecklist(noteId, checkIndex, isChecked) {
    const note = this.store.get('notes').find(n => n.id === noteId);
    if (!note) return;

    let count = 0;
    const regex = /-\s*\[([ xX])\]/g;
    note.text = note.text.replace(regex, (match, state) => {
      if (count === checkIndex) {
        count++;
        return isChecked ? '- [x]' : '- [ ]';
      }
      count++;
      return match;
    });

    if (window.audioEngine) window.audioEngine.playTaskPop();
    this.store.persistNotes();
  }

  renderNotesFeed() {
    const feed = this.container.querySelector('#notes-feed');
    const tagBar = this.container.querySelector('#notes-tag-bar');
    const allNotes = this.store.get('notes');

    // Extract all unique tags
    const tagsSet = new Set(['all']);
    allNotes.forEach(n => {
      const matches = n.text.match(/#([a-zA-Z0-9_\-]+)/g);
      if (matches) {
        matches.forEach(m => tagsSet.add(m.replace('#', '').toLowerCase()));
      }
    });

    // Render tag bar
    tagBar.innerHTML = Array.from(tagsSet).map(tag => `
      <button class="filter-pill ${this.activeTag === tag ? 'active' : ''}" data-tag="${tag}">
        ${tag === 'all' ? 'All Notes' : '#' + tag}
      </button>
    `).join('');

    // Filter notes
    let filtered = allNotes;
    if (this.activeTag !== 'all') {
      const tagRegex = new RegExp(`#${this.activeTag}\\b`, 'i');
      filtered = allNotes.filter(n => tagRegex.test(n.text));
    }

    // Sort pinned to top
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (filtered.length === 0) {
      feed.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 40px 10px; color: var(--text-muted);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="margin-bottom:8px; opacity:0.6;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
          <div style="font-weight: 500; font-size: 13px; color: var(--text-secondary);">No notes found</div>
          <div style="font-size: 11.5px; margin-top: 2px;">Capture a note or select another tag</div>
        </div>
      `;
      return;
    }

    feed.innerHTML = filtered.map(note => {
      const parsedContent = window.markdownPipeline
        ? window.markdownPipeline.render(note.text, 'note', note.id)
        : this.escapeHtml(note.text);

      const imageHtml = note.image
        ? `<img src="${window.markdownPipeline ? window.markdownPipeline.formatMediaUri(note.image) : note.image}" class="note-image-thumb" />`
        : '';

      const dateStr = new Date(note.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return `
        <div class="note-card ${note.pinned ? 'pinned' : ''}">
          <div class="note-header">
            <span>${dateStr}</span>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="task-action-btn btn-note-copy" data-id="${note.id}" title="Copy to clipboard">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button class="task-action-btn btn-note-pin" data-id="${note.id}" title="${note.pinned ? 'Unpin' : 'Pin to top'}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M16 2l6 6-4 4-2-2-4 4-1 6-2-2-2 2-2-2 2-2-2-2 6-1 4-4-2-2 4-4z"/></svg>
              </button>
              <button class="task-action-btn btn-note-delete" data-id="${note.id}" title="Delete note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="note-body">${parsedContent}</div>
          ${imageHtml}
        </div>
      `;
    }).join('');

    this.hydrateRichLinks();
  }

  hydrateRichLinks() {
    if (!window.api || !window.api.fetchLinkPreview) return;
    const feed = this.container.querySelector('#notes-feed');
    if (!feed) return;

    if (!this.linkPreviewCache) this.linkPreviewCache = new Map();

    const links = feed.querySelectorAll('.md-link');
    links.forEach(async (link) => {
      const url = link.getAttribute('data-url');
      if (!url || !/^https?:\/\//i.test(url)) return;

      const text = link.textContent.trim();
      if (text !== url && !url.includes(text)) return;
      if (link.getAttribute('data-hydrated')) return;
      link.setAttribute('data-hydrated', 'true');

      try {
        let preview = this.linkPreviewCache.get(url);
        if (!preview) {
          preview = await window.api.fetchLinkPreview(url);
          if (preview) {
            this.linkPreviewCache.set(url, preview);
          }
        }

        if (preview && preview.title) {
          let host = '';
          try { host = new URL(url).hostname; } catch (e) {}

          const card = document.createElement('div');
          card.className = 'rich-link-card';
          card.setAttribute('data-url', url);
          card.title = url;

          const imgHtml = preview.image
            ? `<div class="rich-link-img" style="background-image: url('${this.escapeHtml(preview.image)}');"></div>`
            : '';

          const desc = preview.description
            ? `<div class="rich-link-desc">${this.escapeHtml(preview.description.length > 90 ? preview.description.substring(0, 90) + '...' : preview.description)}</div>`
            : '';

          card.innerHTML = `
            ${imgHtml}
            <div class="rich-link-content">
              <div class="rich-link-title">${this.escapeHtml(preview.title)}</div>
              ${desc}
              <div class="rich-link-host">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                <span>${this.escapeHtml(host || url)}</span>
              </div>
            </div>
          `;

          if (link.parentNode) {
            link.parentNode.replaceChild(card, link);
          }
        }
      } catch (err) {}
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.NotesViewComponent = NotesViewComponent;
