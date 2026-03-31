// Launcher script that ensures ELECTRON_RUN_AS_NODE is unset
const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [path.resolve(__dirname, 'main.js')], {
  stdio: 'inherit',
  windowsHide: false,
  env
});

child.on('close', (code) => process.exit(code));
