# UI Components Specification

---

## 1. Tab Navigation

### Structure

```html
<div class="nav-tabs">
  <button class="tab active" data-tab="home">🏠 我的</button>
  <button class="tab" data-tab="marketplace">🌐 广场</button>
</div>
```

### States

- **Default:** Gray background, black text
- **Active:** Blue background (`#007bff`), white text, border same blue

### Behavior

- Clicking a tab switches `state.currentPage` and rerenders the character list
- Tabs are not toggle-able outside this pair (only one active always)

---

## 2. Source Filter (Marketplace Only)

**Visible only when `state.currentPage === 'marketplace'`**

### Structure

```html
<div class="source-filter">
  <button class="tag active" data-filter="all">全部</button>
  <button class="tag" data-filter="official">官方</button>
  <button class="tag" data-filter="mine">我的</button>
</div>
```

### States

- **Default:** Light background, black text
- **Active:** Dark background, white text

### Behavior

- Clicking changes `state.filters.marketplace`
- Triggers rerender of marketplace grid

---

## 3. Character Card

### HTML Template

```javascript
function renderCharacterCard(char, isMarketplace) {
  // Badge logic
  let badgeHtml = '';
  if (char.isOfficial) {
    badgeHtml = '<span class="badge official-badge">🏛️ 官方</span>';
  } else if (!isMarketplace) { // "我的" badge only on home page
    badgeHtml = '<span class="badge mine-badge">👤 我的</span>';
  }

  // Actions (edit/delete): only on home tab AND user characters
  let actionsHtml = '';
  if (!isMarketplace && !char.isOfficial) {
    actionsHtml = `
      <button class="btn-secondary btn-edit" data-id="${char.id}">编辑</button>
      <button class="btn-secondary btn-delete" data-id="${char.id}">删除</button>
    `;
  }

  return `
    <div class="character-card" data-id="${char.id}">
      ${badgeHtml}
      <div class="character-avatar">${Utils.escapeHtml(char.avatar)}</div>
      <div class="character-info">
        <div class="character-name">${Utils.escapeHtml(char.name)}</div>
        <div class="character-tags">
          ${char.personality.map(t => `<span class="tag">${Utils.escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="character-meta">点击开始聊天</div>
      </div>
      ${actionsHtml}
    </div>
  `;
}
```

### CSS

```css
.character-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  position: relative; /* for badges */
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.character-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.character-avatar {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.character-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}

.character-tags .tag {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.character-meta {
  text-align: center;
  color: #666;
  font-size: 13px;
}

/* Badges */
.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  z-index: 1;
}
.official-badge { background: #ffc107; color: #000; }
.mine-badge { background: #28a745; }

/* Actions */
.character-actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
}
.btn-secondary {
  padding: 6px 12px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn-secondary:hover {
  background: #007bff;
  color: white;
}
```

---

## 4. Empty State

**When no characters match filters:**

```html
<div class="empty-state">
  <div class="empty-icon">🔍</div>
  <div class="empty-text">没有找到符合条件的角色</div>
</div>
```

```css
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-text {
  font-size: 16px;
}
```

---

## 5. Responsive Grid

The character grid uses CSS flexbox:

```css
.character-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
```

Responsive breakpoints:

- Mobile (1 column): `minmax(240px, 1fr)`
- Desktop: as above

---

## 6. Accessibility

- Buttons have proper `aria-label` where needed
- Tabs use `role="tablist"` and `role="tab"` (optional enhancement)
- Color contrast meets WCAG AA (official badge bg: #ffc107 vs black is OK)

---

**Spec Status:** FINAL  
**Version:** 1.0  
**Date:** 2026-03-10
