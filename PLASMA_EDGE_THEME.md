# PLASMA EDGE THEME — Cyberpunk Premium Enhancement

## Overview

The **Plasma Edge** theme (`.theme-midnight`) is a vibrant cyberpunk-inspired enhancement to the BDMFlow design system, featuring ultra-bright neon gradients and dynamic plasma effects inspired by modern trading interfaces.

---

## Color Palette

### Primary Colors
- **Cyan Primary:** `#00ffcc` (Vibrant neon cyan)
- **Gold Secondary:** `#ffd700` (Vibrant gold accent)
- **Magenta Destructive:** `#ff4d7d` (Plasma pink-red)

### Background Colors
- **Background:** `#091e17` (Deep plasma teal)
- **Card:** `#0e2419` (Dark teal card)
- **Foreground:** `#f8f9f8` (Crisp white)

### Gradients
1. **Plasma Edge Gradient** (Main)
   ```css
   linear-gradient(135deg, #00ffcc 0%, #ffd700 50%, #ff4d7d 100%)
   ```

2. **Cyan Gradient**
   ```css
   linear-gradient(135deg, #00ffcc 0%, #06ffd2 35%, #00cc99 65%, #00ffcc 100%)
   ```

3. **Gold Gradient**
   ```css
   linear-gradient(135deg, #ffd700 0%, #ffb800 50%, #ffa500 100%)
   ```

4. **Magenta Gradient**
   ```css
   linear-gradient(135deg, #ff4d7d 0%, #ff1744 50%, #d50000 100%)
   ```

---

## Shadow System

### Cyan Glow
```css
--shadow-cyan: 0 0 48px rgba(0, 255, 180, 0.32)
```
Used for primary elements and emphasis.

### Gold Glow
```css
--shadow-gold: 0 0 40px rgba(255, 215, 0, 0.28)
```
Used for secondary accents and highlights.

### Plasma Glow
```css
--shadow-glow: 0 0 32px rgba(0, 255, 180, 0.28)
```
Combined effect for interactive elements.

### Composite Hover
```css
0 12px 48px rgba(0,0,0,0.68), 
0 0 40px rgba(0,255,180,0.22), 
0 0 16px rgba(255,215,0,0.10)
```
Creates the ultimate plasma edge hover effect.

---

## Components & Usage

### Plasma Gradient Text
Apply vibrant gradient text to headings or emphasis:

```jsx
<h1 className="gradient-plasma text-4xl font-black">
  Plasma Edge Title
</h1>
```

Result: Text transitions between cyan → gold → magenta.

### Plasma Pulse Animation
Add pulsing neon glow animation to important text:

```jsx
<span className="plasma-pulse font-bold text-lg">
  ⚡ LIVE TRADING
</span>
```

Effect: Text glows with animated cyan-gold-magenta shadow, pulses every 3 seconds.

### Plasma Glow Animation
Add animated glow border to cards:

```jsx
<div className="glass plasma-glow p-4 rounded-lg">
  Interactive Card
</div>
```

Effect: Card border and shadow animate with plasma glow effect.

### Plasma Badges
High-contrast status badges with gradient overlays:

```jsx
<span className="badge-pro">PRO</span>       {/* Cyan gradient */}
<span className="badge-hot">HOT</span>       {/* Magenta gradient */}
<span className="badge-new">NEW</span>       {/* Gold gradient */}
<span className="badge-beta">BETA</span>     {/* Default */}
```

### Metric Cards with Plasma
Display metrics with plasma gradient:

```jsx
<div className="metric-card">
  <div className="metric-label">24H VOLUME</div>
  <div className="metric-value">$2.45B</div>  {/* Cyan → Gold gradient */}
</div>
```

---

## Glass Card Enhancement

Standard glass cards automatically get plasma edge styling:

```jsx
<div className="glass p-6 rounded-lg">
  <h3 className="text-lg font-bold">Card Title</h3>
  <p className="text-sm text-muted-foreground">Description</p>
</div>
```

**Hover Effect:** Border transitions to cyan, shadow expands with dual cyan-gold glow.

---

## Animation Details

### Plasma Pulse Animation
**Duration:** 3 seconds  
**Easing:** ease-in-out  
**Effect:** Text shadow oscillates between:
- 0% → `0 0 10px cyan, 0 0 20px gold`
- 50% → `0 0 20px cyan, 0 0 40px gold, 0 0 60px magenta`
- 100% → `0 0 10px cyan, 0 0 20px gold`

### Plasma Glow Animation
**Duration:** 3 seconds  
**Easing:** ease-in-out  
**Effect:** Box shadow oscillates between:
- 0% → `0 0 20px cyan`
- 50% → `0 0 40px cyan, 0 0 60px gold`
- 100% → `0 0 20px cyan`

### Gradient Shift Animation
**Duration:** 4 seconds  
**Easing:** ease-in-out  
**Effect:** Gradient text animates position for flowing effect.

---

## Design Tokens (CSS Variables)

### Plasma Gradients
```css
--plasma-gradient-edge:    linear-gradient(135deg, #00ffcc 0%, #ffd700 50%, #ff4d7d 100%);
--plasma-gradient-cyan:    linear-gradient(135deg, #00ffcc 0%, #06ffd2 35%, #00cc99 65%, #00ffcc 100%);
--plasma-gradient-gold:    linear-gradient(135deg, #ffd700 0%, #ffb800 50%, #ffa500 100%);
--plasma-gradient-magenta: linear-gradient(135deg, #ff4d7d 0%, #ff1744 50%, #d50000 100%);
```

### Plasma Shadows
```css
--shadow-cyan: 0 0 48px rgba(0, 255, 180, 0.32);
--shadow-gold: 0 0 40px rgba(255, 215, 0, 0.28);
--shadow-glow: 0 0 32px rgba(0, 255, 180, 0.28);
```

### Theme Gradient (Used in .gradient-plasma)
```css
--theme-gradient: linear-gradient(135deg, #00ffcc 0%, #ffd700 40%, #ff4d7d 100%);
```

---

## Implementation Checklist

When using Plasma Edge theme, ensure:

- [ ] Apply theme with `document.documentElement.className = 'theme-midnight'`
- [ ] Use `.glass` for card backgrounds (auto-applies plasma styling)
- [ ] Use `.gradient-plasma` for gradient text on headings
- [ ] Use `.plasma-pulse` for animated neon text
- [ ] Use `.plasma-glow` for animated card borders
- [ ] Update badge styling: `.badge-pro`, `.badge-hot`, `.badge-new`
- [ ] Test metric cards: `.metric-value` gets gradient text
- [ ] Verify hover effects show dual cyan-gold glow
- [ ] Check animations loop smoothly without jank
- [ ] Ensure text contrast meets WCAG AA (4.5:1 minimum)

---

## Performance Considerations

### GPU Acceleration
All animations use CSS transforms and filters for GPU acceleration:
- Blur effects are delegated to GPU
- Gradients are computed once, then cached
- Animations use `transform` and `opacity` only

### Optimization Tips
- Use `.plasma-pulse` sparingly (max 2-3 per page)
- Avoid stacking multiple animations on same element
- Use `.plasma-glow` for key interactive elements only
- Test performance on lower-end devices

### Browser Support
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Older browsers: Gradients work, animations degrade gracefully

---

## Example Implementation

### Trading Dashboard with Plasma Edge

```jsx
<div className="theme-midnight">
  {/* Header */}
  <header className="glass sticky top-0 p-4">
    <h1 className="gradient-plasma text-2xl font-black">
      OPSI 3 — PLASMA EDGE
    </h1>
  </header>

  {/* Main Content */}
  <main className="p-6 space-y-6">
    {/* Live Ticker */}
    <div className="glass plasma-glow p-4 rounded-lg">
      <span className="plasma-pulse font-bold">⚡ LIVE</span>
      <p className="text-sm text-muted-foreground">20:31:12 WIB</p>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-3 gap-4">
      <div className="metric-card">
        <div className="metric-label">BEAR</div>
        <div className="metric-value">51 +34.58%</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">NZIA</div>
        <div className="metric-value">258 +32.99%</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">MSIN</div>
        <div className="metric-value">575 +24.45%</div>
      </div>
    </div>

    {/* Status Badges */}
    <div className="flex gap-2 flex-wrap">
      <span className="badge-pro">PRO</span>
      <span className="badge-hot">HOT</span>
      <span className="badge-new">NEW</span>
    </div>
  </main>
</div>
```

---

## Troubleshooting

### Animations not showing?
- Verify CSS animations are enabled (check DevTools Animations)
- Ensure `.theme-midnight` class is applied to `<html>`
- Check for conflicting `animation: none !important` in other CSS

### Gradients look dull?
- Verify viewport supports CSS gradients (all modern browsers)
- Check if dark mode is reducing saturation
- Try adjusting system display settings

### Glows not visible?
- Verify shadow-glow/shadow-cyan variables are set
- Check if backdrop-filter is working (requires modern browser)
- Ensure element has proper z-index for shadow visibility

### Performance lag?
- Reduce number of `.plasma-pulse` animations on page
- Limit `.plasma-glow` to key interactive elements only
- Use DevTools Performance tab to profile

---

## Customization

### Custom Plasma Colors
To modify plasma gradients, edit CSS variables:

```css
.theme-midnight {
  --primary: 180 100% 52%;        /* Change primary cyan */
  --secondary: 45 90% 50%;        /* Change secondary gold */
  --destructive: 0 85% 55%;       /* Change destructive magenta */
  --theme-gradient: linear-gradient(...); /* Custom gradient */
}
```

### Custom Animation Speed
Adjust animation durations:

```css
@keyframes plasma-pulse {
  /* Change 3s to 2s, 4s, etc. as needed */
  animation: plasma-pulse 4s ease-in-out infinite;
}
```

---

## Resources

- **Design File:** See `DESIGN_TOKENS.md` for complete token reference
- **Implementation Guide:** See `THEME_IMPLEMENTATION.md` for broader theme context
- **Main Docs:** See `DESIGN_SYSTEM.md` for full design system overview

---

**Last Updated:** June 5, 2026  
**Status:** Production Ready  
**Version:** 4.1
