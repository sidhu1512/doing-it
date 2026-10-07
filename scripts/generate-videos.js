const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const imgsDir = path.join(projectRoot, 'docs', 'imgs');
const docsAssets = path.join(projectRoot, 'docs', 'assets');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 600,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // allow loading local images
    }
  });

  win.loadURL('about:blank');
  await new Promise(r => win.webContents.once('did-finish-load', r));

  // Prepare list of screenshots with their file URLs
  const views = [
    { name: 'tasks', file: path.join(imgsDir, 'tasks-view.png').replace(/\\/g, '/'), title: 'Tasks & Streaks', tabX: 60 },
    { name: 'diary', file: path.join(imgsDir, 'diary-view.png').replace(/\\/g, '/'), title: 'Day One Diary', tabX: 130 },
    { name: 'focus', file: path.join(imgsDir, 'focus-view.png').replace(/\\/g, '/'), title: 'Focus Studio', tabX: 200 },
    { name: 'analytics', file: path.join(imgsDir, 'analytics-view.png').replace(/\\/g, '/'), title: 'Rhythm Analytics', tabX: 270 },
    { name: 'planner', file: path.join(imgsDir, 'planner-view.png').replace(/\\/g, '/'), title: 'Day Planner', tabX: 340 },
    { name: 'palette', file: path.join(imgsDir, 'palette-view.png').replace(/\\/g, '/'), title: 'Raycast Palette', tabX: 200 }
  ];

  console.log('Rendering high-framerate screen recording video in Electron...');

  const videoBase64 = await win.webContents.executeJavaScript(`
    new Promise(async (resolve, reject) => {
      try {
        const views = ${JSON.stringify(views)};
        const loadedImgs = {};

        // Preload all view images
        for (const v of views) {
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = 'file:///' + v.file;
          });
          loadedImgs[v.name] = img;
        }

        const width = 440;
        const height = 720;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const stream = canvas.captureStream(30);
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3500000 });
        const chunks = [];

        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        };

        recorder.start();

        // Animation Timeline:
        // Total duration: ~10 seconds at 30fps = 300 frames
        // Scene 1: Tasks view (frames 0 - 55) with cursor hover
        // Scene 2: Click to Diary (frames 55 - 110)
        // Scene 3: Click to Focus Studio (frames 110 - 165)
        // Scene 4: Click to Rhythm Analytics (frames 165 - 225)
        // Scene 5: Click to Day Planner (frames 225 - 275)
        // Scene 6: Open Raycast Palette (frames 275 - 330)

        let cursorX = 220;
        let cursorY = 300;
        let cursorClicking = false;

        function drawCursor(x, y, clicking) {
          ctx.save();
          ctx.translate(x, y);
          // Sleek neon pointer
          ctx.fillStyle = clicking ? '#38bdf8' : '#ffffff';
          ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
          ctx.shadowBlur = clicking ? 12 : 6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 16);
          ctx.lineTo(4, 12);
          ctx.lineTo(9, 20);
          ctx.lineTo(12, 18);
          ctx.lineTo(7, 10);
          ctx.lineTo(13, 10);
          ctx.closePath();
          ctx.fill();
          if (clicking) {
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }

        const totalFrames = 330;
        for (let f = 0; f < totalFrames; f++) {
          let activeViewName = 'tasks';
          let targetX = 60;
          let targetY = 38;

          if (f < 55) {
            activeViewName = 'tasks';
            targetX = 140;
            targetY = 220;
          } else if (f < 110) {
            activeViewName = 'diary';
            targetX = 200;
            targetY = 280;
          } else if (f < 165) {
            activeViewName = 'focus';
            targetX = 220;
            targetY = 260;
          } else if (f < 225) {
            activeViewName = 'analytics';
            targetX = 220;
            targetY = 320;
          } else if (f < 275) {
            activeViewName = 'planner';
            targetX = 200;
            targetY = 240;
          } else {
            activeViewName = 'palette';
            targetX = 220;
            targetY = 180;
          }

          cursorClicking = (f === 54 || f === 109 || f === 164 || f === 224 || f === 274);

          // Smooth lerp cursor
          cursorX += (targetX - cursorX) * 0.15;
          cursorY += (targetY - cursorY) * 0.15;

          // Draw base background
          ctx.fillStyle = '#030712';
          ctx.fillRect(0, 0, width, height);

          // Draw active screenshot
          const img = loadedImgs[activeViewName];
          if (img) {
            // Draw image fitted to canvas
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Subtle scanline / ambient glow
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.03)');
          grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0.03)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Draw pointer
          drawCursor(cursorX, cursorY, cursorClicking);

          // Yield to let recorder grab frame
          await new Promise(r => setTimeout(r, 28));
        }

        recorder.stop();
      } catch (err) {
        reject(err.message || String(err));
      }
    });
  `);

  console.log('Video recording finished! Writing WebM files...');
  const videoBuffer = Buffer.from(videoBase64, 'base64');
  console.log(`Video buffer size: ${videoBuffer.length} bytes`);

  const outFiles = [
    path.join(docsAssets, 'app-tour.webm'),
    path.join(docsAssets, 'hero-loop.webm'),
    path.join(projectRoot, 'assets', 'app-tour.webm'),
    path.join(projectRoot, 'docs', 'app-tour.webm')
  ];

  outFiles.forEach(f => {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, videoBuffer);
    console.log(`✔ Written: ${f}`);
  });

  console.log('🎉 WebM video generated successfully!');
  win.close();
  app.exit(0);
});
