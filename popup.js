/**
 * Wakeful — Popup Script
 */

let uptimeInterval = null;
let sessionStart = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function updateUptimeDisplay() {
  if (!sessionStart) return;
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  const el = document.getElementById('uptime-value');
  if (el) el.textContent = formatUptime(elapsed);
}

// ── UI State ──────────────────────────────────────────────────────────────────

function setUI(enabled, wakeLockActive) {
  const toggle = document.getElementById('toggle');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const uptimeRow = document.getElementById('uptime-row');
  const wakeLockRow = document.getElementById('wakelock-row');
  const wakeLockVal = document.getElementById('wakelock-value');

  toggle.checked = enabled;

  if (enabled) {
    statusDot.className = 'dot active';
    statusText.textContent = 'Active';
    uptimeRow.style.display = 'flex';
    wakeLockRow.style.display = 'flex';
  } else {
    statusDot.className = 'dot';
    statusText.textContent = 'Inactive';
    uptimeRow.style.display = 'none';
    wakeLockRow.style.display = 'none';
  }

  if (wakeLockVal) {
    wakeLockVal.textContent = wakeLockActive ? 'Acquired ✓' : 'Not available';
    wakeLockVal.style.color = wakeLockActive ? 'var(--green)' : 'var(--muted)';
  }
}

async function getColabStatus(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'GET_STATUS' });
  } catch {
    return null;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const { enabled } = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

  const noColabMsg = document.getElementById('no-colab');
  const mainContent = document.getElementById('main');

  // Check if any Colab tab is open
  const tabs = await chrome.tabs.query({ url: 'https://colab.research.google.com/*' });
  const hasColabTab = tabs.length > 0;

  if (!hasColabTab) {
    noColabMsg.style.display = 'block';
    mainContent.style.opacity = '0.4';
    mainContent.style.pointerEvents = 'none';
    // Only block turning ON — always allow turning OFF
    if (!enabled) document.getElementById('toggle').disabled = true;
  }

  let wakeLockActive = false;

  if (hasColabTab && enabled) {
    const status = await getColabStatus(tabs[0].id);
    if (status) {
      wakeLockActive = status.hasWakeLock;
      if (status.uptime > 0) {
        sessionStart = Date.now() - (status.uptime * 1000);
        updateUptimeDisplay();
        uptimeInterval = setInterval(updateUptimeDisplay, 1000);
      }
    }
  }

  setUI(enabled, wakeLockActive);
}

// ── Toggle ────────────────────────────────────────────────────────────────────

document.getElementById('toggle').addEventListener('change', async (e) => {
  const enabled = e.target.checked;

  // Block turning ON if no Colab tab is open
  if (enabled) {
    const colabTabs = await chrome.tabs.query({ url: 'https://colab.research.google.com/*' });
    if (colabTabs.length === 0) {
      e.target.checked = false;
      return;
    }
  }

  const { enabled: newState } = await chrome.runtime.sendMessage({
    type: 'TOGGLE'
  });

  if (newState) {
    sessionStart = Date.now();
    clearInterval(uptimeInterval);
    uptimeInterval = setInterval(updateUptimeDisplay, 1000);
    updateUptimeDisplay();
  } else {
    sessionStart = null;
    clearInterval(uptimeInterval);
    document.getElementById('uptime-value').textContent = '0s';
  }

  // Get updated wake lock status
  const tabs = await chrome.tabs.query({ url: 'https://colab.research.google.com/*' });
  let wakeLockActive = false;
  if (tabs.length > 0) {
    setTimeout(async () => {
      const status = await getColabStatus(tabs[0].id);
      if (status) {
        setUI(newState, status.hasWakeLock);
      }
    }, 300);
  }

  setUI(newState, wakeLockActive);
});

// ── Open Colab link ───────────────────────────────────────────────────────────

document.getElementById('open-colab')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://colab.research.google.com' });
});

// ── Run ───────────────────────────────────────────────────────────────────────

init();
