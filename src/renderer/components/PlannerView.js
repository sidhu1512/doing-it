/**
 * PlannerView Component — Sunsama & Notion Calendar Inspired Day Agenda
 * Horizontal week strip, timeblock schedule, synced .ics calendar events, and 1-click meeting join.
 */

class PlannerViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.selectedDate = new Date();

    this.render();
    this.bindEvents();

    this.store.subscribe('calendarEvents', () => this.renderAgenda());
    this.store.subscribe('tasks', () => this.renderAgenda());
  }

  render() {
    this.container.innerHTML = `
      <div class="view-container">
        <!-- Week Strip Picker -->
        <div class="planner-week-strip" id="planner-week-strip"></div>

        <!-- Selected Day Info Header -->
        <div class="section-header" style="margin-top:2px;">
          <span class="section-title" id="agenda-date-title"></span>
          <span class="section-badge" id="agenda-count-badge">0 items</span>
        </div>

        <!-- Agenda Timeline Feed -->
        <div class="timeline-feed" id="agenda-timeline-feed"></div>
      </div>
    `;

    this.renderWeekStrip();
    this.renderAgenda();
  }

  bindEvents() {
    const strip = this.container.querySelector('#planner-week-strip');
    strip.addEventListener('click', (e) => {
      const pill = e.target.closest('.day-pill');
      if (!pill) return;

      const dateStr = pill.getAttribute('data-date');
      this.selectedDate = new Date(dateStr + 'T00:00:00');
      this.renderWeekStrip();
      this.renderAgenda();
    });

    // Delegate Meeting Join
    const feed = this.container.querySelector('#agenda-timeline-feed');
    feed.addEventListener('click', (e) => {
      const btnJoin = e.target.closest('.btn-join-meeting');
      if (btnJoin) {
        const url = btnJoin.getAttribute('data-url');
        if (url && window.api && window.api.openExternalUrl) {
          window.api.openExternalUrl(url);
        }
      }
    });
  }

  renderWeekStrip() {
    const strip = this.container.querySelector('#planner-week-strip');
    const today = new Date();
    const currentSelectedStr = this.selectedDate.toISOString().split('T')[0];

    // Build 7-day strip centered around selected or current date
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const start = new Date(today);
    start.setDate(today.getDate() - 3);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isSelected = dStr === currentSelectedStr;
      const isToday = dStr === today.toISOString().split('T')[0];

      days.push(`
        <div class="day-pill ${isSelected ? 'active' : ''}" data-date="${dStr}">
          <span class="day-pill-name">${dayNames[d.getDay()]}</span>
          <span class="day-pill-num" style="${isToday ? 'color:var(--accent-primary);' : ''}">${d.getDate()}</span>
        </div>
      `);
    }

    strip.innerHTML = days.join('');
  }

  renderAgenda() {
    const feed = this.container.querySelector('#agenda-timeline-feed');
    const titleEl = this.container.querySelector('#agenda-date-title');
    const badgeEl = this.container.querySelector('#agenda-count-badge');

    const selStr = this.selectedDate.toISOString().split('T')[0];
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    titleEl.textContent = this.selectedDate.toLocaleDateString(undefined, options);

    // 1. Filter Tasks for this date
    const tasks = this.store.get('tasks').filter(t => t.dueDate === selStr);

    // 2. Filter Calendar .ics events for this date
    const calendarEvents = this.store.get('calendarEvents') || [];
    const events = calendarEvents.filter(ev => {
      if (!ev.startDate) return false;
      const evDateStr = ev.startDate.split('T')[0];
      return evDateStr === selStr;
    });

    const totalItems = tasks.length + events.length;
    badgeEl.textContent = `${totalItems} scheduled`;

    if (totalItems === 0) {
      feed.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 40px 10px; color: var(--text-muted);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="margin-bottom:8px; opacity:0.6;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          <div style="font-weight: 500; font-size: 13px; color: var(--text-secondary);">Clear Schedule</div>
          <div style="font-size: 11.5px; margin-top: 2px;">No meetings or scheduled tasks for this day</div>
        </div>
      `;
      return;
    }

    let html = '';

    // Calendar Meetings First
    events.forEach(ev => {
      const timeStr = ev.startDate.includes('T')
        ? ev.startDate.split('T')[1].substring(0, 5)
        : 'All Day';

      const meetingBtn = ev.meetingUrl
        ? `<button class="btn-join-meeting" data-url="${ev.meetingUrl}">Join ${ev.meetingPlatform || 'Call'}</button>`
        : '';

      html += `
        <div class="agenda-item meeting">
          <div class="agenda-time">${timeStr}</div>
          <div class="agenda-info">
            <div class="agenda-title">${this.escapeHtml(ev.title || 'Meeting')}</div>
            ${ev.location ? `<div style="font-size:10.5px; color:var(--text-muted);">${this.escapeHtml(ev.location)}</div>` : ''}
          </div>
          ${meetingBtn}
        </div>
      `;
    });

    // Scheduled Tasks
    tasks.forEach(t => {
      html += `
        <div class="agenda-item" style="border-left-color: ${t.completed ? 'var(--text-muted)' : 'var(--accent-primary)'};">
          <div class="agenda-time">Task</div>
          <div class="agenda-info">
            <div class="agenda-title" style="${t.completed ? 'text-decoration:line-through; opacity:0.6;' : ''}">${this.escapeHtml(t.text)}</div>
            <div style="font-size:10.5px; color:var(--text-muted);">${t.priority !== 'none' ? '! ' + t.priority : 'Scheduled'}</div>
          </div>
          <div class="custom-checkbox ${t.completed ? 'checked' : ''}" data-id="${t.id}" style="cursor:pointer;" onclick="window.appStore.toggleTask(${t.id})">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      `;
    });

    feed.innerHTML = html;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.PlannerViewComponent = PlannerViewComponent;
