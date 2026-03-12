# Tasks: Marketplace Implementation

## 📋 Checklist

- [ ] **Phase 3: Data Layer**
  - [ ] 3.1 Add `getOfficialCharacters()` to storage.js
  - [ ] 3.2 Add `getAllCharacters()` to storage.js
  - [ ] 3.3 Create `data/official-characters.json` with 10 characters
  - [ ] 3.4 Load official characters at app startup (fetch + cache)

- [ ] **Phase 4: UI Components**
  - [ ] 4.1 Add tab navigation in index.html (🏠 My / 🌐 Marketplace)
  - [ ] 4.2 Add CSS for tabs (active state, spacing)
  - [ ] 4.3 Add CSS for badges (official, mine)
  - [ ] 4.4 Modify character card to show badges
  - [ ] 4.5 Conditionally show/hide edit/delete buttons in marketplace

- [ ] **Phase 5: State & Logic**
  - [ ] 5.1 Add `currentPage` state switch in App
  - [ ] 5.2 Add `allCharacters` state
  - [ ] 5.3 Implement `switchTab(tabName)` method
  - [ ] 5.4 Implement `getFilteredMarketplaceCharacters()` method
  - [ ] 5.5 Update `renderCharacterList()` to use correct character source
  - [ ] 5.6 Create `renderMarketplace()` method (or unify with home)

- [ ] **Phase 6: Filters**
  - [ ] 6.1 Add marketplace-specific filter: 'all' | 'official' | 'mine'
  - [ ] 6.2 Apply filter in `getFilteredMarketplaceCharacters()`
  - [ ] 6.3 Wire UI for source filter (buttons or dropdown)

- [ ] **Phase 7: Chat Integration**
  - [ ] 7.1 Verify clicking any card opens chat (works already)
  - [ ] 7.2 Ensure chat works for official characters (no special handling needed)

- [ ] **Phase 8: Testing & Polish**
  - [ ] 8.1 Manual test: Tab switching
  - [ ] 8.2 Manual test: Official cards display with badge
  - [ ] 8.3 Manual test: User cards display with "我的" badge
  - [ ] 8.4 Manual test: No edit/delete buttons in marketplace
  - [ ] 8.5 Manual test: Search works across both sources
  - [ ] 8.6 Manual test: Tag filters work
  - [ ] 8.7 Manual test: Chat flow for official and user chars
  - [ ] 8.8 Error handling: official-characters.json fails to load
  - [ ] 8.9 Performance: 10 + N characters renders smoothly

---

## Task Details

### 3.1 Storage: getOfficialCharacters()

**File:** `js/storage.js`

```javascript
getOfficialCharacters() {
  return window.OFFICIAL_CHARACTERS || [];
}
```

**Note:** Characters loaded from JSON at app startup, stored on `window` global.

---

### 3.2 Storage: getAllCharacters()

```javascript
getAllCharacters() {
  const user = this.getCharacters();
  const official = this.getOfficialCharacters();
  return [...official, ...user];
}
```

---

### 3.3 Create official-characters.json

**File:** `data/official-characters.json` (new)

Create 10 diverse characters with:
- Varied genders (male, female, other)
- Different personality tags
- Engaging backstories (100-200 chars)
- First-person descriptions (50-100 chars)
- Avatar emojis (no images)

**Example:**

```json
{
  "id": "official-01",
  "name": "艾琳",
  "gender": "female",
  "personality": ["温柔", "博学", "治愈系"],
  "backstory": "艾琳是酒馆的常驻女巫，精通药剂学和古代咒语。她能用一杯茶的时间听你倾诉烦恼，用魔法为你驱散忧郁。",
  "description": "你好呀，旅行者。想喝点什么？我这里有能解忧的药茶哦~",
  "avatar": "🧙‍♀️",
  "source": "official",
  "isOfficial": true,
  "createdBy": null,
  "createdAt": 1741572000000
}
```

---

### 3.4 Load at Startup

**File:** `js/app.js` - `init()` method

```javascript
async init() {
  // Load official characters first
  try {
    const response = await fetch('/data/official-characters.json');
    if (response.ok) {
      const data = await response.json();
      window.OFFICIAL_CHARACTERS = data;
      this.state.allCharacters = data;
    } else {
      console.error('Failed to load official characters');
      window.OFFICIAL_CHARACTERS = [];
      this.state.allCharacters = [];
    }
  } catch (e) {
    console.error('Error loading official characters:', e);
    window.OFFICIAL_CHARACTERS = [];
    this.state.allCharacters = [];
  }

  // Continue with existing init
  this.loadCharacters();
  this.bindEvents();
  this.showPage('home');
  this.checkApiKey();
}
```

---

### 4.1-4.3: Navigation & CSS

**index.html:** Add tabs inside `#page-home`:

```html
<div class="home-header">
  <h2>角色列表</h2>
  <div class="nav-tabs">
    <button class="tab active" data-tab="home">🏠 我的</button>
    <button class="tab" data-tab="marketplace">🌐 广场</button>
  </div>
</div>
```

**css/style.css:**

```css
.nav-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.tab {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
}
.tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
```

---

### 4.4-4.5: Badges & Actions

**app.js:** Modify `renderCharacterList()` to accept character source param:

```javascript
renderCharacterList(characters, isMarketplace = false) {
  // ... existing loop
  const actions = (!isMarketplace && char.source === 'user')
    ? `<button class="btn-secondary btn-edit" data-id="${char.id}">编辑</button>
       <button class="btn-secondary btn-delete" data-id="${char.id}">删除</button>`
    : '';
  // ... add badge logic as shown in design.md
}
```

Then `renderMarketplace()`:

```javascript
renderMarketplace() {
  const chars = this.getFilteredMarketplaceCharacters();
  this.renderCharacterList(chars, true);
}
```

---

### 5.1-5.6: State & Routing

**app.js state:**

```javascript
state: {
  currentPage: 'home',
  characters: [],
  allCharacters: [],
  filters: {
    marketplace: 'all',
    search: '',
    tags: []
  }
}
```

**switchTab() method:**

```javascript
switchTab(tabName) {
  this.state.currentPage = tabName;

  // Update tab buttons
  document.querySelectorAll('.nav-tabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  // Reset filters for marketplace
  if (tabName === 'marketplace') {
    this.state.filters.marketplace = 'all';
    // Optional: reset tag filters
    document.querySelectorAll('#tag-filters .tag.active').forEach(t => t.classList.remove('active'));
    this.state.filters.tags = [];
  }

  // Render
  if (tabName === 'home') {
    this.renderCharacterList(this.state.characters, false);
  } else if (tabName === 'marketplace') {
    this.renderMarketplace();
  }
}
```

Bind tab click events:

```javascript
// In bindEvents(), add after other bindings
document.querySelectorAll('#page-home .nav-tabs').forEach(container => {
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab')) {
      this.switchTab(e.target.dataset.tab);
    }
  });
});
```

---

### 6.1-6.3: Marketplace Filter

Add UI for source filter in `#page-home` (below tabs?):

```html
<div class="source-filter" style="margin: 10px 0;">
  <button class="tag" data-filter="all">全部</button>
  <button class="tag" data-filter="official">官方</button>
  <button class="tag" data-filter="mine">我的</button>
</div>
```

**Handler:**

```javascript
// In bindEvents()
document.querySelector('.source-filter').addEventListener('click', (e) => {
  if (e.target.classList.contains('tag')) {
    this.state.filters.marketplace = e.target.dataset.filter;
    document.querySelectorAll('.source-filter .tag').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === this.state.filters.marketplace);
    });
    this.renderMarketplace();
  }
});
```

**In `getFilteredMarketplaceCharacters()`:**

```javascript
getFilteredMarketplaceCharacters() {
  let chars = this.state.allCharacters;

  // Source filter
  const src = this.state.filters.marketplace;
  if (src === 'official') chars = chars.filter(c => c.isOfficial);
  else if (src === 'mine') chars = chars.filter(c => !c.isOfficial);

  // Search
  if (this.state.filters.search) {
    const q = this.state.filters.search.toLowerCase();
    chars = chars.filter(c => c.name.toLowerCase().includes(q));
  }

  // Tags
  if (this.state.filters.tags.length > 0) {
    chars = chars.filter(c => this.state.filters.tags.some(t => c.personality.includes(t)));
  }

  return chars;
}
```

---

### 7.1-7.2: Chat Integration

**No changes needed.** The existing `openChat(characterId)` uses `Storage.getCharacter(id)` which only gets user chars. We need it to also get official chars.

**Modify `openChat()`:**

```javascript
openChat(characterId) {
  // Try user chars first, then official
  let character = Storage.getCharacter(characterId);
  if (!character) {
    // Search in official chars
    character = window.OFFICIAL_CHARACTERS?.find(c => c.id === characterId) || null;
  }

  if (!character) {
    Utils.showToast('角色不存在', 'error');
    return;
  }

  // ... rest unchanged
}
```

---

### 8.1-8.9: Testing Checklist

Follow the manual test list in checklist above. Verify all scenarios. Ensure no console errors.

---

## Artifacts

| File | Type | Status |
|------|------|--------|
| `data/official-characters.json` | Data | To create (10 characters) |
| `js/storage.js` | Code | Methods to add |
| `js/app.js` | Code | State, methods, events |
| `index.html` | UI | Add tabs, filters |
| `css/style.css` | Style | Tabs, badges |
| `openspec/changes/td-2025-010-marketplace/` | Spec | This folder |

---

## Notes for Builder

- **Do not modify** existing user data structures
- **Do not break** existing "My Characters" functionality
- **Badges must be distinct** (colors, icons)
- **Edit/Delete buttons** only in home tab and only for user chars
- **Performance:** Official chars are small (10); no batching needed
- **Error handling:** If official JSON fails to load, show empty official list but don't crash

---

**Task Status:** Pending Assignment  
**Assignee:** nishang  
**Estimated Effort:** 45-60 minutes
