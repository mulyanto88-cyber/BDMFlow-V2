# 🎨 Premium Design Tokens Reference

## Color Palette Overview

### Primary Theme: Dark (Deep Navy + Gold)
```
Background:      #050a16    (Navy Abyss)
Foreground:      #f8f9fd    (Crisp White)
Primary Accent:  #c49a1a    (Premium Gold)
Card:            #0d1420    (Rich Dark)
Border:          #1a2237    (Sharp Navy)
```

**Use Case:** Trading platforms, financial dashboards, premium analytics

### Secondary Theme: Light (Silver Lustre)
```
Background:      #ede7ed    (Sophisticated Off-white)
Foreground:      #1a1c23    (Deep Navy)
Primary:         #c49a1a    (Rich Gold)
Card:            #faf9f9    (Clean White)
Border:          #d0c9d0    (Silver)
```

**Use Case:** Daytime mode, formal presentations

### Tertiary Theme: Blue (Canva Blue-Tosca)
```
Background:      #143c64    (Vibrant Blue)
Foreground:      #f8f9fa    (Bright White)
Primary:         #22d3ee    (Vibrant Cyan)
Secondary:       #14b8a6    (Warm Tosca)
Card:            #1a3a52    (Blue Card)
Border:          #1a5a8a    (Blue Border)
```

**Use Case:** Modern creative design (Canva-inspired), vibrant yet professional

### Quaternary Theme: Midnight (Cyberpunk Cyan)
```
Background:      #091e17    (Deep Plasma Teal)
Foreground:      #f8f9f8    (Crisp White)
Primary:         #00ffcc    (Vibrant Neon Cyan)
Card:            #0e2419    (Dark Teal)
Border:          #1a3a32    (Teal)
```

**Use Case:** Futuristic, high-energy interfaces

---

## Glassmorphism Settings

### Glass Card (Premium Blur)
```css
backdrop-filter: blur(24px) saturate(1.6) brightness(1.05);
border-top: 1px solid rgba(255, 255, 255, 0.15);
border: 1px solid rgba(255, 255, 255, 0.07);
box-shadow: 0 6px 32px rgba(0, 0, 0, 0.45);
```

**Hover State:**
- Lift: `translateY(-1px)`
- Enhanced glow with primary color
- Shadow expands to `0 12px 48px`

---

## Shadow Hierarchy

```css
/* Depth Levels */
xs:  0 1px 3px    rgba(0,0,0, 0.08)    /* Subtle lift */
sm:  0 2px 8px    rgba(0,0,0, 0.10)    /* Card shadow */
md:  0 6px 20px   rgba(0,0,0, 0.12)    /* Default hover */
lg:  0 14px 48px  rgba(0,0,0, 0.15)    /* Elevated */
xl:  0 28px 64px  rgba(0,0,0, 0.18)    /* Modal */

/* Premium Glow */
gold: 0 0 32px rgba(196, 154, 26, 0.26)
cyan: 0 0 32px rgba(0, 255, 180, 0.28)
blue: 0 0 28px rgba(129, 140, 248, 0.24)
```

---

## Border Radius System

```css
xs:   0.25rem   (4px)     /* Small buttons */
sm:   0.375rem  (6px)     /* Compact cards */
md:   0.5rem    (8px)     /* Medium elements */
lg:   0.875rem  (14px)    /* Default (recommended) */
xl:   1.125rem  (18px)    /* Large containers */
2xl:  1.5rem    (24px)    /* Full cards, modals */
```

**Best Practice:** Use `lg` (0.875rem) as default for premium feel

---

## Typography Weights

### Font: Inter (UI Text)
```
Light       100-300   (Rarely used)
Regular     400       (Body text, default)
Medium      500       (Default body in premium system)
Semibold    600       (Labels, buttons)
Bold        700       (Headings, emphasis)
Extrabold   800       (Section headers)
Black       900       (Page titles, badges)
```

### Font: JetBrains Mono (Numbers & Code)
```
Regular     400       (Numbers, timestamps)
Medium      500       (Highlight numbers)
Bold        700       (Code snippets)
```

---

## Component Sizing

### Badges
```css
Height:     1.5rem (24px)
Padding:    0.2rem 0.6rem
Font:       0.58rem (9.28px) font-900
Letter-spacing: 0.14em
```

### Metric Cards
```css
Padding:    1rem
Border:     1px solid border-color
Shadow:     --shadow-md
Font:
  - Label:  0.625rem font-bold
  - Value:  1.5rem font-black
```

### Section Headers
```css
Font:       0.6875rem (11px) font-black
Letter-spacing: 0.16em
Line:       2.5px height gradient bar
```

---

## Animation Timing

### Standard Transitions
```css
/* Smooth, premium feel */
transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Hover Lift
```css
transform: translateY(-1px);
duration:  0.35s;
easing:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Glow Pulse
```css
animation: glow-pulse 3s ease-in-out infinite;
0%:   box-shadow 0 0 8px
50%:  box-shadow 0 0 20px
100%: box-shadow 0 0 8px
```

---

## Spacing Scale (Tailwind)

```
1   = 0.25rem   (4px)
2   = 0.5rem    (8px)
3   = 0.75rem   (12px)
4   = 1rem      (16px)
6   = 1.5rem    (24px)
8   = 2rem      (32px)
10  = 2.5rem    (40px)
12  = 3rem      (48px)
```

**Rule:** Always use Tailwind scale. Avoid arbitrary values like `p-[17px]`

---

## Semantic Color Usage

### Text Contrast
```
On Dark Background:
  Primary text:     #f8f9fd (foreground)
  Secondary text:   #a0aac5 (muted-foreground)
  Disabled text:    #6b7591 (muted-foreground-70%)

On Light Background:
  Primary text:     #1a1c23 (foreground)
  Secondary text:   #5a5a5a (muted-foreground)
  Disabled text:    #a0a0a0 (muted-foreground-60%)
```

### Status Colors
```
Success:   #22c55e (Emerald 500)
Warning:   #f59e0b (Amber 500)
Error:     #ef4444 (Red 500)
Info:      #3b82f6 (Blue 500)
```

---

## Accessibility Checklist

✓ **Contrast Ratio:** WCAG AA (4.5:1 minimum)
✓ **Font Size:** 14px minimum for body text
✓ **Font Weight:** ≥600 for labels and emphasis
✓ **Line Height:** 1.5 for body, 1.2 for headings
✓ **Focus States:** Visible 2px outline with primary color
✓ **Motion:** Respects prefers-reduced-motion
✓ **Color:** Not only differentiator (use icons + text)

---

## Responsive Breakpoints

```
xs:   0px       (Mobile default)
sm:   640px     (Large phone)
md:   768px     (Tablet)
lg:   1024px    (Desktop)
xl:   1280px    (Large desktop)
2xl:  1536px    (Ultra-wide)
```

**Mobile-First Pattern:**
```jsx
className="text-sm md:text-base lg:text-lg"
className="px-3 md:px-4 lg:px-6"
```

---

## Implementation Examples

### Premium Card
```jsx
<div className="glass p-4 rounded-lg border border-border">
  <h3 className="text-lg font-bold">Title</h3>
  <p className="text-sm text-muted-foreground">Description</p>
</div>
```

### Metric Display
```jsx
<div className="metric-card">
  <div className="metric-label">DAILY VOLUME</div>
  <div className="metric-value">1,234,567</div>
</div>
```

### Premium Button
```jsx
<button className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:shadow-lg transition-all">
  Action
</button>
```

### Badge Group
```jsx
<div className="flex gap-2">
  <span className="badge-pro">PRO</span>
  <span className="badge-hot">HOT</span>
</div>
```

---

## Version History

- **v4.0** (Current): Modern Premium with AI aesthetic
  - Enhanced shadows and depth
  - Bolder typography (900 weight for headers)
  - Improved glassmorphism blur/saturation
  - 4 sophisticated themes
  - Refined spacing consistency

---

## Support & Questions

For implementation questions:
1. Check DESIGN_SYSTEM.md for detailed guidelines
2. Review component examples in src/components/
3. Test color tokens across all 4 themes
4. Always validate accessibility with tools
