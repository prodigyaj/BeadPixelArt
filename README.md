# BeadPixel Art Studio

> **Created with ❤️ by Ajay & Moss**  
> An interactive web application engineered for **thread-based bead wall hangings and tapestries**, featuring **6×9mm pony beads as default**, column-wise **threading instructions (Word Chart) top-down or bottom-up**, a step-by-step **assembly companion**, an itemized **color shopping list**, **minority-to-majority optimizer**, **exact 1:1 pixel matrix mode**, **HTTPS security**, and **local friendly DNS (mDNS) sharing for iOS and Android**.

---

## ✨ Key Features

- **Created by Ajay & Moss**: Thoughtfully designed with craft-first workflows for thread tapestries.
- **6×9 mm Pony Beads Default**: Calibrated to standard $9\text{mm}$ width $\times$ $6\text{mm}$ height barrel pony beads with non-square pixel aspect ratio correction ($1.5:1$). Also supports 5mm Midi Perler, 2.6mm Mini Perler, Delica seed beads, and custom millimeter dimensions.
- **Column-Wise Threading, Your Direction**: Beads are strung column-by-column, either top-down (thread tied to the dowel first, the default) or bottom-up (knot or stopper bead first). The guide, pattern, Word Chart, and CSV all follow the chosen direction.
- **Interactive Loom Assistant**: Step through beads hands-free with Spacebar (`Space` = step up, `← / →` = switch thread), highlighted on the 3D bead canvas with completion confetti.
- **Minority → Majority Color Optimizer**: Interactive slider by project percentage or bead count that automatically merges low-count colors into your existing majority purchases to eliminate wasted 1,000-piece bags.
- **Manual Color Regrouping**: Replace any color with another artwork color or catalog color, with real-time live preview before confirming.
- **Exact 1:1 Pixel Matrix Mode**: Directly analyzes native pixel art pictures with zero downsampling and zero distortion (1 pixel = 1 bead).
- **Custom Bead Inventory Whitelist**: Pick only the colors you own or want to use, and let the app dither and blend them optimally.
- **In-Room Wall Preview**: Visualizes the finished tapestry hanging from a wooden craft dowel rod on a wall.
- **Printable Word Chart & Exports**: Export Word Chart text guides with Ajay & Moss headers, high-res PNG patterns, and CSV matrix spreadsheets.
- **HTTPS & Local Friendly DNS**: Zero-config HTTPS with built-in mDNS responder so you can use friendly URLs instead of raw IP addresses:
  - `https://beadstudio.local:5173/` (Local Friendly Domain)
  - `https://aj.local:5173/` (Device Hostname)
  - `https://<your-LAN-IP>:5173/` (Direct Local Network IP, shown in the terminal and the Wi-Fi Access dialog)
- **Cross-Platform Mobile Touch (iOS & Android)**: Single-finger pan, two-finger pinch-to-zoom, safe-area support, and QR code sharing for phones & tablets next to your beading board.

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Run Locally & on Local Wi-Fi (HTTPS + mDNS)
```bash
npm run dev -- --host
```

When running, the app is instantly accessible via:
1. **Desktop**: [https://localhost:5173/](https://localhost:5173/)
2. **Local Friendly DNS**: `https://beadstudio.local:5173/`
3. **mDNS Device Name**: `https://aj.local:5173/`
4. **Local Wi-Fi IP**: `https://<your-LAN-IP>:5173/` (printed by Vite on startup)

*(Note: Because this is a local development SSL certificate, your browser may show a one-time "Advanced → Proceed" security confirmation).*

### Optional Local PC Hosts File Setup
If you want your desktop PC to resolve `beadstudio.local` directly through the Windows hosts file without querying mDNS:
Run in an Administrator PowerShell:
```powershell
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n127.0.0.1 beadstudio.local"
```

### Production Build
```bash
npm run build
```

---

## 🎨 Authors & Credits
Designed and created by **Ajay & Moss**.
