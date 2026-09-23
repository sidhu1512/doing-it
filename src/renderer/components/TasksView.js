/**
 * TasksView Component — Things 3 & Linear Inspired Task Engine
 * Smart sections (Today, Upcoming, Backlog, Completed), habit streaks, micro-animations, and Focus linkage.
 */

class TasksViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.nlpDebounce = null;
    this.parsedNLP = { date: null, priority: 'none', isHabit: false };

    this.render();
    this.bindEvents();
    this.renderTaskList();
    this.renderHabits();

    this.store.subscribe('tasks', () => {
      this.renderTaskList();
      this.renderHabits();
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="view-container">
        <!-- Quick Add Card -->
        <div class="task-input-card">
          <div class="task-input-row">
            <input type="text" id="task-quick-input" class="task-text-input" placeholder="Add task or habit... (e.g. Design review tomorrow 3pm !high)" />
            <button class="task-action-btn" id="btn-create-task" title="Add Task (Enter)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add</span>
            </button>
          </div>
          <div class="task-chips-preview" id="task-chips-preview" style="display:none"></div>
        </div>

        <!-- Habits Row -->
        <div id="habits-section" style="display:none">
          <div class="section-header">
            <span class="section-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Daily Habits
            </span>
          </div>
          <div class="habits-strip" id="habits-strip"></div>
        </div>

        <!-- Smart Sections List -->
        <div id="tasks-sections-wrapper" style="display:flex; flex-direction:column; gap:14px;"></div>
      </div>
    `;
  }

  bindEvents() {
    const input = this.container.querySelector('#task-quick-input');
    const btnCreate = this.container.querySelector('#btn-create-task');
    const chipsPreview = this.container.querySelector('#task-chips-preview');

    const handleCreate = () => {
      const val = input.value.trim();
      if (!val) return;

      const priority = this.parsedNLP.priority || 'none';
      const dueDate = this.parsedNLP.date || null;
      const isHabit = this.parsedNLP.isHabit || /\/habit\b/i.test(val);

      let cleanText = val
        .replace(/^\/habit\s*/i, '')
        .replace(/[!#](high|medium|low|h|m|l)\b/i, '')
        .trim();

      this.store.addTask({
        text: cleanText,
        priority,
        dueDate,
        isHabit
      });

      input.value = '';
      chipsPreview.style.display = 'none';
      chipsPreview.innerHTML = '';
      this.parsedNLP = { date: null, priority: 'none', isHabit: false };
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCreate();
    });

    btnCreate.addEventListener('click', handleCreate);

    // Live NLP feedback parsing
    input.addEventListener('input', () => {
      const val = input.value;
      if (!val.trim()) {
        chipsPreview.style.display = 'none';
        chipsPreview.innerHTML = '';
        this.parsedNLP = { date: null, priority: 'none', isHabit: false };
        return;
      }

      // Priority check
      let pri = 'none';
      const priMatch = val.match(/[!#](high|medium|low|h|m|l)\b/i);
      if (priMatch) {
        const p = priMatch[1].toLowerCase();
        pri = p === 'h' ? 'high' : p === 'm' ? 'medium' : p === 'l' ? 'low' : p;
      }

      // Habit check
      const isHabit = /\/habit\b/i.test(val);

      this.parsedNLP.priority = pri;
      this.parsedNLP.isHabit = isHabit;

      clearTimeout(this.nlpDebounce);
      this.nlpDebounce = setTimeout(async () => {
        if (window.api && window.api.parseNLP) {
          try {
            const res = await window.api.parseNLP(val);
            if (res && res.date) {
              this.parsedNLP.date = res.date;
            } else {
              this.parsedNLP.date = null;
            }
          } catch (e) {}
        }
        this.renderChips(chipsPreview);
      }, 150);
    });

    // Delegate Task Clicks (toggle, focus, delete)
    const wrapper = this.container.querySelector('#tasks-sections-wrapper');
    wrapper.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.custom-checkbox');
      if (checkbox) {
        const id = Number(checkbox.getAttribute('data-id'));
        this.store.toggleTask(id);
        return;
      }

      const focusBtn = e.target.closest('.btn-task-focus');
      if (focusBtn) {
        const id = Number(focusBtn.getAttribute('data-id'));
        this.store.set('activeView', 'focus');
        this.store.startFocus(id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-task-delete');
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        this.store.deleteTask(id);
        return;
      }

      const clearBtn = e.target.closest('.btn-clear-completed');
      if (clearBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.store.clearCompletedTasks();
        return;
      }
    });

    // Double-click inline task title editing
    wrapper.addEventListener('dblclick', (e) => {
      const titleEl = e.target.closest('.task-title');
      if (!titleEl) return;
      const taskId = Number(titleEl.getAttribute('data-id'));
      const task = this.store.get('tasks').find(t => t.id === taskId);
      if (!task) return;

      const currentText = task.text;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'task-inline-edit-input';
      input.value = currentText;

      let isSaved = false;
      const save = () => {
        if (isSaved) return;
        isSaved = true;
        const val = input.value.trim();
        if (val && val !== currentText) {
          this.store.updateTaskText(taskId, val);
        } else {
          titleEl.textContent = currentText;
        }
      };

      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          save();
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          isSaved = true;
          titleEl.textContent = currentText;
        }
      });

      input.addEventListener('blur', () => save());

      titleEl.innerHTML = '';
      titleEl.appendChild(input);
      input.focus();
      input.select();
    });

    // Delegate Habits Click
    const habitsStrip = this.container.querySelector('#habits-strip');
    habitsStrip.addEventListener('click', (e) => {
      const item = e.target.closest('.habit-item');
      if (item) {
        const id = Number(item.getAttribute('data-id'));
        this.store.toggleTask(id);
      }
    });
  }

  renderChips(chipsContainer) {
    const chips = [];
    if (this.parsedNLP.isHabit) {
      chips.push(`<span class="tag-chip">Habit</span>`);
    }
    if (this.parsedNLP.priority !== 'none') {
      const pClass = this.parsedNLP.priority === 'high' ? 'priority-high' : '';
      chips.push(`<span class="tag-chip ${pClass}">! ${this.parsedNLP.priority.toUpperCase()}</span>`);
    }
    if (this.parsedNLP.date) {
      chips.push(`<span class="tag-chip date">${this.parsedNLP.date}</span>`);
    }

    if (chips.length > 0) {
      chipsContainer.innerHTML = chips.join('');
      chipsContainer.style.display = 'flex';
    } else {
      chipsContainer.style.display = 'none';
      chipsContainer.innerHTML = '';
    }
  }

  renderHabits() {
    const habitsSection = this.container.querySelector('#habits-section');
    const habitsStrip = this.container.querySelector('#habits-strip');
    const habits = this.store.get('tasks').filter(t => t.isHabit);

    if (habits.length === 0) {
      habitsSection.style.display = 'none';
      return;
    }

    habitsSection.style.display = 'block';
    habitsStrip.innerHTML = habits.map(h => `
      <div class="habit-item ${h.completed ? 'done' : ''}" data-id="${h.id}" title="${h.completed ? 'Completed for today!' : 'Click to complete'}">
        <span class="habit-status-icon">
          ${h.completed
            ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}
        </span>
        <span>${this.escapeHtml(h.text)}</span>
        <span class="habit-flame" title="${h.streak || 0} day streak">${h.streak || 0}d</span>
      </div>
    `).join('');
  }

  renderTaskList() {
    const wrapper = this.container.querySelector('#tasks-sections-wrapper');
    const allTasks = this.store.get('tasks').filter(t => !t.isHabit);

    const todayStr = new Date().toISOString().split('T')[0];

    const todayTasks = [];
    const upcomingTasks = [];
    const backlogTasks = [];
    const completedTasks = [];

    allTasks.forEach(t => {
      if (t.completed) {
        completedTasks.push(t);
      } else if (t.dueDate === todayStr || t.priority === 'high') {
        todayTasks.push(t);
      } else if (t.dueDate && t.dueDate > todayStr) {
        upcomingTasks.push(t);
      } else {
        backlogTasks.push(t);
      }
    });

    if (allTasks.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 40px 10px; color: var(--text-muted);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="margin-bottom:8px; opacity:0.6;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div style="font-weight: 500; font-size: 13px; color: var(--text-secondary);">No tasks yet</div>
          <div style="font-size: 11.5px; margin-top: 2px;">Type above to capture your first task</div>
        </div>
      `;
      return;
    }

    let html = '';

    // 1. TODAY SECTION
    if (todayTasks.length > 0) {
      html += `
        <div class="task-section">
          <div class="section-header">
            <span class="section-title">Today</span>
            <span class="section-badge">${todayTasks.length}</span>
          </div>
          <div class="tasks-group" style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            ${todayTasks.map(t => this.renderTaskCard(t)).join('')}
          </div>
        </div>
      `;
    }

    // 2. UPCOMING SECTION
    if (upcomingTasks.length > 0) {
      html += `
        <div class="task-section">
          <div class="section-header">
            <span class="section-title">Upcoming</span>
            <span class="section-badge">${upcomingTasks.length}</span>
          </div>
          <div class="tasks-group" style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            ${upcomingTasks.map(t => this.renderTaskCard(t)).join('')}
          </div>
        </div>
      `;
    }

    // 3. BACKLOG SECTION
    if (backlogTasks.length > 0 || (todayTasks.length === 0 && upcomingTasks.length === 0)) {
      html += `
        <div class="task-section">
          <div class="section-header">
            <span class="section-title">Backlog</span>
            <span class="section-badge">${backlogTasks.length}</span>
          </div>
          <div class="tasks-group" style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            ${backlogTasks.map(t => this.renderTaskCard(t)).join('')}
          </div>
        </div>
      `;
    }

    // 4. COMPLETED SECTION
    if (completedTasks.length > 0) {
      html += `
        <details class="task-section" style="cursor:pointer;" open>
          <summary class="section-header" style="outline:none; user-select:none; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="section-title">Completed</span>
              <span class="section-badge">${completedTasks.length}</span>
            </div>
            <button class="task-action-btn btn-clear-completed" title="Clear all completed tasks">Clear</button>
          </summary>
          <div class="tasks-group" style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            ${completedTasks.map(t => this.renderTaskCard(t)).join('')}
          </div>
        </details>
      `;
    }

    wrapper.innerHTML = html;
  }

  renderTaskCard(task) {
    const isCompleted = task.completed;
    const priBadge = task.priority && task.priority !== 'none'
      ? `<span class="tag-chip ${task.priority === 'high' ? 'priority-high' : ''}">! ${task.priority}</span>`
      : '';
    const dateBadge = task.dueDate ? `<span class="tag-chip date">${task.dueDate}</span>` : '';

    return `
      <div class="task-card ${isCompleted ? 'completed' : ''}">
        <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" data-id="${task.id}" title="${isCompleted ? 'Mark incomplete' : 'Mark complete'}">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="task-content">
          <div class="task-title" data-id="${task.id}" title="Double-click to edit">${this.escapeHtml(task.text)}</div>
          <div class="task-meta-row">
            ${priBadge}
            ${dateBadge}
          </div>
        </div>
        <div class="task-actions">
          ${!isCompleted ? `
            <button class="task-action-btn btn-task-focus" data-id="${task.id}" title="Focus on this task">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Focus</span>
            </button>
          ` : ''}
          <button class="task-action-btn btn-task-delete" data-id="${task.id}" title="Delete task">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.TasksViewComponent = TasksViewComponent;
