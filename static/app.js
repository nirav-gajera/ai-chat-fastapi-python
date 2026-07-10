// ── Theme ─────────────────────────────────────────────────────
const root = document.documentElement;
let theme = localStorage.getItem('theme') || 'dark';
root.setAttribute('data-theme', theme);

function setThemeIcons() {
  const icon = theme === 'dark' ? '🌙' : '☀️';
  const label = theme === 'dark' ? 'Dark mode' : 'Light mode';
  ['theme-icon', 'theme-icon-auth'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
  const lbl = document.querySelector('.theme-label');
  if (lbl) lbl.textContent = label;
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  setThemeIcons();
}

// ── State ─────────────────────────────────────────────────────
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let activeConvId = null;

if (token && user) showApp();
else document.getElementById('auth-screen').style.display = 'flex';

// Init theme icons
setThemeIcons();

// ── Modal ─────────────────────────────────────────────────────
let modalCallback = null;

function openModal(icon, title, text, cb) {
  document.getElementById('m-icon').textContent = icon;
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-text').textContent = text;
  modalCallback = cb;
  document.getElementById('confirm-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('open');
  modalCallback = null;
}

function confirmModal() {
  if (modalCallback) modalCallback();
  closeModal();
}

// ── Auth Tabs ─────────────────────────────────────────────────
function switchTab(t) {
  document.getElementById('form-login').style.display = t === 'login' ? '' : 'none';
  document.getElementById('form-register').style.display = t === 'register' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active', t === 'login');
  document.getElementById('tab-register').classList.toggle('active', t === 'register');
  clearErr();
}

function showErr(msg) {
  const el = document.getElementById('auth-err');
  el.textContent = msg; el.style.display = 'block';
}
function clearErr() { document.getElementById('auth-err').style.display = 'none'; }

// Parse Pydantic 422 array or plain string error
function parseErr(data) {
  if (!data.detail) return 'Something went wrong.';
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map(e => {
      const field = e.loc ? e.loc[e.loc.length - 1] : '';
      const label = field ? field.charAt(0).toUpperCase() + field.slice(1) + ': ' : '';
      return label + e.msg;
    }).join(' · ');
  }
  return 'Unexpected error.';
}

// Client-side validators
function validateLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!email) { showErr('Email is required.'); return false; }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showErr('Enter a valid email address.'); return false; }
  if (!pass) { showErr('Password is required.'); return false; }
  return true;
}

function validateRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  if (!name) { showErr('Name is required.'); return false; }
  if (name.length < 2) { showErr('Name must be at least 2 characters.'); return false; }
  if (!email) { showErr('Email is required.'); return false; }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showErr('Enter a valid email address.'); return false; }
  if (!pass) { showErr('Password is required.'); return false; }
  if (pass.length < 6) { showErr('Password must be at least 6 characters.'); return false; }
  return true;
}

// ── Auth ─────────────────────────────────────────────────────
async function doLogin() {
  clearErr();
  if (!validateLogin()) return;
  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const res = await fetch('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-pass').value,
      })
    });
    const data = await res.json();
    if (!res.ok) { showErr(parseErr(data)); return; }
    saveSession(data);
  } catch { showErr('Network error. Is the server running?'); }
  finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function doRegister() {
  clearErr();
  if (!validateRegister()) return;
  const btn = document.getElementById('btn-register');
  btn.disabled = true; btn.textContent = 'Creating…';
  try {
    const res = await fetch('/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-pass').value,
      })
    });
    const data = await res.json();
    if (!res.ok) { showErr(parseErr(data)); return; }
    saveSession(data);
  } catch { showErr('Network error. Is the server running?'); }
  finally { btn.disabled = false; btn.textContent = 'Create Account'; }
}

function saveSession(data) {
  token = data.token;
  user = { name: data.name, email: data.email };
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.location.hash = '';
  showApp();
}

function logout() {
  openModal('➜]', 'Sign Out', 'Are you sure you want to sign out?', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null; user = null; activeConvId = null;
    window.location.hash = '';

    clearMessages(true);
    const convList = document.getElementById('conv-list');
    if (convList) convList.innerHTML = '';
    document.getElementById('user-name-display').textContent = '—';
    document.getElementById('user-email-display').textContent = '—';
    document.getElementById('user-initial').textContent = '?';

    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
  });
}

// ── App ───────────────────────────────────────────────────────
function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  document.getElementById('user-name-display').textContent = user.name;
  document.getElementById('user-email-display').textContent = user.email;
  document.getElementById('user-initial').textContent = user.name[0].toUpperCase();

  clearMessages(true);

  loadConversations().then(() => {
    handleHashRouting();
  });
  setTimeout(() => document.getElementById('msg-input').focus(), 100);
}

// ── Mobile Sidebar ────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── Conversations ─────────────────────────────────────────────
async function loadConversations() {
  const res = await authFetch('/conversations');
  if (!res.ok) return [];
  const list = await res.json();
  renderConvList(list);
  return list;
}

function renderConvList(list) {
  const el = document.getElementById('conv-list');
  if (!list.length) {
    el.innerHTML = '<div class="conv-empty">No conversations yet.<br>Start a new chat!</div>';
    return;
  }
  el.innerHTML = '';
  list.forEach(c => {
    const div = document.createElement('div');
    div.className = 'conv-item' + (c.id === activeConvId ? ' active' : '');
    div.dataset.id = c.id;
    div.innerHTML = `
      <span class="conv-icon">💬</span>
      <span class="conv-title">${esc(c.title)}</span>
      <button class="conv-del" title="Delete" onclick="confirmDelete(event,${c.id})">✕</button>`;
    div.onclick = (e) => {
      if (e.target.classList.contains('conv-del')) return;
      loadConv(c.id, c.title);
      closeSidebar();
    };
    el.appendChild(div);
  });
}

async function loadConv(id, title, updateHash = true) {
  activeConvId = id;
  document.getElementById('chat-title').textContent = title;
  document.querySelectorAll('.conv-item').forEach(el =>
    el.classList.toggle('active', parseInt(el.dataset.id) === id));
  clearMessages(false);
  if (updateHash) {
    window.location.hash = `/c/${id}`;
  }
  const res = await authFetch(`/conversations/${id}/messages`);
  if (!res.ok) return;
  const msgs = await res.json();
  msgs.forEach(m => addMessage(m.role === 'model' ? 'bot' : 'user', m.content));
}

function confirmDelete(e, id) {
  e.stopPropagation();
  openModal('🗑️', 'Delete Chat', 'This conversation will be permanently deleted. Continue?', async () => {
    await authFetch(`/conversations/${id}`, 'DELETE');
    if (activeConvId === id) newChat();
    loadConversations();
  });
}

function newChat(updateHash = true) {
  activeConvId = null;
  document.getElementById('chat-title').textContent = 'New Chat';
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  clearMessages(true);
  if (updateHash) {
    window.location.hash = '/new';
  }
  document.getElementById('msg-input').focus();
  closeSidebar();
}

// ── Messages ──────────────────────────────────────────────────
function clearMessages(showWelcome = false) {
  const el = document.getElementById('messages');
  el.innerHTML = '';
  if (showWelcome) {
    el.innerHTML = `<div class="welcome" id="welcome">
      <div class="wi">🤖</div>
      <h2>What can I help with?</h2>
      <p>Ask me anything — code, concepts, LangChain, RAG, or just chat.</p>
      <div class="chips">
        <button class="chip" onclick="useChip(this)">What is LangChain?</button>
        <button class="chip" onclick="useChip(this)">Explain RAG simply</button>
        <button class="chip" onclick="useChip(this)">What is LangGraph?</button>
        <button class="chip" onclick="useChip(this)">PyTorch vs TensorFlow</button>
      </div></div>`;
  }
}

function addMessage(role, text) {
  document.getElementById('welcome')?.remove();
  const row = document.createElement('div');
  row.className = `msg-row ${role}`;
  const av = document.createElement('div');
  av.className = `avatar ${role}`;
  av.textContent = role === 'user' ? '👤' : '✦';
  const bub = document.createElement('div');
  bub.className = `bubble ${role}`;
  bub.innerHTML = role === 'bot' ? fmt(text) : `<p>${esc(text)}</p>`;
  row.appendChild(av); row.appendChild(bub);
  document.getElementById('messages').appendChild(row);
  scrollBottom();
}

function addTyping() {
  const row = document.createElement('div');
  row.id = 'typing'; row.className = 'typing-row';
  row.innerHTML = `<div class="avatar bot">✦</div>
    <div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  document.getElementById('messages').appendChild(row);
  scrollBottom();
}
function removeTyping() { document.getElementById('typing')?.remove(); }
function scrollBottom() { const m = document.getElementById('messages'); m.scrollTop = m.scrollHeight; }

// ── Input ─────────────────────────────────────────────────────
document.getElementById('msg-input').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
document.getElementById('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function useChip(btn) {
  document.getElementById('msg-input').value = btn.textContent;
  sendMessage();
}

async function sendMessage() {
  const inp = document.getElementById('msg-input');
  const btn = document.getElementById('send-btn');
  const text = inp.value.trim();
  if (!text || btn.disabled) return;

  addMessage('user', text);
  inp.value = ''; inp.style.height = 'auto';
  btn.disabled = true; addTyping();

  try {
    const res = await authFetch('/chat', 'POST', { message: text, conversation_id: activeConvId });
    removeTyping();
    if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Server error'); }
    const data = await res.json();
    addMessage('bot', data.reply);
    if (data.conversation_id !== activeConvId) {
      activeConvId = data.conversation_id;
      window.location.hash = `/c/${activeConvId}`;
    }
    loadConversations();
  } catch (err) {
    removeTyping();
    addMessage('bot', `⚠️ ${err.message}`);
  } finally {
    btn.disabled = false; inp.focus();
  }
}

// ── Helpers ───────────────────────────────────────────────────
function authFetch(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts);
}

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(text) {
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) => `<pre><code>${esc(c.trim())}</code></pre>`);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

// ── Routing ───────────────────────────────────────────────────
function handleHashRouting() {
  if (!token || !user) return;
  const hash = window.location.hash;

  const profileArea = document.getElementById('profile-area');
  const chatArea = document.getElementById('chat-area');
  
  if (hash === '#/profile') {
    if (typeof openProfile === 'function') {
      openProfile(false);
    } else {
      if (profileArea) profileArea.style.display = 'flex';
      if (chatArea) chatArea.style.display = 'none';
    }
    return;
  }
  
  if (profileArea && chatArea && profileArea.style.display !== 'none') {
    profileArea.style.display = 'none';
    chatArea.style.display = 'flex';
  }

  const match = hash.match(/^#\/c\/(\d+)$/);
  if (match) {
    const id = parseInt(match[1]);
    if (activeConvId !== id) {
      let title = 'Chat';
      const item = document.querySelector(`.conv-item[data-id="${id}"]`);
      if (item) {
        title = item.querySelector('.conv-title').textContent;
      }
      loadConv(id, title, false);
    }
  } else if (hash === '#/new' || !hash) {
    if (activeConvId !== null) {
      newChat(false);
    }
  }
}

// ── System Info ────────────────────────────────────────────────
async function loadSystemInfo() {
  try {
    const res = await fetch('/api/info');
    if (res.ok) {
      const data = await res.json();
      const name = data.model;
      ['chat-model-name', 'auth-model-name'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
      });
    }
  } catch (err) {
    console.error('Failed to load system info:', err);
  }
}

window.addEventListener('hashchange', handleHashRouting);

// Load model name on boot
loadSystemInfo();
