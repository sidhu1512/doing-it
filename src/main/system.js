const { exec } = require('child_process');
const { screen } = require('electron');

class SystemIntegration {
  constructor() {
    this._cachedActiveWindow = null;
    this._lastActiveWindowTime = 0;
    this._cacheTtlMs = 600; // Cache active window for 600ms to avoid PowerShell spam
  }

  getActiveDisplay() {
    const cursorPoint = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursorPoint);
  }

  /**
   * Safe PowerShell WinAPI Foreground Window detection with caching
   */
  async getActiveWindowTitle() {
    const now = Date.now();
    if (this._cachedActiveWindow && (now - this._lastActiveWindowTime < this._cacheTtlMs)) {
      return this._cachedActiveWindow;
    }

    return new Promise((resolve) => {
      const psCommand = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinAPI {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@
$h = [WinAPI]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[WinAPI]::GetWindowText($h, $sb, 512)
$sb.ToString()
`.replace(/\r?\n/g, ' ').replace(/"/g, '\"');

      exec(`powershell -NoProfile -Command "${psCommand}"`, { timeout: 1800 }, (err, stdout) => {
        if (err) {
          resolve(this._cachedActiveWindow || null);
          return;
        }
        const title = (stdout || '').trim();
        this._cachedActiveWindow = title || null;
        this._lastActiveWindowTime = Date.now();
        resolve(this._cachedActiveWindow);
      });
    });
  }

  /**
   * Windows 11 Focus Assist (Do Not Disturb) toggle
   */
  async toggleFocusAssist(state) {
    return new Promise((resolve) => {
      try {
        const regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings';
        const value = state === 'on' ? 0 : 1;
        const ps = `New-ItemProperty -Path '${regPath}' -Name 'NOC_GLOBAL_SETTING_TOASTS_ENABLED' -Value ${value} -PropertyType DWORD -Force | Out-Null`;

        exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 2500 }, (err) => {
          if (err) {
            console.error('[SystemIntegration] Focus Assist toggle failed:', err.message);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } catch (e) {
        console.error('[SystemIntegration] Focus Assist error:', e);
        resolve(false);
      }
    });
  }

  /**
   * Screen edge docking geometry calculation
   * Returns { isDocked: boolean, bounds: { x, y, width, height } }
   */
  calculateDockState(winBounds, edgeThreshold = 20, dockWidth = 400) {
    const activeDisplay = screen.getDisplayNearestPoint({ x: winBounds.x, y: winBounds.y });
    const workArea = activeDisplay.workArea;

    const nearLeft = winBounds.x <= workArea.x + edgeThreshold;
    const nearRight = (winBounds.x + winBounds.width) >= (workArea.x + workArea.width - edgeThreshold);

    if (nearLeft) {
      return {
        isDocked: true,
        bounds: {
          x: workArea.x,
          y: workArea.y,
          width: dockWidth,
          height: workArea.height
        }
      };
    } else if (nearRight) {
      return {
        isDocked: true,
        bounds: {
          x: workArea.x + workArea.width - dockWidth,
          y: workArea.y,
          width: dockWidth,
          height: workArea.height
        }
      };
    }

    return {
      isDocked: false,
      bounds: {
        x: winBounds.x,
        y: winBounds.y,
        width: dockWidth,
        height: 650
      }
    };
  }

  /**
   * Fires a native OS copy interrupt (Ctrl+C) via PowerShell without stealing GUI focus
   */
  triggerNativeCopy(callback) {
    const cmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^c')"`;
    exec(cmd, { timeout: 1500 }, (err) => {
      if (err) console.error('[SystemIntegration] Native copy interrupt error:', err.message);
      if (typeof callback === 'function') callback(!err);
    });
  }
}

module.exports = new SystemIntegration();
