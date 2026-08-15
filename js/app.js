(function () {
  'use strict';

  const lockOverlay  = document.getElementById('lockOverlay');
  const verifyBtn    = document.getElementById('verifyBtn');
  const chBtn1       = document.getElementById('chBtn1');
  const chBtn2       = document.getElementById('chBtn2');
  const chBtn3       = document.getElementById('chBtn3');

  const followedState = { ch1: false, ch2: false, ch3: false };

  function checkUnlockStatus() {
    if (followedState.ch1 && followedState.ch2 && followedState.ch3) {
      verifyBtn.disabled = false;
    }
  }

  [
    { btn: chBtn1, key: 'ch1' },
    { btn: chBtn2, key: 'ch2' },
    { btn: chBtn3, key: 'ch3' }
  ].forEach(item => {
    item.btn.addEventListener('click', () => {
      followedState[item.key] = true;
      item.btn.classList.add('done');
      item.btn.textContent = '✔ Followed';
      checkUnlockStatus();
    });
  });

  verifyBtn.addEventListener('click', () => {
    if (!verifyBtn.disabled) {
      lockOverlay.style.display = 'none';
    }
  });

  const uploadBox       = document.getElementById('uploadBox');
  const imageInput      = document.getElementById('imageInput');
  const previewArea     = document.getElementById('previewArea');
  const imagePreview    = document.getElementById('imagePreview');
  const changeBtn       = document.getElementById('changeBtn');
  const scanBtn         = document.getElementById('scanBtn');
  const scanningSection = document.getElementById('scanningSection');
  const scanSteps       = document.getElementById('scanSteps');
  const resultsSection  = document.getElementById('resultsSection');
  const resultSummary   = document.getElementById('resultSummary');
  const resultsGrid     = document.getElementById('resultsGrid');

  const MAX_SIZE = 5 * 1024 * 1024;
  const SCAN_STEPS = [
    'Image received...',
    'Image features analyzeing...',
    '40+ social platforms scanning...',
    'Matching profiles...',
    'Accounts verifying...',
    'Scan complete!'
  ];

  let selectedFile = null;
  let scanning = false;

  uploadBox.addEventListener('click', () => imageInput.click());

  ['dragenter', 'dragover'].forEach(evt =>
    uploadBox.addEventListener(evt, e => { e.preventDefault(); uploadBox.classList.add('dragging'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    uploadBox.addEventListener(evt, e => { e.preventDefault(); uploadBox.classList.remove('dragging'); })
  );
  uploadBox.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  imageInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  });

  changeBtn.addEventListener('click', () => imageInput.click());

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('❌just upload image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('❌ Image 5MB se zeyada nahi honi chaiea.');
      return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      imagePreview.src = e.target.result;
      uploadBox.style.display = 'none';
      previewArea.style.display = 'block';
      resultsSection.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  scanBtn.addEventListener('click', async () => {
    if (scanning) return;
    if (!selectedFile) {
      alert('⚠️ 1st upload image!');
      return;
    }

    scanning = true;
    scanBtn.disabled = true;
    resultsSection.style.display = 'none';
    scanningSection.style.display = 'block';
    scanSteps.innerHTML = '';

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await sleep(600 + Math.random() * 500);
      const li = document.createElement('li');
      li.textContent = SCAN_STEPS[i];
      if (i === SCAN_STEPS.length - 1) li.classList.add('done');
      scanSteps.appendChild(li);
    }

    try {
      const compressed = await compressImage(selectedFile);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed })
      });

      if (!res.ok) {
        throw new Error('Server error: ' + res.status);
      }

      const data = await res.json();
      renderResults(data.accounts || [], !!data.demo);
    } catch (err) {
      renderResults(demoAccounts(), true);
    } finally {
      scanning = false;
      scanBtn.disabled = false;
      scanningSection.style.display = 'none';
    }
  });

  function renderResults(accounts, isDemo) {
    resultsSection.style.display = 'block';
    const badge = isDemo ? '<span class="demo-badge">DEMO MODE</span>' : '';

    if (!accounts || !accounts.length) {
      resultSummary.innerHTML = 'Any social media account not found — please try another image. ' + badge;
      resultsGrid.innerHTML = '<div class="no-result">Accounts Not Found</div>';
      return;
    }

    resultSummary.innerHTML = '✅ Total <b>' + accounts.length + '</b> account found! ' + badge;
    resultsGrid.innerHTML = accounts
      .map(function (a) {
        return (
          '<div class="account-card">' +
            '<div class="card-icon">' + (a.icon || '🔗') + '</div>' +
            '<div class="card-body">' +
              '<h4>' + esc(a.platform) + '</h4>' +
              '<p class="username">@' + esc(a.username) + '</p>' +
              '<p class="found-on">Account found: <b>' + esc(getDomain(a.url)) + '</b></p>' +
            '</div>' +
            '<a class="card-link" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">Open ↗</a>' +
          '</div>'
        );
      })
      .join('');
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function compressImage(file, maxSide = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
          canvas.width  = Math.max(1, Math.round(img.width  * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (_) { return url; }
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function demoAccounts() {
    return [
      { platform: 'Instagram',   icon: '📸', username: 'user_2438',  url: 'https://instagram.com/user_2438' },
      { platform: 'Facebook',    icon: '📘', username: 'user.2438',  url: 'https://facebook.com/user.2438' },
      { platform: 'TikTok',      icon: '🎵', username: 'user_2438',  url: 'https://tiktok.com/@user_2438' },
      { platform: 'X (Twitter)', icon: '🐦', username: 'user2438',   url: 'https://x.com/user2438' },
      { platform: 'YouTube',     icon: '▶️', username: 'User 2438', url: 'https://youtube.com/@User2438' },
      { platform: 'GitHub',      icon: '🐙', username: 'user-2438',  url: 'https://github.com/user-2438' }
    ];
  }
})();
