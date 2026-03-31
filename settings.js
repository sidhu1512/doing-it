document.addEventListener('DOMContentLoaded', async () => {
  // Bind close button
  document.getElementById('btn-close-window').addEventListener('click', () => {
    window.api.closeSettingsWindow();
  });

  // Load Elements
  const pathDisplay = document.getElementById('settings-path');
  const btnChangePath = document.getElementById('btn-change-path');
  const btnResetPath = document.getElementById('btn-reset-path');
  
  const icsInput = document.getElementById('ics-url-input');
  const btnSaveIcs = document.getElementById('btn-save-ics');

  let currentSettings = { savePath: null, icsUrl: null };

  // Fetch initial paths and settings
  try {
    const currentPath = await window.api.getCurrentStorePath();
    pathDisplay.textContent = currentPath;
    
    currentSettings = await window.api.getSettings();
    
    if (currentSettings.theme) {
      document.documentElement.setAttribute('data-theme', currentSettings.theme);
    }

    if (currentSettings.icsUrl) {
      icsInput.value = currentSettings.icsUrl;
    }
  } catch (err) {
    console.error('Failed to init settings:', err);
  }

  // Listen for real-time theme changes
  window.api.onThemeUpdated((theme) => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  });

  // Handle path change
  btnChangePath.addEventListener('click', async () => {
    const newPath = await window.api.chooseDirectory();
    if (newPath) {
      currentSettings.savePath = newPath;
      await window.api.saveSettings(currentSettings);
      
      const updatedPath = await window.api.getCurrentStorePath();
      pathDisplay.textContent = updatedPath;
      
      // Tell main app that settings changed
      window.api.notifySettingsChanged();
    }
  });

  // Handle path reset
  btnResetPath.addEventListener('click', async () => {
    currentSettings.savePath = null;
    await window.api.saveSettings(currentSettings);
    
    const updatedPath = await window.api.getCurrentStorePath();
    pathDisplay.textContent = updatedPath;
    
    window.api.notifySettingsChanged();
  });

  // Handle ICS save
  btnSaveIcs.addEventListener('click', async () => {
    const val = icsInput.value.trim();
    currentSettings.icsUrl = val || null;
    await window.api.saveSettings(currentSettings);
    
    const originalText = btnSaveIcs.textContent;
    btnSaveIcs.textContent = 'Saved!';
    btnSaveIcs.style.background = 'var(--success)';
    
    window.api.notifySettingsChanged();

    setTimeout(() => {
      btnSaveIcs.textContent = originalText;
      btnSaveIcs.style.background = '';
    }, 2000);
  });
});
