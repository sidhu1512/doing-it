/**
 * Toast & Undo Notification System
 * Lightweight, glassmorphic, non-intrusive floating HUD notifications.
 */

(function () {
  let toastContainer = null;
  let activeToast = null;
  let toastTimer = null;

  function ensureContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
      toastContainer = document.getElementById('toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
      }
    }
    return toastContainer;
  }

  function getIconSvg(type) {
    switch (type) {
      case 'success':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      case 'warning':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      case 'error':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      default:
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
  }

  function showToast(message, type = 'info', duration = 3000) {
    if (!message) return;
    const container = ensureContainer();

    if (activeToast) {
      clearTimeout(toastTimer);
      activeToast.remove();
      activeToast = null;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${getIconSvg(type)}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    activeToast = toast;

    // Trigger animate-in
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    toastTimer = setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }

  function showUndoToast(message, onUndo, duration = 4500) {
    if (!message) return;
    const container = ensureContainer();

    if (activeToast) {
      clearTimeout(toastTimer);
      activeToast.remove();
      activeToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-undo';
    toast.innerHTML = `
      <span class="toast-icon">${getIconSvg('info')}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-undo-btn" id="btn-toast-undo">Undo</button>
    `;

    container.appendChild(toast);
    activeToast = toast;

    const undoBtn = toast.querySelector('#btn-toast-undo');
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(toastTimer);
      dismissToast(toast);
      if (typeof onUndo === 'function') onUndo();
    });

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    toastTimer = setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }

  function dismissToast(toast) {
    if (!toast) return;
    toast.classList.remove('visible');
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 250);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Expose globally for renderer
  window.showToast = showToast;
  window.showUndoToast = showUndoToast;
  window.toast = {
    show: (message, type = 'info', action = null) => {
      if (action && action.onClick) {
        showUndoToast(message, action.onClick);
      } else {
        showToast(message, type);
      }
    }
  };
})();
