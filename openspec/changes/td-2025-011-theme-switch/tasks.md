# Tasks: Theme Switcher

## 📋 Checklist

- [ ] Phase 1: CSS Variables
  - [ ] 1.1 Define `--bg-primary`, `--text-primary`, `--accent-color` in `:root` (light defaults)
  - [ ] 1.2 Add `[data-theme="dark"]` overrides in `css/style.css`
- [ ] Phase 2: HTML Button
  - [ ] 2.1 Add theme toggle button to `index.html` (top-right, inside header)
  - [ ] 2.2 Button content: `🌓` (or dynamic based on current theme)
- [ ] Phase 3: JavaScript Logic
  - [ ] 3.1 In `js/app.js`, add `initTheme()` method (read LocalStorage, set `data-theme`)
  - [ ] 3.2 Add `toggleTheme()` method (switch, save to LocalStorage, update button emoji)
  - [ ] 3.3 Bind button click to `toggleTheme()`
  - [ ] 3.4 Call `initTheme()` on app startup
- [ ] Phase 4: Testing
  - [ ] 4.1 Click toggle → theme switches immediately
  - [ ] 4.2 Refresh → theme persists
  - [ ] 4.3 All UI elements readable in both themes
  - [ ] 4.4 No console errors

---

## Task Details

### 1.1 CSS Variables (light theme)

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --accent-color: #007bff;
}
```

### 1.2 Dark Theme Override

```css
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #e0e0e0;
  --accent-color: #4a90d9;
}

/* Apply to body */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### 2.1 HTML Button

```html
<header class="app-header">
  <h1>酒馆聊天</h1>
  <button id="theme-toggle" class="btn-icon">🌓</button>
</header>
```

### 3.1 initTheme()

```javascript
initTheme() {
  const saved = localStorage.getItem('tavern-chat-theme');
  const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  this.updateThemeButton(isDark);
}
```

### 3.2 toggleTheme()

```javascript
toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tavern-chat-theme', next);
  this.updateThemeButton(next === 'dark');
}

updateThemeButton(isDark) {
  document.getElementById('theme-toggle').textContent = isDark ? '🌙' : '☀️';
}
```

### 3.3 Bind Event

```javascript
bindEvents() {
  // ... existing bindings
  document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
}
```

---

**Status:** Pending Assignment
**Assignee:** nishang
**Estimated Effort:** 30 minutes