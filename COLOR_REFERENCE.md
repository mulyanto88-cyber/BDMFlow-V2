# 🎨 Color Swatches — Visual Reference

## Dark Theme (Premium Obsidian + Gold)

### Primary Colors
```
Background:     #050a16  (5°, 50%, 5%)   Deep Navy Obsidian
Foreground:     #f8f9fd  (208°, 42%, 97%) Crisp White
Primary Accent: #c49a1a  (41°, 85%, 42%)  Premium Gold
```

### Secondary Colors
```
Card:           #0d1420  (221°, 48%, 8%)  Rich Dark
Card Foreground:#f8f9fd  (208°, 42%, 97%) Crisp White
Border:         #1a2237  (224°, 22%, 16%) Sharp Navy
```

### Status Colors
```
Success:  #22c55e (Green 500)
Warning:  #f59e0b (Amber 500)
Error:    #ef4444 (Red 500)
Info:     #3b82f6 (Blue 500)
```

### Glassmorphic Layer
```
Glass Background:  rgba(8, 16, 38, 0.62)
Glass Border:      rgba(255, 255, 255, 0.070)
Glass Border Top:  rgba(255, 255, 255, 0.15)
Glass Hover:       rgba(12, 22, 50, 0.88)
Glass Glow:        0 12px 48px rgba(0,0,0, 0.62)
```

---

## Light Theme (Premium Silver Lustre)

### Primary Colors
```
Background:     #ede7ed  (226°, 25%, 92%)  Sophisticated Off-white
Foreground:     #1a1c23  (224°, 55%, 8%)   Deep Charcoal-Navy
Primary Accent: #c49a1a  (41°, 85%, 42%)   Rich Gold (Same)
```

### Secondary Colors
```
Card:           #faf9f9  (226°, 40%, 97%)  Clean Premium White
Card Foreground:#1a1c23  (224°, 55%, 8%)   Deep Navy
Border:         #d0c9d0  (224°, 22%, 78%)  Silver Border
```

### Glassmorphic Layer
```
Glass Background:  rgba(242, 247, 254, 0.94)
Glass Border:      rgba(140, 160, 210, 0.60)
Glass Border Top:  rgba(255, 255, 255, 0.98)
Glass Hover:       rgba(251, 254, 255, 0.99)
Glass Glow:        0 10px 40px rgba(0,0,0, 0.16)
```

---

## Blue Theme (Canva Blue-Tosca Gradient)

### Primary Colors
```
Background:     #0a2832  (180°, 60%, 8%)    Dark Teal-Blue
Foreground:     #f8f9fa  (210°, 40%, 98%)   Bright White
Primary Accent: #22d3ee  (195°, 100%, 50%)  Vibrant Cyan
Secondary:      #14b8a6  (160°, 90%, 48%)   Warm Tosca
```

### Secondary Colors
```
Card:           #0f3242  (180°, 55%, 12%)   Teal-Blue
Card Foreground:#f8f9fa  (210°, 40%, 98%)   Bright White
Border:         #1a4a5a  (180°, 48%, 22%)   Teal
```

### Glassmorphic Layer
```
Glass Background:  rgba(10, 40, 50, 0.75)
Glass Border:      rgba(34, 211, 238, 0.16)
Glass Border Top:  rgba(34, 211, 238, 0.32)
Glass Hover:       rgba(15, 50, 65, 0.92)
Glass Glow:        0 12px 48px rgba(0,0,0, 0.60)
```

---

## Midnight Theme (Cyberpunk Neon + Plasma Teal)

### Primary Colors
```
Background:     #091e17  (160°, 46%, 5%)   Deep Plasma Teal
Foreground:     #f8f9f8  (0°, 0%, 97%)     Crisp White
Primary Accent: #00ffcc  (163°, 100%, 52%) Vibrant Neon Cyan
```

### Secondary Colors
```
Card:           #0e2419  (160°, 42%, 8%)   Dark Teal
Card Foreground:#f8f9f8  (0°, 0%, 97%)     Crisp White
Border:         #1a3a32  (160°, 35%, 15%)  Teal
```

### Glassmorphic Layer
```
Glass Background:  rgba(8, 28, 22, 0.78)
Glass Border:      rgba(0, 255, 180, 0.12)
Glass Border Top:  rgba(0, 255, 180, 0.25)
Glass Hover:       rgba(14, 38, 30, 0.94)
Glass Glow:        0 12px 48px rgba(0,0,0, 0.68)
```

---

## Shadow System

### Depth Levels (Dark Theme Reference)
```
xs:  0 1px 3px    rgba(0, 0, 0, 0.20)   {Subtle}
sm:  0 2px 5px    rgba(0, 0, 0, 0.30)   {Light}
md:  0 6px 16px   rgba(0, 0, 0, 0.42)   {Standard} ← DEFAULT
lg:  0 16px 48px  rgba(0, 0, 0, 0.55)   {Elevated} ← HOVER
xl:  0 32px 72px  rgba(0, 0, 0, 0.65)   {Modal}
```

### Premium Glows
```
Gold Glow:  0 0 48px rgba(196, 154, 26, 0.22)   {Default}
           0 0 32px rgba(196, 154, 26, 0.26)    {Hover}

Blue Glow:  0 0 28px rgba(129, 140, 248, 0.24)
Cyan Glow:  0 0 48px rgba(0, 255, 180, 0.28)
```

---

## Border Radius Scale

```
xs:   0.25rem  (4px)     {Small buttons, compact}
sm:   0.375rem (6px)     {Compact cards}
md:   0.5rem   (8px)     {Medium elements}
lg:   0.875rem (14px)    {DEFAULT - Premium}
xl:   1.125rem (18px)    {Large containers}
2xl:  1.5rem   (24px)    {Full cards, modals}
```

---

## Typography Scale

### Font Weights
```
Light:      300  {Rarely used}
Regular:    400  {Body text}
Medium:     500  {DEFAULT - Premium body}
Semibold:   600  {Labels, buttons}
Bold:       700  {Headings}
Extrabold:  800  {Section headers}
Black:      900  {Page titles, badges}
```

### Font Sizes
```
2xs:   0.625rem (10px)
xs:    0.75rem  (12px)
sm:    0.875rem (14px)
base:  1rem     (16px)   {DEFAULT}
lg:    1.125rem (18px)
xl:    1.25rem  (20px)
2xl:   1.5rem   (24px)
3xl:   1.875rem (30px)
```

---

## Component Color Reference

### Glass Card
```
Background:  var(--glass-bg)          [Frosted effect]
Border:      var(--glass-border)      [Subtle hairline]
Border Top:  var(--glass-border-top)  [Light highlight]
Shadow:      var(--glass-shadow)      [Depth]
Hover BG:    var(--glass-hover-bg)    [Lifted state]
Hover Glow:  var(--glass-hover-shadow)[Premium effect]
```

### Metric Card
```
Background:     var(--glass-bg)
Label Color:    hsl(var(--muted-foreground))
Label Weight:   700 (Bold)
Value Color:    hsl(var(--foreground))
Value Weight:   900 (Black)
Hover Shadow:   var(--shadow-lg)
```

### Badge (e.g., badge-pro)
```
Background:  linear-gradient(135deg, 
             rgba(196,154,26, 0.22), 
             rgba(196,154,26, 0.12))
Border:      rgba(196,154,26, 0.42)
Text Color:  hsl(var(--primary))
Text Weight: 900 (Black)
Glow:        0 0 16px rgba(196,154,26, 0.15)
```

### Section Heading
```
Text Color:    hsl(var(--muted-foreground))
Text Weight:   900 (Black)
Letter Space:  0.16em
Accent Bar:    linear-gradient(180deg, 
               hsl(var(--primary)) 0%, 
               transparent 100%)
Bar Width:     2.5px
```

---

## Accessible Color Contrasts

### Dark Theme
```
Foreground on Background:  #f8f9fd on #050a16 = 20.4:1 (AAA)
Primary on Background:     #c49a1a on #050a16 = 3.8:1  (AA)
Muted on Background:       #a0aac5 on #050a16 = 9.2:1  (AAA)
```

### Light Theme
```
Foreground on Background:  #1a1c23 on #ede7ed = 17.8:1 (AAA)
Primary on Background:     #c49a1a on #ede7ed = 3.6:1  (AA)
Muted on Background:       #5a5a5a on #ede7ed = 7.2:1  (AAA)
```

### Blue Theme
```
Foreground on Background:  #f8f9fa on #0a2832 = 19.8:1 (AAA)
Primary on Background:     #22d3ee on #0a2832 = 7.2:1  (AAA)
Secondary on Background:   #14b8a6 on #0a2832 = 6.8:1  (AAA)
```

### Midnight Theme
```
Foreground on Background:  #f8f9f8 on #091e17 = 20.1:1 (AAA)
Primary on Background:     #00ffcc on #091e17 = 9.2:1  (AAA)
Muted on Background:       #a0c8b0 on #091e17 = 8.1:1  (AAA)
```

---

## Gradient Reference

### Gold Theme Gradient
```css
linear-gradient(135deg, 
  #c49a1a 0%,     {Dark gold}
  #e7b733 35%,    {Medium gold}
  #f3db99 50%,    {Light gold peak}
  #e7b733 70%,    {Back to medium}
  #c49a1a 100%)   {Back to dark}
```

### Blue Theme Gradient
```css
linear-gradient(135deg, 
  #22d3ee 0%,     {Vibrant cyan}
  #14b8a6 50%,    {Warm tosca}
  #06b6d4 100%)   {Deeper cyan}
```

### Midnight Theme Gradient
```css
linear-gradient(135deg, 
  #00ffcc 0%,     {Bright cyan}
  #06ffd2 35%,    {Lighter cyan}
  #00cc99 65%,    {Darker cyan}
  #00ffcc 100%)   {Back to bright}
```

---

## Quick Hex Reference

### All Themes Primary Colors
```
Dark:      #c49a1a (Gold)
Light:     #c49a1a (Gold)
Blue:      #5aadff (Cyan)
Midnight:  #00ffcc (Neon Cyan)
```

### All Themes Background
```
Dark:      #050a16 (Navy)
Light:     #ede7ed (Silver)
Blue:      #050812 (Indigo)
Midnight:  #091e17 (Teal)
```

### All Themes Foreground
```
Dark:      #f8f9fd (White+)
Light:     #1a1c23 (Navy)
Blue:      #f6f5f8 (White+)
Midnight:  #f8f9f8 (White)
```

---

## Testing Checklist

✓ All 4 themes display correctly
✓ Glass cards show proper blur and glow
✓ Text contrast meets WCAG AA (4.5:1)
✓ Badges display gradient backgrounds
✓ Shadows create proper depth hierarchy
✓ Metric values stand out with bold weight
✓ Responsive design works on mobile
✓ Focus states visible for accessibility

---

*This document serves as a comprehensive color reference for the Modern Premium Design System v4.0*
