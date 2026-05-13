# Wakeful

**Keep your Google Colab sessions alive during long training runs.**

A clean, open-source Chrome extension built on Manifest V3. No sketchy permissions, no closed-source binaries but just a few hundred lines of JavaScript you can read yourself.

---

## The Problem

You kick off a 7-hour training job on Colab. You go to sleep and with no mouse input, your computer goes to sleep. Session dies. You wake up to nothing hoping that you have your training all done.

Existing extensions (Colab Alive, Colab Auto Reconnect) were all built in 2020–2021 on Manifest V2, which Chrome is phasing out. Wakeful is the most up to date with aesthetically pleasing UI.

---

## How It Works

Wakeful solves two separate problems:

**1. Prevents your computer from sleeping**
Uses the browser's native [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — a modern web standard that tells the OS not to sleep. No system hacks, no native code needed.

**2. Prevents Colab's inactivity timeout**
Simulates subtle activity (mouse events) every 30 seconds inside your Colab tab so Colab's idle detector doesn't trigger.

**3. Auto-reconnects if the session drops**
Checks every 20 seconds for Colab's reconnect button and clicks it automatically.

---

## Install (Developer Mode)

Until this is on the Chrome Web Store:

1. Download or clone this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `wakeful` folder

That's it. The extension icon appears in your toolbar.

---

## Usage

1. Open your Google Colab notebook
2. Click the Wakeful icon in your toolbar
3. Toggle it **ON**
4. Start your training run — walk away

The popup shows:
- Active/Inactive status
- Session uptime
- Whether Wake Lock was successfully acquired

---

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Detect when you're on a Colab tab |
| `scripting` | Inject the keep-alive script into your Colab tab |
| `storage` | Remember your on/off preference across sessions |
| `alarms` | (Reserved for future scheduled checks) |

No access to your Google account. No network requests. No data collection.

---

## Browser Support

| Browser | Wake Lock | Keep-Alive |
|---|---|---|
| Chrome 92+ | ✅ | ✅ |
| Edge 92+ | ✅ | ✅ |
| Firefox | ❌ (API not supported) | ✅ |
| Safari | ❌ | ✅ |

Chrome is recommended for full functionality.

---

## Contributing

PRs welcome. Keep it simple — this tool should stay small and auditable.

---

## License

MIT
