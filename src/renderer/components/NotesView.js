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
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.NotesViewComponent = NotesViewComponent;
