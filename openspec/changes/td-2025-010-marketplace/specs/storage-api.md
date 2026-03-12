# Storage API Specification

## Overview

Extends `Storage` module to support official characters and unified listing.

---

## New Methods

### `getOfficialCharacters(): Character[]`

**Purpose:** Return all official (curated) characters.

**Returns:**
- Array of `Character` objects (each with `source: 'official'`, `isOfficial: true`)
- Empty array `[]` if not loaded or JSON missing

**Side Effects:** None (pure read from `window.OFFICIAL_CHARACTERS`)

**Throws:** Never (returns empty array on error, logs to console)

**Example:**

```javascript
const official = Storage.getOfficialCharacters();
// → [{ id: 'official-01', name: '艾琳', source: 'official', ... }]
```

---

### `getAllCharacters(): Character[]`

**Purpose:** Return all characters accessible to the user (official + user-created).

**Returns:** Array with:
- First: all official characters (in order from JSON)
- Then: all user characters (in order from storage, typically by `createdAt`)

**Side Effects:** None

**Throws:** Never

**Example:**

```javascript
const all = Storage.getAllCharacters();
// → length = 10 (official) + N (user)
```

---

## Modified Methods

### `getCharacter(id: string): Character | null`

**Behavior Change:** Now searches both user characters and official characters.

**Algorithm:**

```javascript
getCharacter(id) {
  // Search user chars first
  const user = this.getCharacters().find(c => c.id === id);
  if (user) return user;

  // Fallback to official chars
  const official = this.getOfficialCharacters().find(c => c.id === id);
  return official || null;
}
```

**Rationale:** Allows `openChat(characterId)` to work for official characters.

---

## Initialization

New app-level initialization step:

```javascript
// In App.init() before loadCharacters()
async initializeOfficialCharacters() {
  try {
    const response = await fetch('/data/official-characters.json');
    if (response.ok) {
      const data = await response.json();
      window.OFFICIAL_CHARACTERS = data;
    } else {
      console.error('official-characters.json not found or invalid');
      window.OFFICIAL_CHARACTERS = [];
    }
  } catch (e) {
    console.error('Failed to load official characters:', e);
    window.OFFICIAL_CHARACTERS = [];
  }
}
```

---

## Error Handling

- If JSON fetch fails, `getOfficialCharacters()` returns `[]`
- No alert/toast shown to user (silent fallback)
- Console error logged for debugging

---

## Performance

- `window.OFFICIAL_CHARACTERS` is a global variable, no repeated fetch after init
- `getAllCharacters()` is O(N) where N ~ 10 + user count (small)
- Suitable for rendering entire character grid on each filter change

---

## Backward Compatibility

- Existing user data in localStorage remains unchanged
- `getCharacters()` still returns only user characters
- The new methods extend functionality without breaking existing code

---

**Spec Status:** FINAL  
**Version:** 1.0  
**Date:** 2026-03-10
