# PLASMA EDGE — Quick Reference Card

## Theme Activation
```jsx
document.documentElement.className = 'theme-midnight'
```

---

## Color Palette

### Primary Colors
```
Cyan (Primary):    #00ffcc  ← Neon main color
Gold (Secondary):  #ffd700  ← Vibrant accent
Magenta (Danger):  #ff4d7d  ← Plasma red-pink
```

### Background & Text
```
Background:  #091e17  ← Deep plasma teal
Card:        #0e2419  ← Dark teal
Text:        #f8f9f8  ← Crisp white
```

---

## Gradients at a Glance

### 1. Plasma Edge (Main)
```css
linear-gradient(135deg, #00ffcc 0%, #ffd700 50%, #ff4d7d 100%)
```
**Use For:** Headings, emphasis, highlight text

### 2. Cyan Shift
```css
linear-gradient(135deg, #00ffcc 0%, #06ffd2 35%, #00cc99 65%, #00ffcc 100%)
```
**Use For:** Subtle flowing gradients

### 3. Gold Warmth
```css
linear-gradient(135deg, #ffd700 0%, #ffb800 50%, #ffa500 100%)
```
**Use For:** Secondary accents

### 4. Magenta Intensity
```css
linear-gradient(135deg, #ff4d7d 0%, #ff1744 50%, #d50000 100%)
```
**Use For:** Alerts, warnings, destructive actions

---

## Shadow System

### Cyan Glow
```css
0 0 48px rgba(0, 255, 180, 0.32)
```
Primary element emphasis

### Gold Glow
```css
0 0 40px rgba(255, 215, 0, 0.28)
```
Secondary accent highlights

### Composite (Hover)
```css
0 12px 48px rgba(0,0,0,0.68), 
0 0 40px rgba(0,255,180,0.22), 
0 0 16px rgba(255,215,0,0.10)
```
Premium interactive hover state

---

## CSS Classes

### Text Gradients
```jsx
<span className="gradient-plasma">Plasma Text</span>
```
Multi-color gradient text (cyan → gold → magenta)

### Animations

#### Plasma Pulse
```jsx
<span className="plasma-pulse">⚡ LIVE</span>
```
3s animated neon glow pulsing on text

#### Plasma Glow
```jsx
<div className="glass plasma-glow">Card</div>
```
3s animated glowing border effect

---

## Component Styles

### Badges
```jsx
<span className="badge-pro">PRO</span>        /* Cyan gradient */
<span className="badge-hot">HOT</span>        /* Magenta gradient */
<span className="badge-new">NEW</span>        /* Gold gradient */
```

### Metric Cards
```jsx
<div className="metric-card">
  <div className="metric-label">LABEL</div>
  <div className="metric-value">Value</div>  {/* Gradient text */}
</div>
```

### Glass Card
```jsx
<div className="glass p-4 rounded-lg">
  Automatic plasma styling
</div>
```

---

## Animation Timings

| Animation | Duration | Easing | Effect |
|-----------|----------|--------|--------|
| plasma-pulse | 3s | ease-in-out | Text glow pulse |
| plasma-glow | 3s | ease-in-out | Shadow expansion |
| gradient-shift | 4s | ease-in-out | Flowing gradient |

---

## Usage Patterns

### Pattern 1: Plasma Heading
```jsx
<h1 className="gradient-plasma text-4xl font-black">
  Title
</h1>
```

### Pattern 2: Live Indicator
```jsx
<div className="flex items-center gap-2">
  <span className="plasma-pulse w-2 h-2 bg-primary rounded-full"></span>
  <span className="font-bold">LIVE</span>
</div>
```

### Pattern 3: Trading Card
```jsx
<div className="glass plasma-glow p-6 rounded-lg">
  <h3 className="font-bold">Card Title</h3>
  <div className="metric-value">$2.45B</div>
</div>
```

### Pattern 4: Status Grid
```jsx
<div className="grid grid-cols-3 gap-4">
  <div className="metric-card">
    <div className="metric-label">BEAR</div>
    <div className="metric-value">51 +34.58%</div>
  </div>
</div>
```

---

## Customization

### Change Primary Color
```css
.theme-midnight {
  --primary: 180 100% 52%;  /* New cyan hue */
}
```

### Change Animation Speed
```css
.plasma-pulse {
  animation: plasma-pulse 2s ease-in-out infinite;  /* Faster */
}
```

### Custom Gradient
```css
.theme-midnight {
  --theme-gradient: linear-gradient(to right, #cyan, #gold, #magenta);
}
```

---

## Performance Tips

✅ Use `.plasma-pulse` sparingly (max 2-3 per page)  
✅ Apply `.plasma-glow` to key interactive elements only  
✅ GPU acceleration: All animations use efficient CSS  
✅ Test on lower-end devices for smooth 60fps  

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | GPU acceleration |
| Firefox 88+ | ✅ Full | GPU acceleration |
| Safari 14+ | ✅ Full | GPU acceleration |
| Edge 90+ | ✅ Full | GPU acceleration |
| Older | ⚠️ Partial | Gradients work, animations disabled |

---

## Troubleshooting

### Animations not showing?
```css
/* Verify class is applied to <html> */
document.documentElement.className = 'theme-midnight'
```

### Gradients look dull?
- Check display brightness settings
- Verify CSS gradients are enabled
- Try in incognito/private mode

### Glows not visible?
- Ensure backdrop-filter is supported
- Check element z-index
- Verify shadow variables are set

---

## Documentation Links

- 📖 [PLASMA_EDGE_THEME.md](./PLASMA_EDGE_THEME.md) — Full reference
- 📋 [PLASMA_EDGE_UPDATE.md](./PLASMA_EDGE_UPDATE.md) — What changed
- 🎨 [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) — Token reference
- 📄 [README.md](./README.md) — Main overview

---

## Version Info

**Version:** 4.1  
**Theme:** Midnight (Plasma Edge)  
**Status:** Production Ready  
**Date:** June 5, 2026

---

**Quick Start:** Apply `className='theme-midnight'` to `<html>`, use `.gradient-plasma` for text, `.plasma-pulse` for animations, `.glass` for cards.
