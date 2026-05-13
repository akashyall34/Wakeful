/**
 * Wakeful — Content Script
 * Runs inside colab.research.google.com tabs.
 * Handles:
 *   1. Screen Wake Lock API — prevents macOS/OS from sleeping
 *   2. Activity simulation — prevents Colab's inactivity timeout
 *   3. Auto-reconnect — clicks the reconnect button if session drops
 */

let wakeLock = null;
let keepAliveInterval = null;
let reconnectInterval = null;
let isActive = false;
let startTime = null;

// ── Wake Lock ─────────────────────────────────────────────────────────────────

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('[Wakeful] Wake Lock API not supported in this browser.');
    return false;
  }
  if (document.visibilityState !== 'visible') {
    return false; // visibilitychange listener will acquire when tab becomes active
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      // Re-acquire if the page is still visible and we're still active
      if (isActive && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });
    return true;
  } catch (err) {
    console.warn('[Wakeful] Wake Lock failed:', err.message);
    return false;
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

// Re-acquire wake lock when tab becomes visible again (e.g. switching back)
document.addEventListener('visibilitychange', async () => {
  if (isActive && document.visibilityState === 'visible' && !wakeLock) {
    await requestWakeLock();
  }
});

// ── Activity Simulation ───────────────────────────────────────────────────────

function simulateActivity() {
  // Dispatch subtle mouse/keyboard events so Colab doesn't think you're idle
  document.dispatchEvent(new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    clientX: Math.floor(Math.random() * window.innerWidth),
    clientY: Math.floor(Math.random() * window.innerHeight)
  }));
}

// ── Auto-Reconnect ────────────────────────────────────────────────────────────

function tryReconnect() {
  // Colab's connect button — try both the custom element and fallback selectors
  const selectors = [
    'colab-connect-button',
    '#connect',
    '[data-testid="connect-button"]',
    '.colab-connect-button'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      // Only click if the button text suggests we're disconnected
      const text = el.textContent || el.innerText || '';
      if (/connect|reconnect/i.test(text)) {
        el.click();
        notifyBackground({ type: 'RECONNECTED', timestamp: Date.now() });
        return;
      }
      // Also check shadow DOM
      const shadow = el.shadowRoot;
      if (shadow) {
        const btn = shadow.querySelector('paper-button, button');
        if (btn) {
          const btnText = btn.textContent || '';
          if (/connect|reconnect/i.test(btnText)) {
            btn.click();
            notifyBackground({ type: 'RECONNECTED', timestamp: Date.now() });
            return;
          }
        }
      }
    }
  }
}

// ── Messaging ─────────────────────────────────────────────────────────────────

function notifyBackground(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

function broadcastStatus() {
  const uptime = isActive && startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    isActive,
    uptime,
    hasWakeLock: wakeLock !== null,
    tabId: null
  }).catch(() => {});
}

// ── Start / Stop ──────────────────────────────────────────────────────────────

async function start() {
  if (isActive) return;
  isActive = true;
  startTime = Date.now();

  await requestWakeLock();

  // Simulate activity every 30 seconds
  keepAliveInterval = setInterval(simulateActivity, 30_000);

  // Check for disconnection every 20 seconds
  reconnectInterval = setInterval(tryReconnect, 20_000);

  broadcastStatus();
  console.log('[Wakeful] Started. Wake lock:', wakeLock !== null);
}

async function stop() {
  if (!isActive) return;
  isActive = false;
  startTime = null;

  await releaseWakeLock();

  clearInterval(keepAliveInterval);
  clearInterval(reconnectInterval);
  keepAliveInterval = null;
  reconnectInterval = null;

  broadcastStatus();
  console.log('[Wakeful] Stopped.');
}

// ── Message Listener (from popup / background) ────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'START':
      start().then(() => sendResponse({ ok: true }));
      return true;
    case 'STOP':
      stop().then(() => sendResponse({ ok: true }));
      return true;
    case 'GET_STATUS': {
      const uptime = isActive && startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      sendResponse({
        isActive,
        uptime,
        hasWakeLock: wakeLock !== null
      });
      break;
    }
  }
});

// ── Auto-start: restore state from storage ────────────────────────────────────

chrome.storage.local.get(['enabled'], (result) => {
  if (result.enabled) {
    start();
  }
});
