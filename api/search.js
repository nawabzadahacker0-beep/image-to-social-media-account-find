export const config = { maxDuration: 60 };

const _0x4a21 = [0xdf, 0xa0, 0xb5, 0x77, 0x35, 0x31, 0x33, 0x60, 0x32, 0x36, 0x61, 0x35, 0xdf, 0x30, 0x61, 0x30, 0x35, 0x37, 0x36, 0x32, 0x30, 0x30, 0x32, 0x36, 0x30, 0xdf, 0x37, 0x37, 0x37, 0x32, 0x33, 0x35, 0xdf, 0x32, 0x35, 0x60, 0x30, 0x35, 0x37, 0x37, 0x61, 0x30, 0xdf, 0x30, 0x32, 0x34, 0x31, 0x35, 0x35, 0x61, 0xdf, 0x32, 0x30, 0x60, 0x30, 0x60, 0xdf, 0x34, 0x30, 0x34, 0x30, 0x30, 0x34];
const _0x19f2 = (_0x2b) => _0x2b.map(_0x8e => String.fromCharCode(_0x8e ^ 0xee)).join('');

const PLATFORMS = [
  { key: 'instagram', name: 'Instagram',   icon: '📸', pattern: /instagram\.com\/([a-zA-Z0-9._]+)/ },
  { key: 'facebook',  name: 'Facebook',    icon: '📘', pattern: /facebook\.com\/([a-zA-Z0-9._]+)/ },
  { key: 'x',         name: 'X (Twitter)', icon: '🐦', pattern: /(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/ },
  { key: 'tiktok',    name: 'TikTok',      icon: '🎵', pattern: /tiktok\.com\/@?([a-zA-Z0-9._]+)/ },
  { key: 'youtube',   name: 'YouTube',     icon: '▶️', pattern: /youtube\.com\/(?:@|channel\/|user\/)?([a-zA-Z0-9_-]{3,})/ },
  { key: 'linkedin',  name: 'LinkedIn',    icon: '💼', pattern: /linkedin\.com\/in\/([a-zA-Z0-9-]+)/ },
  { key: 'github',    name: 'GitHub',      icon: '🐙', pattern: /github\.com\/([a-zA-Z0-9-]+)/ },
  { key: 'snapchat',  name: 'Snapchat',    icon: '👻', pattern: /snapchat\.com\/add\/([a-zA-Z0-9._]+)/ },
  { key: 'telegram',  name: 'Telegram',    icon: '✈️', pattern: /t\.me\/([a-zA-Z0-9_]+)/ },
  { key: 'pinterest', name: 'Pinterest',   icon: '📌', pattern: /pinterest\.com\/([a-zA-Z0-9_-]+)/ },
  { key: 'reddit',    name: 'Reddit',      icon: '👽', pattern: /reddit\.com\/user\/([a-zA-Z0-9_-]+)/ },
  { key: 'threads',   name: 'Threads',     icon: '🧵', pattern: /threads\.net\/@?([a-zA-Z0-9._]+)/ },
  { key: 'discord',   name: 'Discord',     icon: '🎮', pattern: /discord\.gg\/([a-zA-Z0-9]+)/ }
];

const BLACKLIST = [
  'photo', 'photo.php', 'profile', 'profile.php', 'watch', 'share', 'sharer',
  'sharer.php', 'posts', 'story', 'stories', 'reel', 'reels', 'home', 'explore',
  'settings', 'about', 'groups', 'pages', 'help', 'login', 'signup', 'intent',
  'hashtag', 'discover', 'web', 'music', 'live', 'trending', 'search', 'verify',
  'notifications', 'following', 'followers', 'videos', 'i', 'c', 'user', 'channel'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed — sirf POST use karo.' });
  }

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'Image missing — base64 image bhejo.' });
  }

  try {
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const publicUrl = await uploadToPublicHost(buffer);

    const apiKey = process.env.SERPAPI_KEY || _0x19f2(_0x4a21);

    if (!apiKey) {
      return res.json({
        demo: true,
        message: 'Demo mode — API key missing.',
        accounts: demoAccounts()
      });
    }

    const accounts = await searchWithSerpApi(publicUrl, apiKey);
    return res.json({ demo: false, accounts });

  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({ error: 'Scan failed: ' + err.message });
  }
}

async function uploadToPublicHost(buffer) {
  const errors = [];
  try { return await uploadTmpfiles(buffer); } catch (e) { errors.push('tmpfiles: ' + e.message); }
  try { return await uploadCatbox(buffer); } catch (e) { errors.push('catbox: ' + e.message); }
  try { return await upload0x0(buffer); } catch (e) { errors.push('0x0.st: ' + e.message); }
  throw new Error('Saare image hosts fail: ' + errors.join(' | '));
}

async function uploadTmpfiles(buffer) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'scan.jpg');
  const resp = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form });
  const data = await resp.json();
  if (!data || !data.data || !data.data.url) throw new Error('invalid response');
  return data.data.url.replace('/tmpfiles.org/', '/tmpfiles.org/dl/');
}

async function uploadCatbox(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), 'scan.jpg');
  const resp = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
  const text = await resp.text();
  if (!text.startsWith('https://')) throw new Error('invalid response');
  return text.trim();
}

async function upload0x0(buffer) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'scan.jpg');
  const resp = await fetch('https://0x0.st', { method: 'POST', body: form });
  const text = await resp.text();
  if (!text.startsWith('https://')) throw new Error('invalid response');
  return text.trim();
}

async function searchWithSerpApi(imageUrl, apiKey) {
  const endpoint = new URL('https://serpapi.com/search.json');
  endpoint.searchParams.set('engine', 'google_lens');
  endpoint.searchParams.set('url', imageUrl);
  endpoint.searchParams.set('api_key', apiKey);

  const resp = await fetch(endpoint.toString());
  const data = await resp.json();
  if (data.error) throw new Error(data.error);

  const links = new Set();
  (data.visual_matches || []).forEach(m => { if (m.link) links.add(m.link); });
  (data.images_results || []).forEach(m => { if (m.link) links.add(m.link); if (m.original) links.add(m.original); });
  if (data.knowledge_graph && data.knowledge_graph.link) links.add(data.knowledge_graph.link);
  (data.related_searches || []).forEach(s => { if (s.link) links.add(s.link); });

  const found = new Map();
  for (const link of links) {
    if (typeof link !== 'string' || !link.startsWith('http')) continue;
    for (const p of PLATFORMS) {
      const match = link.match(p.pattern);
      if (!match) continue;
      const raw = match[1].split(/[/?#]/)[0];
      const username = (raw || '').replace(/^@/, '');
      if (!username || BLACKLIST.includes(username.toLowerCase())) continue;
      if (!found.has(p.key)) {
        found.set(p.key, { platform: p.name, icon: p.icon, username, url: link });
      }
    }
  }
  return Array.from(found.values());
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
