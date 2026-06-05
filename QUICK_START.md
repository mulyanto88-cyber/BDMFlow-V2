# ⚡ Quick Start Guide — Modern Premium Theme

## 🎨 Theme Overview (30 seconds)

Your app now has a **modern premium design system** with 4 sophisticated themes:
- 🌙 **Dark** (Default) — Navy + Gold
- ☀️ **Light** — Silver Lustre  
- 💙 **Blue** — Indigo Premium
- 🌃 **Midnight** — Cyberpunk Neon

---

## 💻 How to Use

### Apply a Theme
```jsx
<html className="dark">          {/* Dark theme (default) */}
<html className="">              {/* Light theme */}
<html className="theme-blue">    {/* Blue theme */}
<html className="theme-midnight">{/* Cyberpunk theme */}
```

### Change Theme Dynamically
```tsx
const [theme, setTheme] = useState('dark')

useEffect(() => {
  document.documentElement.className = theme
}, [theme])

return (
  <button onClick={() => setTheme('dark')}>Switch Theme</button>
)
```

---

## 🎯 Common Components

### Premium Card
```jsx
<div className="glass p-4 rounded-lg">
  Content automatically gets premium styling
</div>
```

### Metric Display
```jsx
<div className="metric-card">
  <div className="metric-label">TITLE</div>
  <div className="metric-value">1,234</div>
</div>
```

### Badge
```jsx
<span className="badge-pro">PRO</span>
<span className="badge-hot">HOT</span>
<span className="badge-new">NEW</span>
<span className="badge-beta">BETA</span>
```

### Section Header
```jsx
<h3 className="section-heading">SECTION NAME</h3>
```

---

## 🎨 Color Usage

### ✅ USE THESE (Semantic Tokens)
```jsx
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<button className="bg-primary text-primary-foreground">
<div className="text-muted-foreground">
<div className="border border-border">
```

### ❌ AVOID THESE (Hardcoded)
```jsx
<div style={{ background: '#050a16' }}>  {/* ❌ Won't theme */}
<span className="text-blue-500">         {/* ❌ Wrong color */}
```

---

## 📐 Spacing

### Standard Sizes
```jsx
<div className="p-2">    {/* 8px padding */}
<div className="p-4">    {/* 16px padding - STANDARD */}
<div className="p-6">    {/* 24px padding */}
<div className="gap-4">  {/* 16px gap between items */}
```

### ❌ Avoid Arbitrary Values
```jsx
<div className="px-[17px]"> {/* ❌ Breaks system */}
<div className="mb-5">      {/* ❌ Use mb-4 or mb-6 */}
```

---

## 🔤 Typography

### Font Weights
```jsx
<h1 className="font-black">       {/* 900 - Page title */}
<h2 className="font-bold">        {/* 700 - Section header */}
<p className="font-medium">        {/* 500 - Body text (default) */}
<label className="font-semibold"> {/* 600 - Form label */}
```

---

## 🌈 Responsive Design

### Mobile-First Pattern
```jsx
<div className="text-sm md:text-base lg:text-lg">
  {/* Small on mobile, medium on tablet, large on desktop */}
</div>

<div className="px-3 md:px-4 lg:px-6">
  {/* Compact mobile, normal tablet, spacious desktop */}
</div>
```

### Breakpoints
```
sm: 640px   (Large phone)
md: 768px   (Tablet)
lg: 1024px  (Desktop)
xl: 1280px  (Large desktop)
```

---

## ✨ Premium Effects

### Glassmorphic Card
```jsx
<div className="glass">
  {/* Automatic: blur, saturation, premium border, hover lift */}
</div>
```

### Hover Shadow Lift
```jsx
<div className="shadow-md hover:shadow-lg">
  {/* Lifts with shadow on hover */}
</div>
```

### Glow Effect
```jsx
<div className="shadow-gold">
  {/* Premium gold glow */}
</div>
```

---

## 🎯 Quality Checklist

Before committing, verify:
- [ ] Colors use semantic tokens (not hardcoded)
- [ ] Spacing uses Tailwind scale (not arbitrary values)
- [ ] Typography uses font-weight 500+
- [ ] Components tested in all 4 themes
- [ ] Hover states look good
- [ ] Mobile responsive with md:/lg: prefixes
- [ ] No console errors
- [ ] Accessibility OK (text readable, contrast good)

---

## 📚 Learn More

- **Full Guide:** See `DESIGN_SYSTEM.md`
- **Token Reference:** See `DESIGN_TOKENS.md`
- **Implementation:** See `THEME_IMPLEMENTATION.md`
- **Update Summary:** See `THEME_UPDATE_SUMMARY.md`

---

## 🚀 Common Tasks

### Change All Cards to Premium Style
**Before:**
```jsx
<div className="border border-gray-200 rounded-md p-4">
```

**After:**
```jsx
<div className="glass p-4">
```

### Make Text Bold for Heading
```jsx
<h2 className="text-xl font-bold">Heading</h2>
```

### Add Premium Button
```jsx
<button className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:shadow-lg transition-all">
  Click Me
</button>
```

### Create Badge
```jsx
<span className="badge-pro">PRO USER</span>
```

---

## 🎪 Real Examples

### Premium Stats Card
```jsx
<div className="glass p-6 rounded-lg">
  <h3 className="section-heading">STATISTICS</h3>
  <div className="grid grid-cols-3 gap-4 mt-4">
    <div className="metric-card">
      <div className="metric-label">TODAY</div>
      <div className="metric-value">+12.5%</div>
    </div>
    {/* More cards */}
  </div>
</div>
```

### Premium Header
```jsx
<header className="app-header">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-black">BDMFlow</h1>
    <div className="flex gap-2">
      <span className="badge-pro">PRO</span>
      <button className="glass px-3 py-1 rounded-lg">Menu</button>
    </div>
  </div>
</header>
```

### Data Table with Premium Style
```jsx
<div className="panel rounded-lg overflow-hidden">
  <table className="w-full">
    <thead className="bg-accent/50">
      <tr>
        <th className="p-4 text-left font-black">Column</th>
      </tr>
    </thead>
    <tbody>
      <tr className="hover:bg-accent/30 transition-colors">
        <td className="p-4">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🎨 Theme Color Quick Ref

### Dark (Default)
- Use when: Always recommended
- Background: Very dark navy
- Text: Crisp white
- Accent: Rich gold

### Light
- Use when: Daytime, presentations
- Background: Soft silver
- Text: Deep navy
- Accent: Same gold

### Blue
- Use when: Tech-forward feel
- Background: Deep indigo
- Text: Bright white
- Accent: Bright cyan

### Midnight
- Use when: Futuristic, high-energy
- Background: Deep teal
- Text: Crisp white
- Accent: Neon cyan

---

## ⚡ Pro Tips

1. **Always test in all 4 themes** - Right-click theme class in DevTools
2. **Use `.glass` for any card** - Automatic premium styling
3. **Typography hierarchy matters** - Use font-black for titles
4. **Spacing is consistent** - Use Tailwind scale (4, 8, 12, 16, 24...)
5. **Hover states lift** - Use `hover:shadow-lg` for depth
6. **Mobile first** - Start with sm screens, add md:, lg: for larger
7. **Colors are semantic** - `primary` changes with theme automatically
8. **Gradients glow** - Use `shadow-gold` for premium feel

---

## ❓ FAQ

**Q: Why can't I use `bg-blue-500`?**  
A: Custom colors break theming. Use `bg-primary` or `bg-accent` instead.

**Q: What if I need a custom color?**  
A: Ask your designer to add it to DESIGN_TOKENS.md first.

**Q: How do I test all themes?**  
A: Toggle the class name in DevTools Inspector > Elements.

**Q: Mobile looks weird?**  
A: Add `md:` prefixes for tablet, `lg:` for desktop.

**Q: Text not readable?**  
A: Use darker font-weight. Try font-semibold or font-bold.

---

## 📞 Need Help?

1. Check the documentation files (DESIGN_SYSTEM.md, etc.)
2. Look at existing components in `src/components/`
3. Inspect element in DevTools to see applied classes
4. Ask your designer or lead

---

**Status:** ✅ Ready to use  
**Version:** 4.0  
**Last Updated:** June 5, 2026

Happy building! 🚀✨
