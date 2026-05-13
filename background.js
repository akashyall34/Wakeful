/**
 * Wakeful — Background Service Worker
 * Tracks enabled state, manages badge, relays messages to content scripts.
 */

// ── Badge helpers ─────────────────────────────────────────────────────────────

function setBadgeOn() {
  chrome.action.setBadgeText({ text: 'ON' });
  chrome.action.setBadgeBackgroundColor({ color: '#00C853' });
}

function setBadgeOff() {
  chrome.action.setBadgeText({ text: '' });
}

// ── Send message to all Colab tabs ────────────────────────────────────────────

async function messageColabTabs(message) {
  const tabs = await chrome.tabs.query({ url: 'https://colab.research.google.com/*' });
  const results = await Promise.allSettled(
    tabs.map(tab => chrome.tabs.sendMessage(tab.id, message))
  );
  return results;
}

// ── Listen for messages from content script / popup ──────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {

    case 'TOGGLE': {
      chrome.storage.local.get(['enabled'], async (result) => {
        const newState = !result.enabled;
        await chrome.storage.local.set({ enabled: newState });

        if (newState) {
          setBadgeOn();
          await messageColabTabs({ type: 'START' });
        } else {
          setBadgeOff();
          await messageColabTabs({ type: 'STOP' });
        }

        sendResponse({ enabled: newState });
      });
      return true; // keep message channel open for async
    }

    case 'SET_ENABLED': {
      const { enabled } = message;
      chrome.storage.local.set({ enabled }, async () => {
        if (enabled) {
          setBadgeOn();
          await messageColabTabs({ type: 'START' });
        } else {
          setBadgeOff();
          await messageColabTabs({ type: 'STOP' });
        }
        sendResponse({ ok: true });
      });
      return true;
    }

    case 'GET_STATE': {
      chrome.storage.local.get(['enabled'], (result) => {
        sendResponse({ enabled: !!result.enabled });
      });
      return true;
    }

    case 'RECONNECTED': {
      // Content script tells us it auto-reconnected — log it
      console.log('[Wakeful] Auto-reconnected at', new Date(message.timestamp).toLocaleTimeString());
      break;
    }
  }
});

// ── On install: set default state ─────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: false });
  setBadgeOff();
});

// ── Restore badge on startup ──────────────────────────────────────────────────

chrome.storage.local.get(['enabled'], (result) => {
  if (result.enabled) setBadgeOn();
});
