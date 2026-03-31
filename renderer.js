/* ═══════════════════════════════════════════════════════
   Doing It — Renderer v2.0
   Features: Notes, Tasks, Reminders, Pomodoro, Calendar
   ═══════════════════════════════════════════════════════ */

// ─── State ──────────────────────────────────────────────
let notes = [];
let todos = [];
let reminders = [];
let moods = {};
let pomodoroState = {
  sessions: 0,
  totalMinutes: 0,
  lastDate: null
};
let calYear, calMonth;
let activeTag = null;
let activeFilter = 'all';
let noteSearch = '';
let trash = []; // for undo delete
let undoTimeout = null;

// Local date helper — returns YYYY-MM-DD in local timezone (not UTC)
function localDateStr(d) {
  if (!d) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Unique ID counter (avoids Date.now() collisions)
let _idCounter = 0;
function nextId() {
  return Date.now() * 1000 + (++_idCounter);
}

// Pomodoro state
let pomoTimer = null;
let pomoRunning = false;
let pomoDuration = 30 * 60; // seconds
let pomoRemaining = 30 * 60;
let pomoSelectedMinutes = 30;
let pomoElapsedActiveSeconds = 0;

// ─── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  notes = await window.api.getNotes() || [];
  todos = await window.api.getTodos() || [];
  reminders = await window.api.getReminders?.() || [];
  moods = await window.api.getMoods?.() || {};
  pomodoroState = await window.api.getPomodoro?.() || { sessions: 0, totalMinutes: 0, lastDate: null };

  const today = localDateStr(now);
  
  // Midnight reset for daily habits
  let todosChanged = false;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);

  todos.forEach(t => {
    if (t.isHabit) {
      if (t.completed && t.lastCompletedDate && t.lastCompletedDate < today) {
        t.completed = false; // Reset checkbox for the new day
        todosChanged = true;
      } else if (!t.completed && t.lastCompletedDate && t.lastCompletedDate < yesterdayStr) {
        // Missed yesterday, reset streak
        if (t.streak > 0) {
          t.streak = 0;
          todosChanged = true;
        }
      }
    }
  });
  if (todosChanged) saveTodos();

  // Reset daily stats
  if (pomodoroState.lastDate !== today) {
    pomodoroState.sessions = 0;
    pomodoroState.totalMinutes = 0;
    pomodoroState.lastDate = today;
    savePomodoro();
  }

  // Prompt mood if not answered today
  if (!moods[today]) {
    document.getElementById('mood-overlay').style.display = 'flex';
  }

  initTabs();
  initNotes();
  initTodos();
  initReminders();
  initPomodoro();
  initCalendar();
  initMoods();
  initWindowControls();
  initKeyboardShortcuts();
  initSettings();
  initSmartTimer();
  initDataSync();
  initCommandPalette();
  initArrowNav();
  initEdgeDock();
  initCalendarSync();
  startReminderChecker();
});

// ─── TABS ───────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
      highlightedIndex = -1; // Reset arrow-key navigation index

      if (target === 'insights') {
        if (typeof renderInsights === 'function') renderInsights();
      }

      // Auto-clear search when switching tabs
      const searchInput = document.getElementById('note-search');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        noteSearch = '';
        renderNotes();
      }
    });
  });
}

// ─── WINDOW CONTROLS ────────────────────────────────────
function initWindowControls() {
  document.getElementById('btn-minimize').addEventListener('click', () => window.api.minimizeWindow());
  document.getElementById('btn-close').addEventListener('click', () => window.api.closeWindow());
  document.getElementById('btn-settings').addEventListener('click', () => openSettings());
}

// ─── KEYBOARD SHORTCUTS ─────────────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Skip if user is typing in an input/textarea
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'Escape') {
      // Close overlays first before minimizing
      if (paletteOpen) return; // Already handled by command palette
      if (document.getElementById('mood-overlay').style.display === 'flex') {
        document.getElementById('mood-overlay').style.display = 'none';
        return;
      }

      if (document.getElementById('reminder-overlay').style.display === 'flex') {
        closeReminderPopup();
        return;
      }
      window.api.minimizeWindow();
    }

    // Ctrl+1-5 for tabs
    if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const tabs = ['notes', 'todos', 'reminders', 'focus', 'calendar'];
      const idx = parseInt(e.key) - 1;
      const tab = document.querySelector(`[data-tab="${tabs[idx]}"]`);
      if (tab) tab.click();
    }
  });
}

// ─── TOAST (disabled) ───────────────────────────────────
function showToast() {}
function showUndoToast() {}

// ═══════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════
function initNotes() {
  const input = document.getElementById('note-input');
  const addBtn = document.getElementById('btn-add-note');
  const searchInput = document.getElementById('note-search');

  addBtn.addEventListener('click', () => addNote());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addNote(); });

  // Search
  searchInput.addEventListener('input', () => {
    noteSearch = searchInput.value.trim().toLowerCase();
    renderNotes();
  });

  renderNotes();
}

function addNote() {
  const input = document.getElementById('note-input');
  const text = input.value.trim();
  if (!text) return;

  // Extract hashtags from text for category
  const tags = text.match(/#(\w+)/g);
  let cat = tags ? tags[0].substring(1) : 'personal';

  notes.unshift({
    id: nextId(),
    text,
    category: cat,
    timestamp: new Date().toISOString()
  });

  input.value = '';
  saveNotes();
  renderNotes();
  showToast('Note added', 'success');
}

function deleteNote(id) {
  const noteIndex = notes.findIndex(n => n.id === id);
  if (noteIndex === -1) return;
  const note = { ...notes[noteIndex] }; // clone before removing
  const el = document.querySelector(`[data-note-id="${id}"]`);
  if (el) {
    el.classList.add('item-removing'); // Optional 0.2s CSS transition
    setTimeout(() => {
      notes = notes.filter(n => n.id !== id);
      saveNotes();
      el.remove();
      if (notes.length === 0) document.getElementById('notes-empty').classList.add('show');
      showUndoToast('Note deleted', () => {
        notes.unshift(note);
        saveNotes();
        renderNotes(); // Fallback to full render on undo because order matters heavily
      });
    }, 280);
  } else {
    // Element not in DOM (filtered by search/category), delete directly
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    if (notes.length === 0) document.getElementById('notes-empty').classList.add('show');
    showUndoToast('Note deleted', () => {
      notes.unshift(note);
      saveNotes();
      renderNotes();
    });
  }
}

function togglePin(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  saveNotes();
  
  const el = document.querySelector(`[data-note-id="${id}"]`);
  if (el) {
    const list = document.getElementById('notes-list');
    const svgIcon = el.querySelector('button[onclick^="togglePin"] svg');
    if (note.pinned) {
      el.classList.add('pinned');
      if (svgIcon) svgIcon.setAttribute('fill', 'currentColor');
      list.prepend(el); // Immediately bump to absolute top
    } else {
      el.classList.remove('pinned');
      if (svgIcon) svgIcon.setAttribute('fill', 'none');
      const lastPinned = list.querySelectorAll('.note-item.pinned');
      if (lastPinned.length > 0) {
        lastPinned[lastPinned.length - 1].after(el); // Snap below the last pinned note
      } else {
        list.prepend(el);
      }
    }
  }
  showToast(note.pinned ? 'Pinned' : 'Unpinned', 'info');
}

function startEditNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  const el = document.querySelector(`[data-note-id="${id}"]`);
  if (!el || el.classList.contains('editing')) return;
  el.classList.add('editing');
  const textEl = el.querySelector('.note-text');
  const original = note.text;
  textEl.innerHTML = `<textarea class="edit-textarea" rows="3">${escapeHtml(original)}</textarea>`;
  const ta = textEl.querySelector('textarea');
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  const save = () => {
    const newText = ta.value.trim();
    if (newText && newText !== original) {
      note.text = newText;
      saveNotes();
      showToast('Note updated', 'success');
    }
    renderNotes();
  };

  ta.addEventListener('blur', save);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') { renderNotes(); }
  });
}

function renderNotes() {
  const list = document.getElementById('notes-list');
  const empty = document.getElementById('notes-empty');

  let filtered = [...notes];

  // Apply hashtag filter
  if (activeTag) {
    filtered = filtered.filter(n => n.text && n.text.toLowerCase().includes('#' + activeTag.toLowerCase()));
  }

  // Apply search filter
  if (noteSearch) {
    filtered = filtered.filter(n => n.text.toLowerCase().includes(noteSearch));
  }

  // Sort: pinned first
  filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // Render tag bar
  renderTagBar('tag-bar', notes);

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.classList.add('show');
    return;
  }

  empty.classList.remove('show');
  list.innerHTML = filtered.map(note => {
    const time = formatRelativeTime(note.timestamp);
    const renderedText = renderMarkdown(note.text, 'note', note.id);
    const ctxPill = note.context ? `<span class="context-pill" title="${escapeHtml(note.context)}">${escapeHtml(note.context.length > 28 ? note.context.substring(0, 28) + '...' : note.context)}</span>` : '';
    const imgHtml = note.image ? `<div class="note-image"><img src="file:///${note.image.replace(/\\/g, '/')}" alt="Pasted image" /></div>` : '';
    return `
      <div class="note-item ${note.pinned ? 'pinned' : ''}" data-note-id="${note.id}" ondblclick="startEditNote(${note.id})">
        ${imgHtml}
        <div class="note-text md-content">${renderedText}</div>
        <div class="note-meta">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span class="note-time">${time}</span>
            ${ctxPill}
          </div>
          <button class="btn-delete" style="margin-right:4px;" onclick="togglePin(${note.id})" title="${note.pinned ? 'Unpin' : 'Pin'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18L6 21.5L7 14.5L2 9.5L9 8.5Z"/></svg>
          </button>
          <button class="btn-delete" onclick="deleteNote(${note.id})" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
  
  // Hydrate rich links after rendering
  setTimeout(() => hydrateRichLinks('notes-list'), 100);
}

async function saveNotes() { await window.api.saveNotes(notes); }

// ═══════════════════════════════════════════════════════
// TASKS / TODOS
// ═══════════════════════════════════════════════════════
function initTodos() {
  const input = document.getElementById('todo-input');
  const addBtn = document.getElementById('btn-add-todo');
  const taskOptions = document.getElementById('task-options');
  const taskOptionsWrapper = document.getElementById('task-options-wrapper');

  const updateTaskOptions = () => {
    if (input.value.trim().length > 0 || document.activeElement === input || taskOptions.contains(document.activeElement)) {
      taskOptionsWrapper.classList.add('active');
    } else {
      taskOptionsWrapper.classList.remove('active');
    }
  };

  input.addEventListener('focus', updateTaskOptions);
  input.addEventListener('blur', () => setTimeout(updateTaskOptions, 150));
  input.addEventListener('input', updateTaskOptions);
  taskOptions.addEventListener('focusin', updateTaskOptions);
  taskOptions.addEventListener('focusout', () => setTimeout(updateTaskOptions, 150));

  addBtn.addEventListener('click', () => addTodo());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

  // Priority buttons
  document.querySelectorAll('#priority-selector .pri-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#priority-selector .pri-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Filter buttons
  document.querySelectorAll('#todo-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#todo-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderTodos();
    });
  });

  document.getElementById('btn-clear-done').addEventListener('click', () => {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
    showToast('Completed tasks cleared', 'info');
  });

  // ─── Drag & Drop File Shortcuts ──────────────────────
  const todosPanel = document.getElementById('panel-todos');
  let dragCounter = 0;

  todosPanel.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  todosPanel.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (dragCounter === 1) todosPanel.classList.add('drag-over');
  });

  todosPanel.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      todosPanel.classList.remove('drag-over');
    }
  });

  todosPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    todosPanel.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Find the task element closest to the drop point
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    const taskEl = dropTarget?.closest('[data-todo-id]');

    if (taskEl) {
      // Attach files to existing task
      const todoId = parseInt(taskEl.getAttribute('data-todo-id'));
      const todo = todos.find(t => t.id === todoId);
      if (todo) {
        if (!todo.files) todo.files = [];
        const remaining = 4 - todo.files.length;
        if (remaining <= 0) {
          showToast('Max 4 shortcuts per task', 'info');
          return;
        }
        let added = 0;
        files.forEach(f => {
          if (added >= remaining) return;
          if (!todo.files.includes(f.path)) {
            todo.files.push(f.path);
            added++;
          }
        });
        if (added > 0) {
          saveTodos();
          renderTodos();
          showToast(`${added} file${added > 1 ? 's' : ''} attached`, 'success');
        }
        if (added < files.length) {
          showToast(`Max 4 shortcuts per task`, 'info');
        }
      }
    } else {
      // Create new tasks for each file
      files.forEach(f => {
        const fileName = f.name || f.path.split('\\').pop().split('/').pop();
        todos.unshift({
          id: nextId(),
          text: `Open: ${fileName}`,
          completed: false,
          priority: 'none',
          dueDate: null,
          files: [f.path],
          timestamp: new Date().toISOString()
        });
      });
      saveTodos();
      renderTodos();
      showToast(`${files.length} file task${files.length > 1 ? 's' : ''} created`, 'success');
    }
  });

  renderTodos();
}

async function addTodo() {
  const input = document.getElementById('todo-input');
  const rawText = input.value.trim();
  if (!rawText) return;

  let text = rawText;
  let dueDate = document.getElementById('todo-due-date').value || null;
  const activePri = document.querySelector('#priority-selector .pri-btn.active');
  const priority = activePri ? activePri.getAttribute('data-pri') : 'none';
  const isHabit = document.getElementById('todo-is-habit').checked;

  try {
    if (window.api.parseNLP && !dueDate) {
      const nlp = await Promise.race([
        window.api.parseNLP(rawText),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NLP timeout')), 500))
      ]);
      if (nlp && nlp.date) {
        dueDate = nlp.date.split('T')[0];
        text = nlp.text || text;
        showToast('Date auto-detected!', 'info');
      }
    }
  } catch(e) { /* NLP unavailable or timed out — continue without date detection */ }

  todos.unshift({
    id: nextId(),
    text,
    completed: false,
    priority,
    dueDate,
    isHabit,
    streak: isHabit ? 0 : undefined,
    lastCompletedDate: null,
    timestamp: new Date().toISOString()
  });

  input.value = '';
  document.getElementById('todo-due-date').value = '';
  document.getElementById('todo-is-habit').checked = false;
  // Reset priority to none
  document.querySelectorAll('#priority-selector .pri-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#priority-selector .pri-btn[data-pri="none"]').classList.add('active');

  saveTodos();
  renderTodos();
  if (!dueDate || !window.api.parseNLP) showToast('Task added', 'success');
  
  // Hide options explicitly after adding if not focused
  const wrapper = document.getElementById('task-options-wrapper');
  if (document.activeElement !== input) {
    wrapper.classList.remove('active');
  } else {
    // If focused, input is empty, hide if we only want it on typing
    if (input.value.trim() === '') wrapper.classList.remove('active');
  }
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    const today = localDateStr();

    if (todo.isHabit) {
      if (todo.completed) {
        todo.streak = (todo.streak || 0) + 1;
        todo.lastCompletedDate = today;
      } else {
        // Unchecked today
        if (todo.lastCompletedDate === today) {
          todo.streak = Math.max(0, (todo.streak || 1) - 1);
          todo.lastCompletedDate = null;
        }
      }
    }

    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  const todoIndex = todos.findIndex(t => t.id === id);
  if (todoIndex === -1) return;
  const todo = { ...todos[todoIndex], files: todos[todoIndex].files ? [...todos[todoIndex].files] : undefined }; // deep clone files array
  const el = document.querySelector(`[data-todo-id="${id}"]`);
  if (el) {
    el.classList.add('item-removing');
    setTimeout(() => {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      renderTodos();
      showUndoToast('Task deleted', () => {
        todos.unshift(todo);
        saveTodos();
        renderTodos();
      });
    }, 280);
  } else {
    // Element not in DOM (filtered), delete directly
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    showUndoToast('Task deleted', () => {
      todos.unshift(todo);
      saveTodos();
      renderTodos();
    });
  }
}

function startEditTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const el = document.querySelector(`[data-todo-id="${id}"]`);
  if (!el || el.classList.contains('editing')) return;
  el.classList.add('editing');
  const textEl = el.querySelector('.todo-text');
  const original = todo.text;
  textEl.innerHTML = `<input type="text" class="edit-input" value="${escapeHtml(original)}" />`;
  const inp = textEl.querySelector('input');
  inp.focus();
  inp.setSelectionRange(inp.value.length, inp.value.length);

  const save = () => {
    const newText = inp.value.trim();
    if (newText && newText !== original) {
      todo.text = newText;
      saveTodos();
      showToast('Task updated', 'success');
    }
    renderTodos();
  };

  inp.addEventListener('blur', save);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { renderTodos(); }
  });
}

function cycleTodoPriority(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const order = ['none', 'low', 'medium', 'high'];
  const idx = order.indexOf(todo.priority || 'none');
  todo.priority = order[(idx + 1) % order.length];
  saveTodos();
  renderTodos();
}

function renderTodos() {
  const list = document.getElementById('todos-list');
  const empty = document.getElementById('todos-empty');
  const footer = document.getElementById('todo-footer');
  const today = localDateStr();

  let filtered = todos;
  if (activeFilter === 'active') filtered = todos.filter(t => !t.completed);
  else if (activeFilter === 'completed') filtered = todos.filter(t => t.completed);
  else if (activeFilter === 'overdue') filtered = todos.filter(t => t.dueDate && t.dueDate < today && !t.completed);
  else if (activeFilter === 'my-day') filtered = todos.filter(t => t.dueDate === today && !t.completed);

  // Apply hashtag filter to todos
  if (activeTag) {
    filtered = filtered.filter(t => t.text && t.text.toLowerCase().includes('#' + activeTag.toLowerCase()));
  }

  // Sort: high priority first, then by due date
  const priOrder = { high: 0, medium: 1, low: 2, none: 3 };
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (priOrder[a.priority] || 3) - (priOrder[b.priority] || 3);
  });

  // Render tag bar and My Day
  renderTagBar('todo-tag-bar', todos);
  renderMyDay();

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.classList.add('show');
    footer.style.display = 'none';
    return;
  }

  empty.classList.remove('show');
  footer.style.display = 'flex';
  const active = todos.filter(t => !t.completed).length;
  document.getElementById('todo-count').textContent = `${active} active / ${todos.length} total`;

  list.innerHTML = filtered.map(todo => {
    let dueLabel = '';
    let dueClass = '';
    if (todo.dueDate) {
      if (todo.dueDate === today) { dueLabel = 'Today'; dueClass = 'today'; }
      else if (todo.dueDate < today) { dueLabel = formatDate(todo.dueDate) + ' (overdue)'; dueClass = 'overdue'; }
      else { dueLabel = formatDate(todo.dueDate); dueClass = 'upcoming'; }
    }

    const priDot = todo.priority && todo.priority !== 'none'
      ? `<span class="todo-pri-indicator" style="background:var(--pri-${todo.priority})" onclick="cycleTodoPriority(${todo.id})" title="Click to cycle priority"></span>`
      : `<span class="todo-pri-indicator todo-pri-none" onclick="cycleTodoPriority(${todo.id})" title="Click to set priority"></span>`;

    const isOverdue = todo.dueDate && todo.dueDate < today && !todo.completed;
    const todoRenderedText = renderMarkdown(todo.text, 'todo', todo.id);

    return `
      <div class="todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-todo-id="${todo.id}">
        <label class="todo-checkbox">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})" />
          <span class="checkmark"></span>
        </label>
        <div class="todo-content" ondblclick="startEditTodo(${todo.id})">
          <div class="todo-text md-content">${todoRenderedText}</div>
          <div class="todo-meta">
            ${priDot}
            <span class="todo-time">${formatRelativeTime(todo.timestamp)}</span>
            ${dueLabel ? `<span class="todo-due ${dueClass}">${dueLabel}</span>` : ''}
            ${todo.isHabit ? `<span class="streak-flame"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>${todo.streak || 0}</span>` : ''}
            ${todo.timeSpent ? `<span class="todo-due today">${todo.timeSpent}m focused</span>` : ''}
            ${todo.context ? `<span class="context-pill" title="${escapeHtml(todo.context)}">${escapeHtml(todo.context.length > 20 ? todo.context.substring(0, 20) + '...' : todo.context)}</span>` : ''}
          </div>
          ${todo.files && todo.files.length > 0 ? `
            <div class="todo-files">
              ${todo.files.slice(0, 4).map((filePath, idx) => {
                const fileName = filePath.split('\\').pop().split('/').pop();
                return `<button class="file-shortcut" onclick="openFileShortcut('${escapeHtml(filePath.replace(/\\/g, '\\\\'))}')"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>${escapeHtml(fileName)}</span><span class="file-remove" onclick="event.stopPropagation();removeFileFromTask(${todo.id},${idx})">\u00d7</span></button>`;
              }).join('')}
            </div>` : ''}
        </div>
        <button class="btn-focus-task" onclick="startFocusOnTask(${todo.id})" title="Focus on this task" ${todo.completed ? 'style="display:none"' : ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <button class="btn-delete" onclick="deleteTodo(${todo.id})" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`;
  }).join('');
  
  // Hydrate rich links after rendering
  setTimeout(() => hydrateRichLinks('todos-list'), 100);
}

async function saveTodos() { await window.api.saveTodos(todos); }

// ═══════════════════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════════════════
function initReminders() {
  const input = document.getElementById('reminder-input');
  const addBtn = document.getElementById('btn-add-reminder');

  // Set default date/time
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  document.getElementById('reminder-date').value = localDateStr(now);
  document.getElementById('reminder-time').value = now.toTimeString().slice(0, 5);

  const reminderOptions = document.getElementById('reminder-options');
  const reminderOptionsWrapper = document.getElementById('reminder-options-wrapper');
  const updateReminderOptions = () => {
    if (input.value.trim().length > 0 || document.activeElement === input || reminderOptions.contains(document.activeElement)) {
      reminderOptionsWrapper.classList.add('active');
    } else {
      reminderOptionsWrapper.classList.remove('active');
    }
  };

  input.addEventListener('focus', updateReminderOptions);
  input.addEventListener('blur', () => setTimeout(updateReminderOptions, 150));
  input.addEventListener('input', updateReminderOptions);
  reminderOptions.addEventListener('focusin', updateReminderOptions);
  reminderOptions.addEventListener('focusout', () => setTimeout(updateReminderOptions, 150));

  addBtn.addEventListener('click', () => addReminder());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addReminder(); });

  document.getElementById('btn-dismiss').addEventListener('click', closeReminderPopup);
  document.getElementById('btn-snooze').addEventListener('click', snoozeReminder);

  renderReminders();
}

function addReminder() {
  const input = document.getElementById('reminder-input');
  const text = input.value.trim();
  if (!text) return;

  const date = document.getElementById('reminder-date').value;
  const time = document.getElementById('reminder-time').value;
  const repeat = document.getElementById('reminder-repeat').value;

  if (!date || !time) {
    showToast('Set a date and time', 'info');
    return;
  }

  reminders.push({
    id: nextId(),
    text,
    date,
    time,
    repeat,
    fired: false,
    snoozedUntil: null,
    timestamp: new Date().toISOString()
  });

  // Sort by datetime
  reminders.sort((a, b) => {
    const dta = new Date(a.date + 'T' + a.time);
    const dtb = new Date(b.date + 'T' + b.time);
    return dta - dtb;
  });

  input.value = '';
  saveReminders();
  renderReminders();
  renderMyDay(); // Refresh My Day in Tasks tab
  renderCalendar(); // Update calendar dots
  showToast('Reminder set', 'success');

  if (document.activeElement !== input || input.value.trim() === '') {
    document.getElementById('reminder-options-wrapper').classList.remove('active');
  }
}

function deleteReminder(id) {
  const el = document.querySelector(`[data-reminder-id="${id}"]`);
  if (el) {
    el.classList.add('item-removing');
    setTimeout(() => {
      reminders = reminders.filter(r => r.id !== id);
      saveReminders();
      renderReminders();
      renderMyDay();
      renderCalendar();
    }, 280);
  }
}

function renderReminders() {
  const list = document.getElementById('reminders-list');
  const empty = document.getElementById('reminders-empty');
  const now = new Date();

  if (reminders.length === 0) {
    list.innerHTML = '';
    empty.classList.add('show');
    return;
  }

  empty.classList.remove('show');
  list.innerHTML = reminders.map(rem => {
    const dt = new Date(rem.date + 'T' + rem.time);
    const isPast = dt < now && rem.fired;
    const repeatLabel = rem.repeat !== 'none' ? rem.repeat : '';

    return `
      <div class="reminder-item ${isPast ? 'past' : ''}" data-reminder-id="${rem.id}">
        <div class="reminder-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div class="reminder-content">
          <div class="reminder-text">${escapeHtml(rem.text)}</div>
          <div class="reminder-datetime">
            <span>${formatDate(rem.date)} at ${formatTime12(rem.time)}</span>
            ${repeatLabel ? `<span class="reminder-repeat-badge">${repeatLabel}</span>` : ''}
          </div>
        </div>
        <button class="btn-delete" onclick="deleteReminder(${rem.id})" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`;
  }).join('');
}

// Reminder checker — runs every 5 seconds
let currentPopupReminder = null;

function startReminderChecker() {
  setInterval(() => {
    const now = new Date();

    // Auto-cleanup: remove fired non-repeating reminders older than 24h
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const before = reminders.length;
    reminders = reminders.filter(r => {
      if (r.fired && r.repeat === 'none') {
        const dt = new Date(r.date + 'T' + r.time);
        return dt > cutoff; // keep if less than 24h old
      }
      return true;
    });
    if (reminders.length !== before) {
      saveReminders();
      renderReminders();
    }

    reminders.forEach(rem => {
      if (rem.fired) return;

      const dt = new Date(rem.date + 'T' + rem.time);

      // If snoozed, check snooze time instead
      if (rem.snoozedUntil) {
        const snoozeDt = new Date(rem.snoozedUntil);
        if (now >= snoozeDt) {
          rem.snoozedUntil = null;
          fireReminder(rem);
        }
        return;
      }

      if (now >= dt) {
        fireReminder(rem);
      }
    });
  }, 5000);
}

function clearPastReminders() {
  const before = reminders.length;
  reminders = reminders.filter(r => {
    // Keep unfired reminders and repeating reminders that haven't fired yet
    if (!r.fired) return true;
    // Keep repeating reminders (they auto-create next occurrence)
    if (r.repeat !== 'none') return false; // remove the fired instance; next occurrence already exists
    return false; // remove fired non-repeating
  });
  saveReminders();
  renderReminders();
  renderCalendar();
  const removed = before - reminders.length;
  showToast(removed > 0 ? `${removed} past reminder${removed > 1 ? 's' : ''} cleared` : 'No past reminders to clear', 'info');
}

function fireReminder(rem) {
  rem.fired = true;
  currentPopupReminder = rem;

  document.getElementById('reminder-popup-text').textContent = rem.text;
  document.getElementById('reminder-popup-time').textContent =
    `${formatDate(rem.date)} at ${formatTime12(rem.time)}`;
  document.getElementById('reminder-overlay').style.display = 'flex';

  // System notification (works even when minimized to FAB)
  if (window.api.showNotification) {
    window.api.showNotification('Reminder', rem.text);
  }
  playBeep();

  // Handle repeating reminders
  if (rem.repeat !== 'none') {
    const nextDate = new Date(rem.date + 'T' + rem.time);
    if (rem.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (rem.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (rem.repeat === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

    // Create next occurrence
    reminders.push({
      id: nextId(),
      text: rem.text,
      date: localDateStr(nextDate),
      time: rem.time,
      repeat: rem.repeat,
      fired: false,
      snoozedUntil: null,
      timestamp: new Date().toISOString()
    });
  }

  saveReminders();
  renderReminders();
  renderMyDay();
}

function closeReminderPopup() {
  document.getElementById('reminder-overlay').style.display = 'none';
  currentPopupReminder = null;
}

function snoozeReminder() {
  if (currentPopupReminder) {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
    currentPopupReminder.fired = false;
    currentPopupReminder.snoozedUntil = snoozeTime.toISOString();
    saveReminders();
    renderReminders();
  }
  closeReminderPopup();
  showToast('Snoozed for 5 minutes', 'info');
}

async function saveReminders() {
  if (window.api.saveReminders) await window.api.saveReminders(reminders);
}

// ═══════════════════════════════════════════════════════
// AMBIENT FOCUS AUDIO (Web Audio API Synthesizer)
// ═══════════════════════════════════════════════════════
const focusAudio = {
  ctx: null, noiseNode: null, amplifier: null, filter: null, activeType: 'none',
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  start(type) {
    if (type === 'none') { this.stop(); return; }
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stop(true); // fast stop active
    this.activeType = type;
    
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    // Generate Brown Noise (deep and warm)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      let white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; 
    }
    
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    
    if (type === 'brown') this.filter.frequency.value = 400; // Deep rumble
    if (type === 'rain') {
       this.filter.frequency.value = 1000; // Higher frequency
       // Rain texture
       for(let i=0; i<bufferSize; i+=Math.floor(Math.random()*2000)) output[i] *= 2; 
    }
    
    this.amplifier = this.ctx.createGain();
    this.amplifier.gain.value = 0; // start silent for fade in
    
    this.noiseNode.connect(this.filter);
    this.filter.connect(this.amplifier);
    this.amplifier.connect(this.ctx.destination);
    
    this.noiseNode.start(0);
    this.amplifier.gain.setTargetAtTime(0.6, this.ctx.currentTime, 2); // 2s fade in
  },
  stop(fast = false) {
    if (this.amplifier) {
      this.amplifier.gain.setTargetAtTime(0, this.ctx.currentTime, fast ? 0.1 : 1);
      const node = this.noiseNode;
      setTimeout(() => { if (node) { node.stop(); node.disconnect(); } }, fast ? 200 : 2000);
      this.amplifier = null;
    }
  }
};

// ═══════════════════════════════════════════════════════
// POMODORO
// ═══════════════════════════════════════════════════════
function initPomodoro() {
  document.getElementById('pomo-start').addEventListener('click', togglePomodoro);
  document.getElementById('pomo-reset').addEventListener('click', resetPomodoro);
  document.getElementById('pomo-skip').addEventListener('click', skipPomodoro);

  // Mini timer auto-popup toggle button
  const popoutBtn = document.getElementById('pomo-popout');
  let miniTimerEnabled = localStorage.getItem('miniTimerEnabled') !== 'false'; // default: enabled
  updateMiniTimerToggle();

  popoutBtn.addEventListener('click', () => {
    miniTimerEnabled = !miniTimerEnabled;
    localStorage.setItem('miniTimerEnabled', miniTimerEnabled);
    updateMiniTimerToggle();
    if (pomoRunning) {
      if (miniTimerEnabled) {
        popOutTimer();
      } else {
        if (window.api.miniTimerClose) window.api.miniTimerClose();
      }
    }
    showToast(miniTimerEnabled ? 'Mini timer enabled' : 'Mini timer disabled', 'info');
  });

  function updateMiniTimerToggle() {
    if (miniTimerEnabled) {
      popoutBtn.classList.remove('toggled-off');
      popoutBtn.title = 'Mini timer: ON (click to disable)';
    } else {
      popoutBtn.classList.add('toggled-off');
      popoutBtn.title = 'Mini timer: OFF (click to enable)';
    }
  }

  // Expose for startPomodoro
  window._miniTimerEnabled = () => miniTimerEnabled;

  const pomoMins = document.getElementById('pomo-mins');
  const pomoSecs = document.getElementById('pomo-secs');

  const handleTimerBlur = () => {
    if (pomoRunning) return;
    const m = parseInt(pomoMins.textContent) || 0;
    const s = parseInt(pomoSecs.textContent) || 0;
    parseTimerValues(m, s);
  };

  const handleTimerKeydown = (e) => {
    if (pomoRunning) { e.preventDefault(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
    // Allow numbers, backspace, delete, arrows, tab
    if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
    }
  };

  pomoMins.addEventListener('blur', handleTimerBlur);
  pomoSecs.addEventListener('blur', handleTimerBlur);
  pomoMins.addEventListener('keydown', handleTimerKeydown);
  pomoSecs.addEventListener('keydown', handleTimerKeydown);

  function parseTimerValues(m, s) {
    if (m < 0) m = 0;
    if (s < 0) s = 0;
    if (s > 59) s = 59;
    if (m === 0 && s === 0) m = 1;

    pomoSelectedMinutes = m + s / 60;
    pomoDuration = m * 60 + s;
    pomoRemaining = pomoDuration;
    pomoElapsedActiveSeconds = 0;
    updatePomoDisplay();
    updatePomoProgress();
  }

  updatePomoDisplay();
  updatePomoStats();

  const audioSelect = document.getElementById('pomo-audio-select');
  if (audioSelect) {
    audioSelect.addEventListener('change', (e) => {
      if (pomoRunning) focusAudio.start(e.target.value);
    });
  }
}

function togglePomodoro() {
  if (pomoRunning) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

function addFocusMinute() {
  pomodoroState.totalMinutes++;
  const todayStr = localDateStr();
  pomodoroState.lastDate = todayStr;

  if (!pomodoroState.weeklyHistory) pomodoroState.weeklyHistory = [];
  let dayEntry = pomodoroState.weeklyHistory.find(e => e.date === todayStr);
  if (!dayEntry) {
    dayEntry = { date: todayStr, sessions: 0, minutes: 0 };
    pomodoroState.weeklyHistory.push(dayEntry);
  }
  dayEntry.minutes++;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  const cutoffStr = localDateStr(cutoffDate);
  pomodoroState.weeklyHistory = pomodoroState.weeklyHistory.filter(e => e.date >= cutoffStr);
  
  savePomodoro();
  updatePomoStats();
}

function startPomodoro() {
  pomoRunning = true;
  document.getElementById('pomo-play-icon').style.display = 'none';
  document.getElementById('pomo-pause-icon').style.display = 'block';
  document.getElementById('pomo-label').textContent = 'Stay focused';
  if (window.api.toggleFocusAssist) window.api.toggleFocusAssist('on');
  
  const soundType = document.getElementById('pomo-audio-select')?.value || 'none';
  if (soundType !== 'none') focusAudio.start(soundType);

  // Auto-popup mini timer if enabled
  if (window._miniTimerEnabled && window._miniTimerEnabled()) {
    popOutTimer();
  }

  pomoTimer = setInterval(() => {
    pomoRemaining--;
    if (pomoRemaining >= 0) {
      pomoElapsedActiveSeconds++;
      if (pomoElapsedActiveSeconds % 60 === 0) {
        addFocusMinute();
      }
    }
    updatePomoDisplay();
    updatePomoProgress();

    if (pomoRemaining <= 0) {
      completePomodoro();
    }
  }, 1000);
}

function pausePomodoro() {
  pomoRunning = false;
  clearInterval(pomoTimer);
  document.getElementById('pomo-play-icon').style.display = 'block';
  document.getElementById('pomo-pause-icon').style.display = 'none';
  document.getElementById('pomo-label').textContent = 'Paused';
  if (window.api.toggleFocusAssist) window.api.toggleFocusAssist('off');
  focusAudio.stop();
}

function resetPomodoro() {
  pomoRunning = false;
  clearInterval(pomoTimer);
  if (window.api.miniTimerClose) window.api.miniTimerClose(); // auto-close mini timer
  pomoRemaining = pomoDuration;
  pomoElapsedActiveSeconds = 0;
  document.getElementById('pomo-play-icon').style.display = 'block';
  document.getElementById('pomo-pause-icon').style.display = 'none';
  document.getElementById('pomo-label').textContent = 'Focus Session';
  updatePomoDisplay();
  updatePomoProgress();
  focusAudio.stop();
}

function skipPomodoro() {
  // Skip without awarding stats
  pomoRunning = false;
  clearInterval(pomoTimer);
  if (window.api.miniTimerClose) window.api.miniTimerClose(); // auto-close mini timer
  pomoRemaining = pomoDuration;
  pomoElapsedActiveSeconds = 0;
  document.getElementById('pomo-play-icon').style.display = 'block';
  document.getElementById('pomo-pause-icon').style.display = 'none';
  document.getElementById('pomo-label').textContent = 'Skipped';
  updatePomoDisplay();
  updatePomoProgress();
  focusAudio.stop();
  showToast('Session skipped', 'info');
}

function completePomodoro() {
  pomoRunning = false;
  clearInterval(pomoTimer);
  if (window.api.toggleFocusAssist) window.api.toggleFocusAssist('off');
  focusAudio.stop();

  // Auto-close mini timer
  if (window.api.miniTimerClose) window.api.miniTimerClose();

  pomodoroState.sessions++;
  const todayStr = localDateStr();
  pomodoroState.lastDate = todayStr;

  // Track weekly history
  if (!pomodoroState.weeklyHistory) pomodoroState.weeklyHistory = [];
  let dayEntry = pomodoroState.weeklyHistory.find(e => e.date === todayStr);
  if (!dayEntry) {
    dayEntry = { date: todayStr, sessions: 0, minutes: 0 };
    pomodoroState.weeklyHistory.push(dayEntry);
  }
  dayEntry.sessions++;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  const cutoffStr = localDateStr(cutoffDate);
  pomodoroState.weeklyHistory = pomodoroState.weeklyHistory.filter(e => e.date >= cutoffStr);
  savePomodoro();

  pomoRemaining = pomoDuration;
  pomoElapsedActiveSeconds = 0;
  document.getElementById('pomo-play-icon').style.display = 'block';
  document.getElementById('pomo-pause-icon').style.display = 'none';
  document.getElementById('pomo-label').textContent = 'Session complete!';
  updatePomoDisplay();
  updatePomoProgress();
  updatePomoStats();

  // Play completion beep
  playBeep();

  // Check if there was a focused task
  if (focusedTaskId) {
    const task = todos.find(t => t.id === focusedTaskId);
    if (task) {
      task.timeSpent = (task.timeSpent || 0) + Math.round(pomoDuration / 60);
      saveTodos();
      if (typeof showFocusCompletePrompt === 'function') showFocusCompletePrompt(task);
    }
    focusedTaskId = null;
    focusedTaskName = null;
    document.getElementById('pomo-label').textContent = 'Focus';
  }

  // System notification
  if (window.api.showNotification) {
    window.api.showNotification('Focus Complete', `Session #${pomodoroState.sessions} done! ${Math.round(pomoDuration / 60)} minutes focused.`);
  }

  showToast('Focus session complete', 'success');
}

// Audio beep for pomodoro completion
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    // Second beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.5);
    }, 300);
  } catch(e) { /* audio not available */ }
}

function updatePomoDisplay() {
  const mins = Math.floor(pomoRemaining / 60);
  const secs = pomoRemaining % 60;
  const mEl = document.getElementById('pomo-mins');
  const sEl = document.getElementById('pomo-secs');
  if (mEl && sEl) {
    mEl.textContent = String(mins).padStart(2, '0');
    sEl.textContent = String(secs).padStart(2, '0');
  }
}

function updatePomoProgress() {
  const progress = document.getElementById('pomo-progress');
  const circumference = 2 * Math.PI * 90; // r=90
  const fraction = pomoRemaining / pomoDuration;
  progress.style.strokeDashoffset = circumference * (1 - fraction);
}

function updatePomoStats() {
  document.getElementById('pomo-sessions').textContent = pomodoroState.sessions;
  const h = Math.floor(pomodoroState.totalMinutes / 60);
  const m = pomodoroState.totalMinutes % 60;
  document.getElementById('pomo-total-time').textContent = `${h}h ${m}m`;
  updateWeekStats();
}

function updateWeekStats() {
  const container = document.getElementById('pomo-week');
  if (!container) return;
  const history = pomodoroState.weeklyHistory || [];
  if (history.length === 0) { container.innerHTML = ''; return; }

  const maxMin = Math.max(...history.map(h => h.minutes), 1);
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const todayStr = localDateStr();

  // Build last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    const entry = history.find(e => e.date === ds);
    days.push({ ds, name: dayNames[d.getDay()], minutes: entry ? entry.minutes : 0, sessions: entry ? entry.sessions : 0 });
  }

  container.innerHTML = `
    <div class="week-label">This week</div>
    <div class="week-bars">
      ${days.map(d => {
        const pct = Math.round((d.minutes / maxMin) * 100);
        const isToday = d.ds === todayStr;
        return `<div class="week-bar-col ${isToday ? 'today' : ''}">
          <div class="week-bar-track"><div class="week-bar-fill" style="height:${Math.max(pct, 4)}%"></div></div>
          <div class="week-bar-day">${d.name}</div>
        </div>`;
      }).join('')}
    </div>`;
}

async function savePomodoro() {
  if (window.api.savePomodoro) await window.api.savePomodoro(pomodoroState);
}

// Pop-out mini timer
function popOutTimer() {
  const timerState = {
    remaining: pomoRemaining,
    duration: pomoDuration,
    running: pomoRunning,
    selectedMinutes: pomoSelectedMinutes
  };
  window.api.popOutTimer(timerState);
}

// Sync timer state to mini-timer while running
setInterval(() => {
  if (pomoRunning) {
    window.api.miniTimerUpdate({
      remaining: pomoRemaining,
      duration: pomoDuration,
      running: pomoRunning,
      selectedMinutes: pomoSelectedMinutes
    });
  }
}, 1000);

// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════
function initSettings() {
  if (window.api.onSettingsChanged) {
    window.api.onSettingsChanged(async () => {
      const settings = await window.api.getSettings() || {};
      if (window.api.toggleFab) window.api.toggleFab(!!settings.disableFab);
      if (typeof fetchIcsEvents === 'function') fetchIcsEvents();
    });
  }
}

function openSettings() {
  window.api.openSettingsWindow();
}

// ═══════════════════════════════════════════════════════
// SMART TIMER (Lock Screen Detection)
// ═══════════════════════════════════════════════════════
function initSmartTimer() {
  if (window.api.onTimerPause) {
    window.api.onTimerPause(() => {
      if (pomoRunning) {
        pausePomodoro();
        document.getElementById('pomo-label').textContent = 'Paused (screen locked)';
      }
    });
  }

  if (window.api.onTimerResume) {
    window.api.onTimerResume(() => {
      showToast('Welcome back — timer was paused', 'info');
    });
  }
}

// ═══════════════════════════════════════════════════════
// DATA SYNC (from Quick Add)
// ═══════════════════════════════════════════════════════
function initDataSync() {
  if (window.api.onDataChanged) {
    window.api.onDataChanged(async (source) => {
      // Reload all data from store
      notes = await window.api.getNotes() || [];
      todos = await window.api.getTodos() || [];
      reminders = await window.api.getReminders?.() || [];
      renderNotes();
      renderTodos();
      renderReminders();
      renderCalendar();

      if (source === 'clipboard') {
        showToast('Clipped from clipboard', 'success');
      } else {
        showToast('Item added via Quick Add', 'success');
      }
    });
  }
}

// ═══════════════════════════════════════════════════════
// FILE SHORTCUTS (Drag & Drop)
// ═══════════════════════════════════════════════════════
function openFileShortcut(filePath) {
  // Unescape the double-escaped backslashes
  const cleanPath = filePath.replace(/\\\\/g, '\\');
  if (window.api.openFilePath) {
    window.api.openFilePath(cleanPath);
  }
}

function removeFileFromTask(todoId, fileIndex) {
  const todo = todos.find(t => t.id === todoId);
  if (todo && todo.files) {
    todo.files.splice(fileIndex, 1);
    if (todo.files.length === 0) delete todo.files;
    saveTodos();
    renderTodos();
    showToast('File removed', 'info');
  }
}

// ═══════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════
function initCalendar() {
  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });

  renderCalendar();
  updateTodayInfo();
}

function renderCalendar() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('cal-title').textContent = `${monthNames[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-days');
  const now = new Date();
  const today = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  // Collect dates that have events (reminders + tasks + ics)
  const eventDates = new Set();
  reminders.forEach(r => eventDates.add(r.date));
  todos.forEach(t => { if (t.dueDate) eventDates.add(t.dueDate); });
  const icsDates = new Set();
  if (icsEvents && icsEvents.length) icsEvents.forEach(e => { icsDates.add(e.date); eventDates.add(e.date); });

  let html = '';

  // Previous month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today && calMonth === todayMonth && calYear === todayYear;
    const dayOfWeek = new Date(calYear, calMonth, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasEvent = eventDates.has(dateStr);
    const hasIcs = icsDates.has(dateStr);

    let cls = 'cal-day cal-clickable';
    if (isToday) cls += ' today';
    else if (isWeekend) cls += ' weekend';
    if (hasEvent) cls += ' has-event';
    if (hasIcs) cls += ' has-ics';

    let moodHtml = '';
    if (moods[dateStr]) {
      const colors = { 'Great': 'var(--success)', 'Good': 'var(--accent-primary)', 'Okay': 'var(--text-muted)', 'Bad': 'var(--warning)', 'Awful': 'var(--danger)' };
      const dotColor = colors[moods[dateStr]] || 'var(--accent-primary)';
      moodHtml = `<div class="cal-mood" style="background:${dotColor}; width:8px; height:8px; border-radius:50%; position:absolute; bottom:6px; right:6px; box-shadow: 0 0 4px ${dotColor}88;"></div>`;
    }

    html += `<div class="${cls}" onclick="clickCalDay('${dateStr}')" ondragover="calDragOver(event)" ondragleave="calDragLeave(event)" ondrop="dropTaskOnDate(event, '${dateStr}')">${d}${moodHtml}</div>`;
  }

  // Next month filler
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month">${i}</div>`;
  }

  grid.innerHTML = html;

  // Render upcoming events
  renderUpcomingEvents();
}

let selectedCalDay = null;
function clickCalDay(dateStr) {
  selectedCalDay = selectedCalDay === dateStr ? null : dateStr;
  // Highlight selected day
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
  if (selectedCalDay) {
    document.querySelectorAll('.cal-day').forEach(el => {
      if (el.getAttribute('onclick')?.includes(selectedCalDay)) el.classList.add('selected');
    });
  }
  renderUpcomingEvents();
}

function renderUpcomingEvents() {
  const list = document.getElementById('events-list');
  const eventsTitle = document.getElementById('events-title');
  const today = localDateStr();

  // Collect items
  const events = [];

  if (selectedCalDay) {
    // Show events for the selected date
    eventsTitle.textContent = `Events for ${formatDate(selectedCalDay)}`;
    reminders.filter(r => r.date === selectedCalDay).forEach(r => {
      events.push({ text: r.text, date: r.date, type: 'reminder' });
    });
    todos.filter(t => t.dueDate === selectedCalDay).forEach(t => {
      events.push({ text: t.text, date: t.dueDate, type: 'task' });
    });
    if (icsEvents) icsEvents.filter(e => e.date === selectedCalDay).forEach(e => {
      events.push({ text: e.summary, date: e.date, type: 'ics', meetingLink: e.meetingLink });
    });
  } else {
    // Default: upcoming items
    eventsTitle.textContent = 'Upcoming';
    reminders.filter(r => r.date >= today && !r.fired).forEach(r => {
      events.push({ text: r.text, date: r.date, type: 'reminder' });
    });
    todos.filter(t => t.dueDate && t.dueDate >= today && !t.completed).forEach(t => {
      events.push({ text: t.text, date: t.dueDate, type: 'task' });
    });
    if (icsEvents) icsEvents.filter(e => e.date >= today).forEach(e => {
      events.push({ text: e.summary, date: e.date, type: 'ics', meetingLink: e.meetingLink });
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = events.slice(0, 5);

  if (upcoming.length === 0) {
    list.innerHTML = `<div style="font-size:11px;color:var(--text-muted);padding:8px 0;">${selectedCalDay ? 'No events for this day' : 'Nothing upcoming'}</div>`;
    return;
  }

  list.innerHTML = upcoming.map(ev => {
    let meetBtn = '';
    if (ev.meetingLink) {
      meetBtn = `<button class="btn-join-meeting" onclick="if(window.api.openExternalUrl) window.api.openExternalUrl('${ev.meetingLink}')" title="Join Meeting">Join</button>`;
    }
    return `
    <div class="event-item">
      <span class="event-dot" style="${ev.type === 'task' ? 'background:var(--warning)' : ev.type === 'ics' ? 'background:var(--text-muted)' : ''}"></span>
      <span>${escapeHtml(ev.text)}</span>
      ${meetBtn}
      <span class="event-date">${formatDate(ev.date)}</span>
    </div>`;
  }).join('');
}

function updateTodayInfo() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('today-date').textContent = now.toLocaleDateString('en-US', options);

  const hour = now.getHours();
  let greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else if (hour < 21) greeting = 'Good evening';
  else greeting = 'Good night';

  const active = todos.filter(t => !t.completed).length;
  const upcoming = reminders.filter(r => !r.fired && r.date >= localDateStr(now)).length;
  document.getElementById('today-greeting').textContent =
    `${greeting} -- ${active} tasks, ${upcoming} reminders pending`;
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatRelativeTime(isoStr) {
  const date = new Date(isoStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const todayStr = localDateStr(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = localDateStr(tomorrow);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime12(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ===============================================================
// TASK-DRIVEN FOCUS TIMER
// ===============================================================

// ─── Insights Dashboard ──────────────────────────────────
function renderInsights() {
  const container = document.getElementById('insights-content');
  if (!container) return;

  const todayStr = localDateStr();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 1. Weekly Velocity: tasks completed per day over last 7 days
  const velocityDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    const count = todos.filter(t => t.completed && t.lastCompletedDate && t.lastCompletedDate.startsWith(ds)).length;
    velocityDays.push({ ds, name: dayNames[d.getDay()], count, isToday: ds === todayStr });
  }
  const maxVelocity = Math.max(...velocityDays.map(d => d.count), 1);

  // 2. Stats
  const totalFocusMinutes = pomodoroState.totalMinutes || 0;
  const allTimeFocusH = Math.floor(totalFocusMinutes / 60);
  const allTimeFocusM = totalFocusMinutes % 60;
  const completedTasks = todos.filter(t => t.completed).length;
  const activeTasks = todos.filter(t => !t.completed).length;
  const sessionsToday = pomodoroState.sessions || 0;

  // 3. Mood trends — read from the global `moods` object { date: moodString }
  const moodCounts = {};
  Object.values(moods).forEach(m => { moodCounts[m] = (moodCounts[m] || 0) + 1; });
  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const dominantMood = sortedMoods.length > 0 ? sortedMoods[0][0] : 'None';

  container.innerHTML = `
    <div class="insight-card">
      <h4 style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Weekly Velocity</h4>
      <div class="velocity-bar-container">
        ${velocityDays.map(d => `
          <div class="velocity-bar-col ${d.isToday ? 'today' : ''}">
            <span class="velocity-count">${d.count}</span>
            <div class="velocity-bar" style="height: ${Math.max((d.count / maxVelocity) * 100, 4)}%"></div>
            <span class="velocity-day">${d.name}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="insight-card">
      <h4 style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Stats</h4>
      <div class="insight-stat-grid">
        <div class="insight-stat">
          <div class="stat-value">${allTimeFocusH}h ${allTimeFocusM}m</div>
          <div class="stat-label">Total Focus Time</div>
        </div>
        <div class="insight-stat">
          <div class="stat-value">${completedTasks}</div>
          <div class="stat-label">Tasks Completed</div>
        </div>
        <div class="insight-stat">
          <div class="stat-value">${activeTasks}</div>
          <div class="stat-label">Active Tasks</div>
        </div>
        <div class="insight-stat">
          <div class="stat-value">${sessionsToday}</div>
          <div class="stat-label">Sessions Today</div>
        </div>
      </div>
    </div>

    <div class="insight-card">
      <h4 style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Mood Trends</h4>
      ${sortedMoods.length > 0 ? `
        <div class="mood-summary">
          ${sortedMoods.map(([mood, count]) => 
            `<span class="mood-chip ${mood === dominantMood ? 'dominant' : ''}">${mood} (${count})</span>`
          ).join('')}
        </div>
      ` : '<p style="font-size:11px;color:var(--text-muted)">Complete focus sessions to start tracking mood trends.</p>'}
    </div>
  `;
}

let focusedTaskId = null;
let focusedTaskName = null;

function startFocusOnTask(todoId) {
  const task = todos.find(t => t.id === todoId);
  if (!task) return;

  focusedTaskId = todoId;
  focusedTaskName = task.text;

  // Switch to Focus tab
  switchToTab(3);

  // Show task name in timer label
  const label = task.text.length > 30 ? task.text.substring(0, 30) + '...' : task.text;
  document.getElementById('pomo-label').textContent = label;

  // Auto-start if not running
  if (!pomoRunning) togglePomodoro();
  showToast('Focusing on: ' + label, 'info');
}

function showFocusCompletePrompt(task) {
  const overlay = document.getElementById('reminder-overlay');
  document.getElementById('reminder-popup-text').textContent = 'Finished: "' + (task.text.length > 40 ? task.text.substring(0, 40) + '...' : task.text) + '"?';
  document.getElementById('reminder-popup-time').textContent = pomoSelectedMinutes + ' minutes focused';
  document.getElementById('btn-dismiss').textContent = 'Not yet';
  document.getElementById('btn-snooze').textContent = 'Yes, done!';

  document.getElementById('btn-snooze').onclick = () => {
    task.completed = true;
    saveTodos();
    renderTodos();
    overlay.style.display = 'none';
    currentPopupReminder = null;
    showToast('Task completed!', 'success');
    document.getElementById('btn-dismiss').textContent = 'Dismiss';
    document.getElementById('btn-snooze').textContent = 'Snooze 5 min';
    document.getElementById('btn-snooze').onclick = snoozeReminder;
    document.getElementById('btn-dismiss').onclick = closeReminderPopup;
  };
  document.getElementById('btn-dismiss').onclick = () => {
    overlay.style.display = 'none';
    currentPopupReminder = null;
    document.getElementById('btn-dismiss').textContent = 'Dismiss';
    document.getElementById('btn-snooze').textContent = 'Snooze 5 min';
    document.getElementById('btn-snooze').onclick = snoozeReminder;
    document.getElementById('btn-dismiss').onclick = closeReminderPopup;
  };

  overlay.style.display = 'flex';
}

function dragTask(event, todoId) {
  event.dataTransfer.setData('text/todo-id', String(todoId));
  event.dataTransfer.effectAllowed = 'move';
}

// ===============================================================
// COMMAND PALETTE (Ctrl+K)
// ===============================================================
let paletteOpen = false;
let paletteIndex = 0;

function initCommandPalette() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if (e.key === 'Escape' && paletteOpen) {
      closeCommandPalette();
    }
  });

  const overlay = document.getElementById('palette-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'palette-overlay') closeCommandPalette();
    });
  }

  const input = document.getElementById('palette-input');
  if (input) {
    input.addEventListener('input', (e) => {
      renderPaletteResults(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      const items = document.querySelectorAll('.palette-item');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        paletteIndex = Math.min(paletteIndex + 1, items.length - 1);
        updatePaletteHighlight(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        paletteIndex = Math.max(paletteIndex - 1, 0);
        updatePaletteHighlight(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[paletteIndex]) items[paletteIndex].click();
      }
    });
  }
}

function toggleCommandPalette() {
  if (paletteOpen) { closeCommandPalette(); return; }
  const overlay = document.getElementById('palette-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  paletteOpen = true;
  paletteIndex = 0;
  const input = document.getElementById('palette-input');
  input.value = '';
  input.focus();
  renderPaletteResults('');
}

function closeCommandPalette() {
  const overlay = document.getElementById('palette-overlay');
  if (overlay) overlay.style.display = 'none';
  paletteOpen = false;
}

function renderPaletteResults(query) {
  const list = document.getElementById('palette-results');
  if (!list) return;

  if (query.startsWith('>')) {
    const cmd = query.slice(1).trim().toLowerCase();
    const actions = [
      { label: 'Start 25m Timer', action: () => { if (!pomoRunning) togglePomodoro(); closeCommandPalette(); } },
      { label: 'Reset Timer', action: () => { resetPomodoro(); closeCommandPalette(); } },
      { label: 'Clear Completed Tasks', action: () => { todos = todos.filter(t => !t.completed); saveTodos(); renderTodos(); closeCommandPalette(); showToast('Cleared', 'info'); } },
      { label: 'Switch to Notes', action: () => { switchToTab(0); closeCommandPalette(); } },
      { label: 'Switch to Tasks', action: () => { switchToTab(1); closeCommandPalette(); } },
      { label: 'Switch to Reminders', action: () => { switchToTab(2); closeCommandPalette(); } },
      { label: 'Switch to Focus', action: () => { switchToTab(3); closeCommandPalette(); } },
      { label: 'Switch to Calendar', action: () => { switchToTab(4); closeCommandPalette(); } },
      { label: 'Open Settings', action: () => { openSettings(); closeCommandPalette(); } },
      { label: 'Undock Window', action: () => { if (window.api.undockWindow) window.api.undockWindow(); closeCommandPalette(); } },
    ];

    const filtered = cmd ? actions.filter(a => fuzzyMatch(cmd, a.label.toLowerCase())) : actions;
    list.innerHTML = filtered.map((a, i) =>
      '<div class="palette-item ' + (i === 0 ? 'active' : '') + '"><span class="palette-action-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>' + escapeHtml(a.label) + '</div>'
    ).join('') || '<div class="palette-empty">No commands found</div>';

    filtered.forEach((a, i) => {
      if (list.children[i]) list.children[i].addEventListener('click', a.action);
    });
    paletteIndex = 0;
    return;
  }

  const results = [];
  const q = query.toLowerCase();

  notes.forEach(n => {
    if (!q || fuzzyMatch(q, n.text.toLowerCase())) {
      results.push({ type: 'note', text: n.text, id: n.id });
    }
  });
  todos.forEach(t => {
    if (!q || fuzzyMatch(q, t.text.toLowerCase())) {
      results.push({ type: 'task', text: t.text, id: t.id, completed: t.completed });
    }
  });

  const shown = results.slice(0, 8);
  list.innerHTML = shown.map((r, i) => {
    const icon = r.type === 'note' ? 'N' : (r.completed ? '\u2713' : 'T');
    const truncated = r.text.length > 55 ? r.text.substring(0, 55) + '...' : r.text;
    return '<div class="palette-item ' + (i === 0 ? 'active' : '') + '" data-type="' + r.type + '"><span class="palette-type-icon">' + icon + '</span>' + escapeHtml(truncated) + '</div>';
  }).join('') || (q ? '<div class="palette-empty">No results</div>' : '<div class="palette-empty">Type to search, or > for commands</div>');

  shown.forEach((r, i) => {
    if (list.children[i]) {
      list.children[i].addEventListener('click', () => {
        switchToTab(r.type === 'note' ? 0 : 1);
        closeCommandPalette();
      });
    }
  });
  paletteIndex = 0;
}

function updatePaletteHighlight(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === paletteIndex));
  if (items[paletteIndex]) items[paletteIndex].scrollIntoView({ block: 'nearest' });
}

function switchToTab(index) {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.classList.remove('active'));
  if (tabs[index]) tabs[index].classList.add('active');
  const panelIds = ['panel-notes', 'panel-todos', 'panel-reminders', 'panel-focus', 'panel-calendar'];
  const panel = document.getElementById(panelIds[index]);
  if (panel) panel.classList.add('active');
  highlightedIndex = -1;
}

function fuzzyMatch(query, text) {
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

// ===============================================================
// ARROW-KEY LIST NAVIGATION
// ===============================================================
let highlightedIndex = -1;

function initArrowNav() {
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (paletteOpen) return;

    const activePanel = document.querySelector('.panel.active');
    if (!activePanel) return;

    const items = activePanel.querySelectorAll('.note-item, .todo-item, .reminder-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
      updateListHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      updateListHighlight(items);
    } else if (e.key === ' ' && highlightedIndex >= 0) {
      e.preventDefault();
      const checkbox = items[highlightedIndex].querySelector('input[type=checkbox]');
      if (checkbox) checkbox.click();
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const target = items[highlightedIndex].querySelector('.todo-content, .note-text');
      if (target) target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    } else if (e.key === 'Delete' && highlightedIndex >= 0) {
      e.preventDefault();
      const btn = items[highlightedIndex].querySelector('.btn-delete');
      if (btn) btn.click();
    }
  });
}

function updateListHighlight(items) {
  items.forEach((el, i) => el.classList.toggle('kb-highlight', i === highlightedIndex));
  if (items[highlightedIndex]) items[highlightedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ===============================================================
// HASHTAG SYSTEM + MY DAY + CHECKLISTS
// ===============================================================
function extractHashtags(items) {
  const tagSet = new Set();
  items.forEach(item => {
    if (!item.text) return;
    const tags = item.text.match(/#(\w+)/g);
    if (tags) tags.forEach(t => tagSet.add(t.substring(1).toLowerCase()));
  });
  return [...tagSet].sort();
}

function renderTagBar(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const tags = extractHashtags(items);
  if (tags.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = `<button class="tag-pill ${!activeTag ? 'active' : ''}" onclick="filterByTag(null)">All</button>` +
    tags.map(tag => `<button class="tag-pill ${activeTag === tag ? 'active' : ''}" onclick="filterByTag('${tag}')">#${tag}</button>`).join('');
}

function filterByTag(tag) {
  activeTag = (activeTag === tag) ? null : tag;
  renderNotes();
  renderTodos();
}

function renderMyDay() {
  const section = document.getElementById('my-day-section');
  if (!section) return;
  const today = localDateStr();
  const now = new Date();
  const items = [];

  // Tasks due today (active only)
  todos.filter(t => t.dueDate === today && !t.completed).forEach(t => {
    items.push({ type: 'task', text: t.text, time: null, icon: 'check' });
  });

  // Reminders firing today
  reminders.filter(r => r.date === today && !r.fired).forEach(r => {
    items.push({ type: 'reminder', text: r.text, time: r.time, icon: 'bell' });
  });

  // ICS events today
  if (typeof icsEvents !== 'undefined' && icsEvents) {
    icsEvents.filter(e => e.date === today).forEach(e => {
      const startTime = e.startTime || null;
      items.push({ type: 'event', text: e.summary || e.title || 'Event', time: startTime, icon: 'calendar' });
    });
  }

  // Sort by time (events with times first)
  items.sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  if (items.length === 0) {
    section.innerHTML = '';
    return;
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateLabel = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`;

  const icons = {
    check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    bell: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    calendar: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };

  section.innerHTML = `
    <div class="my-day-section">
      <div class="my-day-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <span>Today — ${dateLabel}</span>
        <span class="my-day-count">${items.length}</span>
      </div>
      <div class="my-day-items">
        ${items.map(item => `
          <div class="my-day-item my-day-${item.type}">
            <span class="my-day-icon">${icons[item.icon]}</span>
            <span class="my-day-text">${escapeHtml(item.text.length > 40 ? item.text.substring(0, 40) + '...' : item.text)}</span>
            ${item.time ? `<span class="my-day-time">${formatTime12(item.time)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function toggleMdCheck(itemType, itemId, checkIdx) {
  let items, saveFn, renderFn;
  if (itemType === 'note') {
    items = notes;
    saveFn = saveNotes;
    renderFn = renderNotes;
  } else {
    items = todos;
    saveFn = saveTodos;
    renderFn = renderTodos;
  }

  const item = items.find(i => i.id === itemId);
  if (!item || !item.text) return;

  // Find the nth checkbox pattern in the raw text and toggle it
  let idx = 0;
  item.text = item.text.replace(/- \[([ x])\] /g, (match, state) => {
    if (idx++ === checkIdx) {
      return state === 'x' ? '- [ ] ' : '- [x] ';
    }
    return match;
  });

  saveFn();
  renderFn();
}

// ===============================================================
// MARKDOWN PARSER (Robust with marked.js + DOMPurify)
// ===============================================================
function renderMarkdown(text, itemType, itemId) {
  if (!text) return '';

  // 1. Initial Markdown pass (marked is configured in index.html, but we use it here safely)
  let rawHtml;
  try {
    rawHtml = marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    console.error("Markdown parsing failed", e);
    rawHtml = escapeHtml(text);
  }

  // 2. We use DOMPurify to clean it up before doing custom injects
  // We allow custom attributes for our interactive stuff in the next step
  const cleanHtml = DOMPurify.sanitize(rawHtml, { 
    ADD_ATTR: ['onclick', 'onchange', 'data-url', 'target'] 
  });

  // 3. Post-process to inject our custom Event Handlers
  let html = cleanHtml;

  // Code inline gets styled automatically by CSS, we just fix Checklists
  if (itemType && itemId) {
    let checkIdx = 0;
    // Marked renders checklists as `<input disabled="" type="checkbox"( checked="")?>`
    html = html.replace(/<input disabled="" type="checkbox"( checked="")?>/gi, (match, checked) => {
      const idx = checkIdx++;
      const isChecked = !!checked;
      return `<label class="md-check"><input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleMdCheck('${itemType}', ${itemId}, ${idx})" /></label>`;
    });
  }

  // Hashtags #tag (Not standard markdown, but we want it)
  // Only match #tag outside of html attributes. A simple generic replacement is safe since DOMPurify already ran
  html = html.replace(/(^|\s)#(\w+)/g, '$1<span class="hashtag" onclick="filterByTag(\'$2\')">#$2</span>');

  // Auto-link overrides (Marked renders standard <a> tags)
  html = html.replace(/<a href="([^"]+)".*?>/g, '<a class="md-link" onclick="openMdLink(this)" data-url="$1">');

  // Because my regex might have replaced some safe dom properties, one last quick purify just in case
  return DOMPurify.sanitize(html, { ADD_ATTR: ['onclick', 'onchange', 'data-url', 'target'] });
}

function openMdLink(el) {
  const url = el?.getAttribute?.('data-url') || (typeof el === 'string' ? el : '');
  if (url && window.api.openExternalUrl) {
    window.api.openExternalUrl(url);
  }
}

// ===============================================================
// RICH LINK HYDRATION
// ===============================================================
const linkPreviewCache = {};
async function hydrateRichLinks(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !window.api.fetchLinkPreview) return;
  
  // Select all links in markdown content that are fully bare URLs (not part of link tags like [title](url))
  // Marked outputs `<a data-url="...">...</a>` which we intercept.
  const links = container.querySelectorAll('.md-content a.md-link');
  
  for (const link of links) {
    const url = link.getAttribute('data-url');
    // We only want to hydrate if the link text is literally the URL, skipping custom link text
    if (!url || link.textContent !== url) continue;
    
    if (link.hasAttribute('data-hydrating')) continue;
    link.setAttribute('data-hydrating', 'true');
    
    try {
      if (!linkPreviewCache[url]) {
         // Show simple loading shimmer if we wanted, but popping in is fine
         const data = await window.api.fetchLinkPreview(url);
         if (data) linkPreviewCache[url] = data;
         else linkPreviewCache[url] = { failed: true };
      }
      
      const data = linkPreviewCache[url];
      if (data && !data.failed && data.title) {
        const card = document.createElement('div');
        card.className = 'rich-link-card';
        card.onclick = (e) => { e.stopPropagation(); openMdLink(url); };
        
        let hostname = '';
        try { hostname = new URL(url).hostname; } catch(e){}
        
        const imgHtml = data.image ? `<div class="rich-link-img" style="background-image: url('${escapeHtml(data.image)}')"></div>` : '';
        const descHtml = data.description ? `<div class="rich-link-desc">${escapeHtml(data.description.length > 80 ? data.description.substring(0, 80) + '...' : data.description)}</div>` : '';
        
        card.innerHTML = `
          ${imgHtml}
          <div class="rich-link-content">
            <div class="rich-link-title">${escapeHtml(data.title)}</div>
            ${descHtml}
            <div class="rich-link-url"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> ${hostname}</div>
          </div>
        `;
        
        // Preserve original DOM placement by replacing
        if (link.parentNode) link.parentNode.replaceChild(card, link);
      } else {
        // Tag as failed to avoid re-fetching
        link.setAttribute('data-hydrating', 'failed');
      }
    } catch(e) {
      console.error("Hydration failed for", url, e);
    }
  }
}

// ===============================================================
// IMAGE PASTING
// ===============================================================
document.addEventListener('paste', async (e) => {
  const notesPanel = document.getElementById('panel-notes');
  if (!notesPanel || !notesPanel.classList.contains('active')) return;

  const hasText = e.clipboardData && e.clipboardData.getData('text/plain').trim().length > 0;
  
  let imagePath = null;
  
  // 1. Try Native Web Clipboard Blob extraction (handles screenshots, snipping tool, etc.)
  if (e.clipboardData && e.clipboardData.items) {
    for (const item of e.clipboardData.items) {
      if (item.type.indexOf('image/') === 0) {
        const file = item.getAsFile();
        if (file && window.api.saveBufferImage) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            imagePath = await window.api.saveBufferImage(arrayBuffer);
          } catch (err) {
            console.error('Image paste failed:', err);
          }
          break;
        }
      }
    }
  }

  // If user is typing text and there's no image, let normal paste through
  const isTextInput = document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT';
  if (isTextInput && hasText && !imagePath) {
    if (!e.clipboardData.files || e.clipboardData.files.length === 0) return;
  }

  // 2. Fallback to OS clipboard (handles Windows File Explorer file copies)
  if (!imagePath && window.api.saveClipboardImage) {
    try {
      imagePath = await window.api.saveClipboardImage();
    } catch (err) {
      console.error('Clipboard image fallback failed:', err);
    }
  }

  if (imagePath) {
    if (isTextInput) e.preventDefault();
    
    const inputBox = document.getElementById('note-input');
    const caption = (inputBox && inputBox.value.trim()) ? inputBox.value.trim() : 'Pasted image';
    if (caption !== 'Pasted image' && inputBox) inputBox.value = '';

    notes.unshift({
      id: nextId(),
      text: caption,
      category: activeFilter === 'all' ? 'personal' : activeFilter,
      pinned: false,
      image: imagePath,
      timestamp: new Date().toISOString()
    });
    saveNotes();
    renderNotes();
    showToast('Image pasted as note', 'success');
  }
});

// ===============================================================
// EDGE DOCKING
// ===============================================================
function initEdgeDock() {
  if (window.api.onDockStateChanged) {
    window.api.onDockStateChanged((docked) => {
      document.body.classList.toggle('docked', docked);
      const container = document.querySelector('.app-container');
      if (container) container.style.height = docked ? '100%' : '650px';
    });
  }
}

// ===============================================================
// .ICS CALENDAR SYNC
// ===============================================================
let icsEvents = [];

function initCalendarSync() {
  fetchIcsEvents();
  setInterval(fetchIcsEvents, 60 * 60 * 1000);
}

async function fetchIcsEvents() {
  if (!window.api.getSettings || !window.api.fetchIcsCalendar) return;
  try {
    const settings = await window.api.getSettings();
    if (!settings || !settings.icsUrl) return;
    icsEvents = await window.api.fetchIcsCalendar(settings.icsUrl);
    renderCalendar();
  } catch (e) { /* silently fail */ }
}

// ===============================================================
// DRAG-AND-DROP TASK SCHEDULING
// ===============================================================
function dropTaskOnDate(event, dateStr) {
  event.preventDefault();
  event.currentTarget.classList.remove('cal-drop-target');

  const todoIdStr = event.dataTransfer.getData('text/todo-id');
  if (!todoIdStr) return;
  const todoId = Number(todoIdStr);
  if (isNaN(todoId)) return;

  const todo = todos.find(t => t.id === todoId);
  if (todo) {
    todo.dueDate = dateStr;
    saveTodos();
    renderTodos();
    renderCalendar();
    showToast('Task scheduled for ' + formatDate(dateStr), 'success');
  }
}

function calDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('cal-drop-target');
}

function calDragLeave(event) {
  event.currentTarget.classList.remove('cal-drop-target');
}

// ===============================================================
// MOODS
// ===============================================================
function initMoods() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mood = btn.getAttribute('data-mood');
      const today = localDateStr();
      moods[today] = mood;
      if (window.api.saveMoods) await window.api.saveMoods(moods);
      document.getElementById('mood-overlay').style.display = 'none';
      renderCalendar();
      showToast('Mood saved for today', 'success');
    });
  });
}

