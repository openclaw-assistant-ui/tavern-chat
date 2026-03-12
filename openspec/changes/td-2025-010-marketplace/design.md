# Design: Marketplace Implementation for Tavern Chat

## Architecture Overview

The marketplace feature extends the existing single-page app with minimal changes. It reuses the same data layer and chat functionality, adding a new "tab" view that mixes official and user characters.

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                    App (app.js)                      │
│  • Manages state (currentPage, characters, filters) │
│  • Routes between 'home' and 'marketplace' tabs    │
│  • Delegates rendering to components                │
└─────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Storage     │  │  API Layer   │  │  DOM Utils   │
│  (storage.js)│  │  (api.js)    │  │  (utils.js)  │
│              │  │              │  │              │
│ • User chars │  │ • chat()    │  │ • render()   │
│ • Official   │  │ • gen*()    │  │ • escape()   │
│   chars      │  │              │  │ • badge()    │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                  Data Sources                       │
│  • localStorage: user characters, chat history     │
│  • JSON file: official-characters.json             │
└─────────────────────────────────────────────────────┘
```

## Data Model Changes

### Enhanced Character Object

```typescript
interface Character {
  // Existing fields
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  personality: string[];
  backstory: string;
  description: string;
  avatar: string; // emoji or data URL

  // New fields (source identification)
  source: 'official' | 'user';
  isOfficial: boolean; // convenience flag
  createdBy?: string | null; // future-proof for multi-user

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### Official Character JSON Structure

`data/official-characters.json`:

```json
[
  {
    "id": "official-01",
    "name": "艾琳",
    "gender": "female",
    "personality": ["温柔", "博学", "治愈系"],
    "backstory": "艾琳是酒馆的常驻女巫，精通药剂学和古代咒语。她能用一杯茶的时间听你倾诉烦恼...",
    "description": "你好呀，旅行者。想喝点什么？我这里有能解忧的药茶哦~",
    "avatar": "🧙‍♀️",
    "source": "official",
    "isOfficial": true,
    "createdBy": null,
    "createdAt": 1741572000000
  },
  ...
]
```

## Storage Layer Changes

### New Methods in `Storage`

```javascript
// 1. Get all official characters (read from JSON)
getOfficialCharacters() {
  // Load from /data/official-characters.json (synchronously at init)
  // Cache in memory to avoid repeated fetch
  return window.OFFICIAL_CHARACTERS || [];
}

// 2. Get all characters (official + user)
getAllCharacters() {
  const userChars = this.getCharacters(); // existing
  const officialChars = this.getOfficialCharacters();
  return [...officialChars, ...userChars];
}
```

**Implementation note:** Load JSON at app startup:

```javascript
// In App.init()
fetch('/data/official-characters.json')
  .then(r => r.json())
  .then(data => {
    window.OFFICIAL_CHARACTERS = data;
    this.allCharacters = data; // for marketplace
    this.loadCharacters(); // load user chars
    this.renderMarketplace(); // render initial view
  });
```

## UI Changes

### 1. Navigation Tabs (HTML)

```html
<div class="nav-tabs">
  <button class="tab active" data-tab="home">🏠 我的</button>
  <button class="tab" data-tab="marketplace">🌐 广场</button>
</div>
```

### 2. Character Grid (Shared Component)

Same grid layout, but with conditional badges:

```javascript
function renderCharacterCard(char) {
  const isMine = char.source === 'user';
  const isOfficial = char.source === 'official';

  let badge = '';
  if (isOfficial) {
    badge = '<span class="badge official-badge">🏛️ 官方</span>';
  } else if (isMine) {
    badge = '<span class="badge mine-badge">👤 我的</span>';
  }

  // In marketplace tab, no edit/delete buttons
  const actions = (currentTab === 'home' && isMine)
    ? `<button class="btn-edit" data-id="${char.id}">编辑</button>
       <button class="btn-delete" data-id="${char.id}">删除</button>`
    : '';

  return `
    <div class="character-card" data-id="${char.id}">
      ${badge}
      <div class="character-avatar">${char.avatar}</div>
      <div class="character-info">
        <div class="character-name">${Utils.escapeHtml(char.name)}</div>
        <div class="character-tags">
          ${char.personality.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      ${actions}
    </div>
  `;
}
```

### 3. CSS Additions

```css
/* Tab Navigation */
.nav-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
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
}
.official-badge { background: #ffc107; color: #000; }
.mine-badge { background: #28a745; }

/* Character Card Actions */
.character-card {
  position: relative; /* for badges */
}
.character-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
```

### 4. State Management

```javascript
state: {
  currentPage: 'home', // or 'marketplace'
  characters: [],      // user characters only (for 'home')
  allCharacters: [],   // all chars (for 'marketplace')
  filters: {
    marketplace: 'all', // 'all' | 'official' | 'mine'
    search: '',
    tags: []
  }
}
```

## Interaction Flow

### Tab Switching

```javascript
switchTab(tabName) {
  this.state.currentPage = tabName;

  // Update UI
  document.querySelectorAll('.nav-tabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  // Render appropriate list
  if (tabName === 'home') {
    this.renderCharacterList(); // uses this.state.characters
  } else if (tabName === 'marketplace') {
    this.renderMarketplace(); // uses this.state.allCharacters
  }
}
```

### Marketplace Filtering

```javascript
getFilteredMarketplaceCharacters() {
  let chars = this.state.allCharacters;

  // Source filter
  if (this.state.filters.marketplace === 'official') {
    chars = chars.filter(c => c.isOfficial);
  } else if (this.state.filters.marketplace === 'mine') {
    chars = chars.filter(c => !c.isOfficial);
  }

  // Search + tags (same as home)
  if (this.state.filters.search) {
    const q = this.state.filters.search.toLowerCase();
    chars = chars.filter(c => c.name.toLowerCase().includes(q));
  }
  if (this.state.filters.tags.length > 0) {
    chars = chars.filter(c =>
      this.state.filters.tags.some(tag => c.personality.includes(tag))
    );
  }

  return chars;
}
```

### Click to Chat

Same as home: clicking any card (official or user) opens chat interface. No special handling needed.

## OpenSpec Compliance

This design follows OpenSpec principles:

- **Single Responsibility:** Each module has clear purpose
- **Explicit Dependencies:** Storage → API → DOM (no circular)
- **Schema-driven:** Character interface clearly defined
- **Traceable:** Changes isolated to specific files
- **Testable:** Pure functions (filtering, rendering) easy to unit test

## Non-Functional Requirements

- ✅ **Performance:** Official chars cached in memory, no repeated fetch
- ✅ **Offline-first:** All data local, no network calls except OpenAI
- ✅ **Maintainability:** Clear separation, reusable components
- ✅ **Extensibility:** Easy to add more official chars later

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Official chars JSON missing | Fallback to empty array + log error |
| User confused by editable vs read-only | Clear badges, hide edit buttons in marketplace |
| Future multi-user confusion | Keep `createdBy` field for future, no behavior change now |

## Migration Notes

No data migration needed. Existing user characters are untouched. The feature is additive.

---

**Design Status:** FINAL  
**Author:** Orchestrator (huayu)  
**Date:** 2026-03-10
