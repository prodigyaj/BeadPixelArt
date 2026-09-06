# BeadPixel Art Studio

An interactive web application engineered for **thread-based bead wall hangings and tapestries**, featuring **6×9mm pony beads as default**, column-wise **bottom-to-top threading instructions (Word Chart)**, a step-by-step **assembly companion**, an itemized **color shopping list**, **minority-to-majority optimizer**, **exact 1:1 pixel matrix mode**, and **Wi-Fi mobile access for iOS and Android**.

---

## Features

- **6×9 mm Pony Beads Default**: Calibrated to standard $9\text{mm}$ width $\times$ $6\text{mm}$ height barrel pony beads with non-square pixel aspect ratio correction ($1.5:1$). Also supports 5mm Midi Perler, 2.6mm Mini Perler, Delica seed beads, and custom millimeter dimensions.
- **Column-Wise, Bottom-to-Top Threading**: Beads are strung column-by-column strictly from bottom ($Y = 1$) to top ($Y = H$).
- **Interactive Loom Assistant**: Step through beads hands-free with Spacebar (`Space` = step up, `← / →` = switch thread), highlighted on the 3D bead canvas.
- **Minority → Majority Color Optimizer**: Interactive slider by project percentage or bead count that automatically merges low-count colors into your existing majority purchases to eliminate wasted 1,000-piece bags.
- **Manual Color Regrouping**: Replace any color with another artwork color or catalog color, with real-time live preview before confirming.
- **Exact 1:1 Pixel Matrix Mode**: Directly analyzes native pixel art pictures with zero downsampling and zero distortion (1 pixel = 1 bead).
- **Custom Bead Inventory Whitelist**: Pick only the colors you own or want to use, and let the app dither and blend them optimally.
- **In-Room Wall Preview**: Visualizes the finished tapestry hanging from a wooden craft dowel rod on a wall.
- **Printable Word Chart & Exports**: Export Word Chart text guides, high-res PNG patterns, and CSV matrix spreadsheets.
- **Cross-Platform Touch & Mobile (iOS & Android)**: Single-finger pan, two-finger pinch-to-zoom, safe-area support, and QR code sharing for local Wi-Fi devices.

---

## Getting Started

### Installation
```bash
npm install
```

### Run Locally & on Local Wi-Fi
```bash
npm run dev -- --host
```

Open in your desktop browser at `http://localhost:5173/`, or on any phone or tablet on the same Wi-Fi at `http://10.0.0.22:5173/`.

### Production Build
```bash
npm run build
```
