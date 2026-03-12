# Proposal: Marketplace Feature for Tavern Chat

## Problem

Current "My Characters" page only shows user-created characters. There is no way to discover pre-built AI characters, leading to a cold start problem for new users.

## Solution

Introduce a **Marketplace** tab alongside "My Characters" that displays:
- 10 official curated virtual characters
- User's own characters (marked as "Mine")
- Unified search + tag filtering

Users can instantly chat with any character without creation friction.

## Key Decisions

### 1. Data Scope
- **Official characters**: 10 built-in, read-only, distributed with the app
- **User characters**: From localStorage, mixed in the same list
- **No backend**: Purely client-side, no multi-user sharing

### 2. Navigation
- Home page becomes tabbed interface: `[🏠 My] [🌐 Marketplace]`
- Single page, two tabs, share UI components
- Users can toggle between viewing only their characters vs. all characters

### 3. Permissions
- **Marketplace tab**: View-only, no edit/delete for any characters
- **My Characters tab**: Full edit/delete for user-created ones (as before)
- Official characters are **never** editable
- Optional "Clone to Mine" feature not included in MVP

### 4. Character Identity
- Official: `source: 'official'`, `isOfficial: true`, `createdBy: null`
- User: `source: 'user'`, `isOfficial: false`, `createdBy: <userId>` (optional)
- Visual badges: "官方" (🏛️) for official, "我的" (👤) for user's own

### 5. Search & Filters
- Unified search applies across both official and user characters
- Tag filters work identically in both tabs
- No extra complexity for cross-data-source filtering

### 6. Official Character Data
- Initial release: 10 characters with diverse personalities, genders, backstories
- Stored in `data/official-characters.json`
- Read at app init, merged with user data on demand

## Scope

### In Scope
- Tab navigation component
- Marketplace character grid (badge + click to chat)
- Official character data (10 characters)
- Storage layer changes (add `getAllCharacters()`, `getOfficialCharacters()`)

### Out of Scope (Future)
- Clone/Copy official character to user list
- Rate/comment system
- Community marketplace (server-backed)
- Character sharing via URL
- Downloadable character packs

## Benefits

- New users have instant content to explore (no barrier to entry)
- Increased engagement (more characters to chat with)
- Clean separation between curated and custom content
- Easy to extend (add more official characters later)

## Affected Components

- `index.html` - Add tab nav + marketplace page section
- `css/style.css` - Badge styles, tab layout
- `js/storage.js` - Add `getAllCharacters()` and `getOfficialCharacters()`
- `js/app.js` - Tab state, marketplace rendering, filter logic
- `js/utils.js` - Badge rendering helper
- `data/official-characters.json` - New data file

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Official characters need frequent updates | Keep them in a separate JSON file, easy to edit without touching code |
| Performance with many user characters | Use virtual scrolling if needed (current size is tiny) |
| Confusion over editable vs. read-only | Clear visual distinction + tooltips; disable edit actions in marketplace |

---

## Next Steps

1. Design official character data (10 profiles)
2. Implement storage layer changes
3. Implement UI components
4. End-to-end testing
5. Polish (animations, empty states)

---

**Proposal Status:** DRAFT  
**Author:** Orchestrator (huayu)  
**Date:** 2026-03-10
