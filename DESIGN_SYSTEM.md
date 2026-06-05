# 🎨 BDMFlow Modern Premium Design System v4.0

## Overview
Tema UI/UX modern premium dengan aesthetic AI-forward yang sophisticated dan bernilai tinggi. Sistem ini dirancang untuk memberikan pengalaman visual yang elegan, rapi, dan mudah dibaca dengan kontras tinggi dan spacing konsisten.

---

## 📌 Palet Warna Premium

### Dark Mode (Default - Recommended)
**Aesthetic:** Premium Obsidian dengan aksen Gold modern  
**Cocok untuk:** Aplikasi enterprise, trading platform, analytics

```css
/* Color Palette */
--background: #050a16        /* Deep navy obsidian */
--foreground: #f8f9fd        /* Crisp white */
--primary: #c49a1a           /* Rich gold accent */
--card: #0d1420              /* Dark card */
--border: #1a2237            /* Sharp borders */
```

**Gradients:**
- Gold theme: `linear-gradient(135deg, #c49a1a 0%, #e7b733 35%, #f3db99 50%, #e7b733 70%, #c49a1a 100%)`
- Primary glow: `rgba(196, 154, 26, ...)`

---

### Light Mode
**Aesthetic:** Premium Silver Lustre  
**Cocok untuk:** Dashboard pagi, presentasi formal

```css
--background: #ede7ed        /* Sophisticated off-white */
--foreground: #1a1c23        /* Deep charcoal-navy */
--primary: #c49a1a           /* Rich gold */
--card: #faf9f9              /* Clean white */
```

---

### Theme Blue
**Aesthetic:** Deep Indigo Premium (AI-modern)  
**Cocok untuk:** Tech-forward, modern aesthetic

```css
--background: #050812        /* Ultra-deep indigo */
--foreground: #f6f5f8        /* Bright white */
--primary: #5aadff           /* Bright cyan-blue */
--card: #0a0d1c              /* Deep indigo */
```

---

### Theme Midnight (Cyberpunk)
**Aesthetic:** Neon Cyan Plasma  
**Cocok untuk:** Futuristic, high-energy interface

```css
--background: #091e17        /* Deep plasma teal */
--foreground: #f8f9f8        /* Crisp white */
--primary: #00ffcc           /* Vibrant neon cyan */
--card: #0e2419              /* Dark teal */
```

---

## 🔤 Typography System

### Font Stack
- **UI Text (Body/Headers):** Inter 400-900 (single source of truth)
- **Monospace (Numbers/Code):** JetBrains Mono 400-700

### Font Weight Guidelines
```css
/* Text Weights — Premium contrast */
--font-light:    300
--font-regular:  400
--font-medium:   500    /* Default body */
--font-semibold: 600
--font-bold:     700
--font-extrabold: 800
--font-black:    900    /* Headers, badges */
```

### Text Styles
```css
/* Headers — tegas dan bold */
h1 { font-weight: 900; font-size: 2.25rem; letter-spacing: -0.02em; }
h2 { font-weight: 800; font-size: 1.875rem; letter-spacing: -0.01em; }
h3 { font-weight: 800; font-size: 1.5rem; letter-spacing: -0.01em; }

/* Body — readable dengan contrast tinggi */
p  { font-weight: 500; font-size: 1rem; letter-spacing: -0.01em; }

/* Labels — prominent */
label { font-weight: 700; font-size: 0.875rem; letter-spacing: 0.05em; }

/* Metric Values — strong hierarchy */
.metric-value { font-weight: 900; font-size: 1.5rem; letter-spacing: -0.02em; }
```

---

## 📦 Design Tokens

### Spacing System (Tailwind Scale)
```css
/* Consistent padding/margin/gap */
px-1   = 0.25rem   (4px)
px-2   = 0.5rem    (8px)
px-3   = 0.75rem   (12px)
px-4   = 1rem      (16px)
px-6   = 1.5rem    (24px)
px-8   = 2rem      (32px)
px-12  = 3rem      (48px)
```

**Rule:** Selalu gunakan Tailwind scale, hindari arbitrary values `px-[17px]`

### Border Radius
```css
--radius:     0.875rem  (14px)  /* Default card radius */
--radius-sm:  0.375rem  (6px)   /* Small elements */
--radius-md:  0.5rem    (8px)   /* Medium */
--radius-lg:  0.875rem  (14px)  /* Large */
--radius-xl:  1.125rem  (18px)  /* Extra large */
--radius-2xl: 1.5rem    (24px)  /* Full card */
```

### Shadow System (Depth Levels)
```css
/* Lightweight to dimensional */
--shadow-xs:   0 1px 3px rgba(0,0,0, 0.08)
--shadow-sm:   0 2px 8px rgba(0,0,0, 0.10)
--shadow-md:   0 6px 20px rgba(0,0,0, 0.12)   /* Default card */
--shadow-lg:   0 14px 48px rgba(0,0,0, 0.15)  /* Hover state */
--shadow-xl:   0 28px 64px rgba(0,0,0, 0.18)  /* Modal */

/* Premium glow effects */
--shadow-gold: 0 0 32px rgba(196,154,26, 0.26)
--shadow-glow: 0 0 20px rgba(var(--primary-glow-rgb), 0.25)
```

---

## 🎨 Component Library

### Glass Card
Premium glassmorphic component dengan blur dan saturation
```jsx
<div className="glass">
  <!-- Automatic: backdrop blur, premium border, hover lift -->
</div>
```

**Styling:**
- Backdrop: `blur(24px) saturate(1.6) brightness(1.05)`
- Hover: Smooth lift, border glow, enhanced shadow
- Border: Subtle top highlight

### Panel
Data-dense panels untuk tabel dan informasi
```jsx
<div className="panel">
  <!-- Automatic: softer blur, minimal border -->
</div>
```

### Badges
```jsx
<span className="badge-pro">PRO</span>        <!-- Gold gradient -->
<span className="badge-hot">HOT</span>        <!-- Red gradient -->
<span className="badge-new">NEW</span>        <!-- Green gradient -->
<span className="badge-beta">BETA</span>      <!-- Purple gradient -->
```

**Features:**
- Font weight: 900 (extra bold)
- Letter spacing: 0.14em (wider)
- Glowing shadow for emphasis

### Metric Card
```jsx
<div className="metric-card">
  <div className="metric-label">LABEL</div>
  <div className="metric-value">9,234</div>
</div>
```

### Section Heading
```jsx
<h3 className="section-heading">SECTION TITLE</h3>
```

Features:
- Gold accent line (gradient)
- Uppercase, wide letter spacing (0.16em)
- Font weight: 900

---

## 🎯 Usage Guidelines

### Light vs Dark Mode
```tsx
// Dark by default
<html className="dark">

// Light mode (alternative)
<html className="light">  {/* or omit for light */}

// Blue theme
<html className="theme-blue">

// Cyberpunk theme
<html className="theme-midnight">
```

### Color Variable Usage
```jsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-background text-foreground">
  <h2 className="text-primary font-black">Premium Header</h2>
</div>

// ✅ CORRECT - Use semantic accent colors
<div className="bg-card text-card-foreground border border-border">
  Premium card
</div>

// ❌ INCORRECT - Avoid hardcoded colors
<div style={{ background: '#050a16' }}>Not themed</div>
```

### Spacing Best Practices
```jsx
// ✅ CORRECT - Consistent Tailwind scale
<div className="px-4 py-3 gap-2">Content</div>
<div className="mb-6 mt-4">Space</div>

// ❌ INCORRECT - Arbitrary values
<div className="px-[17px] py-[14px]">Inconsistent</div>
<div className="mb-[28px]">Breaks system</div>
```

### Typography Hierarchy
```jsx
// ✅ Page Header - Bold & Large
<h1 className="text-2xl font-black">Main Title</h1>

// ✅ Section Header - Bold & Medium
<h2 className="text-xl font-bold">Section</h2>

// ✅ Label - Semibold & Small
<label className="text-sm font-semibold">Field Label</label>

// ✅ Body - Medium & Regular
<p className="text-base font-medium">Regular text</p>
```

---

## 🌈 Theme Switching

### Default Theme Chain
1. **Dark** (default, recommended)
2. **Light** (Silver Lustre)
3. **theme-blue** (Indigo Premium)
4. **theme-midnight** (Cyberpunk Neon)

### Implementation
```jsx
// In layout or context
const [theme, setTheme] = useState('dark')

useEffect(() => {
  document.documentElement.className = theme
}, [theme])

// In UI
<button onClick={() => setTheme('dark')}>Dark</button>
<button onClick={() => setTheme('light')}>Light</button>
<button onClick={() => setTheme('theme-blue')}>Blue</button>
<button onClick={() => setTheme('theme-midnight')}>Neon</button>
```

---

## ✨ Premium Features

### Glassmorphism
- Ultra-smooth blur effect (24px)
- Saturation boost (1.6x) for vibrancy
- Brightness lift for premium feel
- Top light border for depth

### Glow Effects
- Gold glow: `rgba(196,154,26, 0.25)`
- Blue glow: `rgba(129,140,248, 0.25)`
- Cyan glow: `rgba(0,255,180, 0.25)`

### Animations
```css
/* Smooth transitions */
transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)

/* Glow pulse */
animation: glow-pulse 3s ease-in-out infinite
```

### Scrollbar Styling
- Premium thumbs with transparency
- Hover brightening effect
- Smooth radius

---

## 📐 Responsive Design

### Breakpoints (Tailwind standard)
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile-First Approach
```jsx
// Mobile default, enhance for desktop
<div className="p-3 md:p-6 lg:p-8">
  <h1 className="text-lg md:text-2xl lg:text-3xl">Responsive</h1>
</div>
```

---

## 🎪 Customization

### Adding Custom Color Tokens
```css
/* In globals.css :root */
--custom-accent: 220 90% 50%;
--custom-accent-foreground: 0 0% 100%;
```

Then use in Tailwind:
```jsx
<div className="bg-custom-accent text-custom-accent-foreground">
```

### Adjusting Theme Brightness
Modify the `background` HSL values in `.dark`, `.light`, `.theme-blue`, `.theme-midnight` sections.

---

## 📋 Checklist for New Components

- [ ] Use semantic color tokens (not hardcoded colors)
- [ ] Apply consistent padding/gap from Tailwind scale
- [ ] Set font-weight >= 600 for labels, headers
- [ ] Use `--shadow-md` for depth by default
- [ ] Test both dark and light modes
- [ ] Ensure high text contrast (WCAG AA+)
- [ ] Add hover/focus states with `--shadow-lg`
- [ ] Mobile responsive with `md:` and `lg:` prefixes

---

## 🚀 Performance Notes

- **Backdrop filters:** May be demanding on old devices; test performance
- **Gradients:** CSS gradients are GPU-accelerated; keep to 2-3 colors
- **Animations:** Use `will-change` sparingly and profile on slow devices

---

## 🎯 Summary

This premium design system combines:
✓ **Modern aesthetics** — AI-forward, sophisticated
✓ **Accessibility** — High contrast, readable fonts
✓ **Consistency** — Design tokens, Tailwind scale
✓ **Performance** — CSS gradients, smooth animations
✓ **Flexibility** — 4 theme variants for different moods

Use this as your source of truth for BDMFlow's visual identity.
