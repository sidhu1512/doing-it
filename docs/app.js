/**
 * Doing It — Product Website Client Controller
 * Interactive Tab Switcher, Lightbox Zoom, FAQ Accordion, and Smooth Navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Showcase Tab Switcher
  const tabs = document.querySelectorAll('.tab-btn');
  const showcaseImg = document.getElementById('showcase-image');
  const showcaseCaption = document.getElementById('showcase-caption');

  const tabData = {
    tasks: {
      img: 'imgs/tasks-view.png',
      caption: '<strong>Tasks & Habit Engine:</strong> Smart categorization across Today, Upcoming, and Completed with natural language date parsing, priority tags, and midnight habit auto-reset.'
    },
    focus: {
      img: 'imgs/focus-view.png',
      caption: '<strong>Focus Studio & Spotify Sync:</strong> 603px circular countdown with Web Audio procedural soundscapes (Brown Noise, Rainfall, Forest Breeze, Lo-Fi Calm) and live desktop Spotify track control.'
    },
    notes: {
      img: 'imgs/notes-view.png',
      caption: '<strong>Notes & Instant Scratchpad:</strong> GitHub Flavored Markdown with interactive subtask checkboxes, auto-saving instant scratchpad, hashtag filtering, and rich link previews.'
    },
    planner: {
      img: 'imgs/planner-view.png',
      caption: '<strong>Day Planner & RFC 5545 Calendar:</strong> Synced external iCal feeds (Google Calendar, Outlook, Apple Calendar) with 1-click meeting launcher for Google Meet, Zoom, and Teams.'
    },
    palette: {
      img: 'imgs/palette-view.png',
      caption: '<strong>Raycast-Style Command Palette (Ctrl+K):</strong> Lightning-fast unified search across all tasks, markdown notes, calendar meetings, and window system commands.'
    },
    minitimer: {
      img: 'imgs/mini-timer.png',
      caption: '<strong>Detached Picture-in-Picture Mini-Timer:</strong> Floating always-on-top countdown pill with direct play/pause controls, task ticker, and instant completion check.'
    },
    settings: {
      img: 'imgs/settings-view.png',
      caption: '<strong>In-App Preferences & Data Protection:</strong> Integrated modal settings with 7 luxury glass themes, Always-On-Top toggle, and 1-click JSON backup export/restore.'
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const key = tab.getAttribute('data-tab');
      if (tabData[key]) {
        showcaseImg.style.opacity = '0';
        showcaseImg.style.transform = 'scale(0.98)';
        setTimeout(() => {
          showcaseImg.src = tabData[key].img;
          showcaseImg.alt = key + ' preview';
          showcaseCaption.innerHTML = tabData[key].caption;
          showcaseImg.style.opacity = '1';
          showcaseImg.style.transform = 'scale(1)';
        }, 150);
      }
    });
  });

  // 2. Lightbox Zoom for Showcase Image
  const imgWrap = document.querySelector('.showcase-img-wrap');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');

  if (imgWrap && lightbox && lightboxImg) {
    imgWrap.addEventListener('click', () => {
      lightboxImg.src = showcaseImg.src;
      lightbox.style.display = 'flex';
    });

    lightbox.addEventListener('click', () => {
      lightbox.style.display = 'none';
    });
  }

  // 3. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 4. Smooth Anchor Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
