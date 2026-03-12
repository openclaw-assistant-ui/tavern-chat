# Data Model Specification

## Scope

This spec defines the enhanced character data model for marketplace support, including the new `official-characters.json` format and legacy compatibility.

---

## Character Interface

```typescript
interface Character {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Gender: 'male' | 'female' | 'other' */
  gender: 'male' | 'female' | 'other';

  /** Personality tags array (e.g., ["温柔", "博学"]) */
  personality: string[];

  /** Backstory (100-200 Chinese characters) */
  backstory: string;

  /** Self-description (50-100 Chinese characters, first-person) */
  description: string;

  /** Avatar: either emoji (e.g., "🧙‍♀️") or data URL */
  avatar: string;

  // --- NEW FIELDS (marketplace) ---

  /** Source of character: 'official' | 'user' */
  source: 'official' | 'user';

  /** Convenience flag, same as source === 'official' */
  isOfficial: boolean;

  /** Creator ID (null for official characters) */
  createdBy: string | null;

  // --- METADATA ---

  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number;

  /** Last update timestamp (milliseconds since epoch) */
  updatedAt: number;
}
```

---

## Official Character JSON Schema

**File:** `data/official-characters.json`

```json
[
  {
    "id": "official-XX",
    "name": "...",
    "gender": "male|female|other",
    "personality": ["tag1", "tag2"],
    "backstory": "string",
    "description": "string",
    "avatar": "emoji",
    "source": "official",
    "isOfficial": true,
    "createdBy": null,
    "createdAt": 1741572000000
  }
]
```

### Constraints

- `id` must be globally unique; official IDs prefixed with `official-`
- `source` must be exactly `"official"` for all entries in this file
- `isOfficial` must be `true`
- `createdBy` must be `null`
- `avatar` must be a single emoji (no data URLs for official chars)
- `backstory` length: 100-200 Chinese characters
- `description` length: 50-100 Chinese characters

---

## User Character (Legacy Compatibility)

User characters stored in `localStorage` under key `tavern_characters` use the same interface, except:

```json
{
  "id": "user-generated-uuid",
  "source": "user",
  "isOfficial": false,
  "createdBy": null, // remains null for single-user mode
  "createdAt": 1741572000000,
  "updatedAt": 1741572000000,
  // other fields same as above
}
```

On app startup, user characters are loaded normally. When `getAllCharacters()` is called, user characters are merged with official ones.

---

## State Merging Rules

1. **No overwrites:** Official and user characters have separate ID spaces (`official-*` vs `user-*`), so no collisions.
2. **Sorting:** Marketplace display should sort by:
   - Official first (ordered by `id` or explicit `order` field if added later)
   - User characters after (sorted by `updatedAt` descending)
3. **Duplicates:** Not possible by ID. If user tries to create an official character duplicate (same name), allowed (they're distinct by `id`).
4. **Updates:** Official characters are read-only (no `updateCharacter()` on them). User characters remain editable only in "My Characters" tab.

---

## Storage Methods

### `Storage.getOfficialCharacters()`

**Returns:** `Character[]` (cached from JSON)

**Behavior:**
- If `window.OFFICIAL_CHARACTERS` is set, return it.
- Else return empty array `[]` and log error.

---

### `Storage.getAllCharacters()`

**Returns:** `Character[]` (official + user)

**Behavior:**
```javascript
const official = this.getOfficialCharacters();
const user = this.getCharacters();
return [...official, ...user];
```

---

### `Storage.getCharacter(id)`

**Enhanced:** If user characters don't contain `id`, check official characters.

```javascript
getCharacter(id) {
  let char = this.getCharacters().find(c => c.id === id);
  if (!char) {
    char = this.getOfficialCharacters().find(c => c.id === id) || null;
  }
  return char;
}
```

---

## Validation Rules

When adding user characters (existing code), ensure:

```javascript
const required = ['id', 'name', 'gender', 'personality', 'avatar', 'source', 'isOfficial', 'createdAt', 'updatedAt'];
for (const field of required) {
  if (!character[field]) throw new Error(`Missing field: ${field}`);
}
if (!['official', 'user'].includes(character.source)) throw new Error('Invalid source');
if (typeof character.isOfficial !== 'boolean') throw new Error('Invalid isOfficial');
```

---

## Migration & Backward Compatibility

### Existing User Data

User characters in localStorage do **not** have `source` or `isOfficial` fields. We must handle legacy data:

```javascript
getCharacters() {
  let chars = JSON.parse(localStorage.getItem('tavern_characters') || '[]');
  
  // Backfill missing fields for legacy user characters
  chars = chars.map(c => ({
    ...c,
    source: c.source || 'user',
    isOfficial: c.isOfficial || false,
    createdBy: c.createdBy || null
  }));
  
  return chars;
}
```

---

## Future Extensions

- `order: number` for official character ordering
- `tags: { type: 'genre'|'trait'|... }` for structured metadata
- `hideFromMarketplace: boolean` (for special cases)
- `minVersion: string` (if feature-gating needed later)

---

**Spec Status:** FINAL  
**Version:** 1.0  
**Date:** 2026-03-10
