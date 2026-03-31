// afterPack.js — runs after electron-builder packages the app but BEFORE NSIS installer is built
// This patches the exe icon since signAndEditExecutable is disabled (code signing not available)
// IMPORTANT: Do NOT change the app icon. This script must always use build/icon.ico.

const path = require('path');
const fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.default = async function afterPack(context) {
  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const icoPath = path.join(context.packager.projectDir, 'build', 'icon.ico');

  if (!fs.existsSync(exePath)) {
    console.log('  • afterPack: exe not found, skipping icon patch');
    return;
  }
  if (!fs.existsSync(icoPath)) {
    console.log('  • afterPack: icon.ico not found, skipping icon patch');
    return;
  }

  // Use the rcedit npm package directly
  let rcedit;
  try {
    rcedit = require('rcedit').rcedit;
  } catch (e) {
    console.log('  • afterPack: rcedit package not found, skipping icon patch. Run: npm install --save-dev rcedit');
    return;
  }

  // Wait for electron-builder to release the file lock from asar integrity update
  console.log('  • afterPack: waiting 3s for file lock release...');
  await sleep(3000);

  console.log('  • afterPack: patching icon into exe...');
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await rcedit(exePath, { icon: icoPath });
      console.log('  • afterPack: icon patched successfully on attempt ' + attempt);
      return;
    } catch (e) {
      if (attempt < 5) {
        console.log(`  • afterPack: attempt ${attempt} failed, retrying in 2s...`);
        await sleep(2000);
      } else {
        console.error('  • afterPack: failed to patch icon after 5 attempts:', e.message);
      }
    }
  }
};

