# Wakeful

**Keeps your Google Colab™ sessions alive during long training runs.**

![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

<img width="300" height="200" alt="Wakeful_Image1" src="https://github.com/user-attachments/assets/896b0c1c-7ab9-4042-b03d-9dabd269ba30" />
<img width="300" height="200" alt="Wakeful_Image2" src="https://github.com/user-attachments/assets/a1462462-960b-4cda-8db1-b0cf67c8641d" />
<img width="300" height="200" alt="Wakeful_Image3" src="https://github.com/user-attachments/assets/a682a6f8-c896-4388-ae29-094e6c1be0a7" />

---

## The Story

I spent $33 on a physical mouse jiggler because my Colab sessions kept dying overnight. Every existing Chrome extension fix was broken — all built in 2020–2021 on Manifest V2, which Chrome is phasing out.

So I built Wakeful. It uses the browser's native Screen Wake Lock API — no hardware, no hacks, no $33.

---

## How It Works

**1. Prevents your computer from sleeping**
Uses the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — a modern web standard that tells your OS not to sleep while a Colab tab is active. No native code, no system hacks.

**2. Prevents Colab's inactivity timeout**
Simulates subtle mouse activity every 30 seconds inside your Colab tab so Colab's idle detector never triggers.

**3. Auto-reconnects if the session drops**
Checks every 20 seconds for Colab's reconnect button and clicks it automatically.

---

## Install

### Chrome Web Store *(coming soon)*

### Developer Mode (available now)
1. Clone or download this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `Wakeful` folder

---

## Usage

1. Open a Google Colab™ notebook
2. Click the Wakeful icon in your toolbar
3. Toggle **ON**
4. Start your training run and walk away

The popup shows active status, session uptime, and wake lock confirmation.

---

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Detect when you're on a Colab tab |
| `storage` | Remember your on/off preference |

No Google account access. No network requests. No data collection.

---

## Why not the existing extensions?

| Extension | Last updated | Manifest | Works? |
|---|---|---|---|
| Colab Alive | 2021 | V2 | ❌ Broken |
| Colab Auto Reconnect | 2020 | V2 | ❌ Removed from store |
| Google Colab Keep-Alive | 2023 | V2 | ⚠️ Inconsistent |
| **Wakeful** | **2026** | **V3** | **✅** |

---

## Browser Support

| Browser | Wake Lock | Keep-Alive |
|---|---|---|
| Chrome 92+ | ✅ | ✅ |
| Edge 92+ | ✅ | ✅ |
| Firefox | ❌ | ✅ |

---

## License

MIT
