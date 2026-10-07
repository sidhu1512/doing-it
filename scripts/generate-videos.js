const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const imgsDir = path.join(projectRoot, 'docs', 'imgs');
const docsAssets = path.join(projectRoot, 'docs', 'assets');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  win.loadURL('about:blank');
  await new Promise(r => win.webContents.once('did-finish-load', r));

  const views = [
    { name: 'tasks', file: path.join(imgsDir, 'tasks-view.png').replace(/\\/g, '/'), title: 'Tasks & Streaks' },
    { name: 'diary', file: path.join(imgsDir, 'diary-view.png').replace(/\\/g, '/'), title: 'Day One Diary' },
    { name: 'focus', file: path.join(imgsDir, 'focus-view.png').replace(/\\/g, '/'), title: 'Focus Studio' },
    { name: 'analytics', file: path.join(imgsDir, 'analytics-view.png').replace(/\\/g, '/'), title: 'Rhythm Analytics' },
    { name: 'planner', file: path.join(imgsDir, 'planner-view.png').replace(/\\/g, '/'), title: 'Day Planner' },
    { name: 'palette', file: path.join(imgsDir, 'palette-view.png').replace(/\\/g, '/'), title: 'Raycast Palette' }
  ];

  console.log('Rendering 880x1080 high-framerate screen recording video in Electron...');

  const videoBase64 = await win.webContents.executeJavaScript(`
    new Promise(async (resolve, reject) => {
      try {
        const views = ${JSON.stringify(views)};
        const loadedImgs = {};

        for (const v of views) {
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = 'file:///' + v.file;
          });
          loadedImgs[v.name] = img;
        }

        const width = 880;
        const height = 1080;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const stream = canvas.captureStream(30);
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
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

        // Authentic macOS/Windows style cursor (crisp white with dark border, soft shadow)
        function drawCursor(x, y, clicking) {
          ctx.save();
          ctx.translate(x, y);

          if (clicking) {
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 20);
          ctx.lineTo(5, 15);
          ctx.lineTo(11, 25);
          ctx.lineTo(14, 23);
          ctx.lineTo(8, 13);
          ctx.lineTo(15, 13);
          ctx.closePath();

          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        }

        // Timeline: 330 frames total (~11 seconds at 30fps)
        let cursorX = 400;
        let cursorY = 500;
        let cursorClicking = false;

        const totalFrames = 330;
        for (let f = 0; f < totalFrames; f++) {
          let activeViewName = 'tasks';
          let targetX = 300;
          let targetY = 320;

          if (f < 55) {
            activeViewName = 'tasks';
            targetX = 95; // Hovering over task or input
            targetY = 510;
          } else if (f < 110) {
            activeViewName = 'diary';
            targetX = 670; // Diary tab
            targetY = 95;
            if (f > 75) {
              targetX = 110;
              targetY = 705; // Hovering Voice button
            }
          } else if (f < 165) {
            activeViewName = 'focus';
            targetX = 380; // Focus tab
            targetY = 95;
            if (f > 130) {
              targetX = 440;
              targetY = 640; // Play button
            }
          } else if (f < 225) {
            activeViewName = 'analytics';
            targetX = 800; // Stats tab
            targetY = 95;
            if (f > 185) {
              targetX = 190;
              targetY = 300; // Optimal pace card
            }
          } else if (f < 275) {
            activeViewName = 'planner';
            targetX = 525; // Plan tab
            targetY = 95;
            if (f > 240) {
              targetX = 440;
              targetY = 400; // Meeting action
            }
          } else {
            activeViewName = 'palette';
            targetX = 440;
            targetY = 280; // Command search box
          }

          cursorClicking = (f === 54 || f === 109 || f === 164 || f === 224 || f === 274);

          cursorX += (targetX - cursorX) * 0.16;
          cursorY += (targetY - cursorY) * 0.16;

          // Pure clean light background
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, width, height);

          const img = loadedImgs[activeViewName];
          if (img) {
            ctx.drawImage(img, 0, 0, width, height);
          }

          drawCursor(cursorX, cursorY, cursorClicking);

          await new Promise(r => setTimeout(r, 26));
        }

        recorder.stop();
      } catch (err) {
        reject(err.message || String(err));
      }
    });
  `);

  console.log('Video recording finished! Writing 880x1080 WebM files...');
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

  console.log('🎉 880x1080 Razor-sharp WebM video generated successfully!');
  win.close();
  app.exit(0);
});
