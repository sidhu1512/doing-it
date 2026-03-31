---
description: How to build, uninstall, and reinstall the Doing It app
---
# Build & Install Workflow

> [!CAUTION]
> Do NOT change the app icon (`build/icon.ico`, `assets/icon.ico`, `assets/icon.png`). The icon must remain as the custom Doing It icon. Never regenerate, overwrite, or replace these files.

## Steps

// turbo-all

1. Kill any running instances:
```powershell
taskkill /IM "Doing It.exe" /F 2>$null
```

2. Build the installer:
```powershell
cd "c:\Users\Asus\Desktop\Live Notes" && npm run build
```
Verify the log shows `afterPack: icon patched successfully`.

3. Uninstall the current version:
```powershell
$uninstaller = "$env:LOCALAPPDATA\Programs\doing-it\Uninstall Doing It.exe"; if (Test-Path $uninstaller) { Start-Process -FilePath $uninstaller -ArgumentList "/S" -Wait; Write-Host "Uninstall complete" } else { Write-Host "No existing installation" }
```

4. Install the new build:
```powershell
Start-Process -FilePath "c:\Users\Asus\Desktop\Live Notes\dist\Doing It Setup 4.0.0.exe" -ArgumentList "/S" -Wait; Write-Host "Install complete"
```

## Important Notes
- The `afterPack.js` script patches the icon into the exe using the `rcedit` npm package
- `signAndEditExecutable: false` in package.json means electron-builder won't set the icon itself — `afterPack.js` handles it
- **NEVER touch `build/icon.ico` or `assets/icon.ico`** — these are the app's custom icon files
