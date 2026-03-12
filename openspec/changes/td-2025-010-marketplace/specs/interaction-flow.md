# Interaction Flow Specification

---

## Flow 1: Switch to Marketplace Tab

**User Action:** Clicks "🌐 广场" tab

**System Response:**

1. `App.switchTab('marketplace')`
2. `state.currentPage` set to `'marketplace'`
3. Tab button state updates (active class)
4. `renderMarketplace()` called
5. `getFilteredMarketplaceCharacters()` computes list
6. Grid renders with:
   - Official characters (badge "🏛️ 官方")
   - User characters (badge "👤 我的")
   - No edit/delete buttons
   - Source filter buttons visible (全部/官方/我的)

---

## Flow 2: Filter Marketplace by Source

**User Action:** Clicks "官方" in source filter

**System Response:**

1. `state.filters.marketplace = 'official'`
2. Filter button active state updates
3. `renderMarketplace()` re-runs
4. `getFilteredMarketplaceCharacters()` filters `allCharacters` to only `isOfficial === true`
5. Grid shows only official characters

**Repeat:** Same for `"mine"` filter.

---

## Flow 3: Search in Marketplace

**User Action:** Types in search input (debounced 300ms)

**System Response:**

1. `state.filters.search = query`
2. `renderMarketplace()` re-runs
3. `getFilteredMarketplaceCharacters()` applies name filter to current source filter set
4. Grid updates

---

## Flow 4: Tag Filtering in Marketplace

**User Action:** Clicks a personality tag (e.g., "温柔")

**System Response:**

1. Toggle `tag` in `state.filters.tags`
2. Tag button active state toggles
3. `renderMarketplace()` re-runs
4. Characters shown must have **any** selected tag
5. Grid updates

---

## Flow 5: Open Chat from Marketplace

**User Action:** Clicks any character card

**System Response:**

1. `App.openChat(characterId)` invoked
2. `Storage.getCharacter(characterId)` attempts lookup:
   - First in user characters (original behavior)
   - If not found, fallback to `window.OFFICIAL_CHARACTERS`
3. If character found:
   - Set `state.currentCharacter`
   - Update chat header (avatar + name)
   - Load chat history (for user chars: from localStorage; for official: empty `[]`)
   - Render chat page (id: `page-chat`)
   - Focus message input
4. If not found (error):
   - Show toast: "角色不存在"

**Note:** Chat history is **not** shared between official and user versions of the same-named character (different `id`).

---

## Flow 6: Send Message to Official Character

**User Action:** Types message and clicks Send

**System Response:**

1. Check API config (unchanged)
2. Add user message to chat history (stored in localStorage under `characterId`)
3. Render user message immediately
4. Call `API.streamChat(character, messages, ...)` with:
   - `character` = official character object (from `window.OFFICIAL_CHARACTERS`)
   - `messages` = array of chat history
5. Stream response, update UI in real-time
6. On complete: save full message history to localStorage under `characterId`
7. Enable input again

---

## Flow 7: Return to Home from Chat

**User Action:** Clicks "← 返回" button

**System Response:**

1. `App.showPage('home')` called
2. Home page displayed with current tab (last visited: 'home' or 'marketplace')
3. If last tab was 'home', show user character list (unchanged)
4. If last tab was 'marketplace', show marketplace (unchanged)

**Important:** `state.currentPage` persists when entering chat; return restores previous tab, not always 'home'.

---

## Flow 8: Edit from Home (User Character Only)

**User Action:** Clicks "编辑" button on a user character card (home tab)

**System Response:**

1. `App.showCreatePage(characterId)` called
2. Form populated with existing data
3. Title changes to "编辑角色"
4. User edits + clicks "保存" → `saveCharacter()` updates via `Storage.updateCharacter()`
5. Home list refreshed
6. Toast: "角色已更新"

**Blocked:** Edit button not present for official characters or in marketplace tab.

---

## Flow 9: Delete from Home (User Character Only)

**User Action:** Clicks "删除", confirms

**System Response:**

1. `Storage.deleteCharacter(id)` removes from localStorage and chat history
2. Home list re-rendered
3. Toast: "角色已删除"

**Blocked:** Delete button not present for official characters or in marketplace tab.

---

## Error Flows

### Official Characters JSON Fails to Load

- On app init: console error logged, `window.OFFICIAL_CHARACTERS = []`
- Marketplace shows empty (only user characters, if any)
- No crash, no user-visible error (silent fallback)
- Developer can check console

---

### Character Not Found (Race Condition)

If character deleted after chat opened but before send:

- `Storage.getCharacter(id)` returns `null` in chat
- System shows toast "角色不存在"
- User is returned to home page

---

### Invalid Source Filter State

If `state.filters.marketplace` set to unknown value:

- Treated as `'all'`
- Grid shows all characters
- No crash

---

## Edge Cases

1. **Zero official characters:** Marketplace still works (shows empty or only user chars)
2. **Zero user characters:** Marketplace shows only official characters
3. **All characters filtered away:** Empty state shown
4. **User character also named like an official:** Distinct by `id`, both appear (can coexist)
5. **Changing tabs preserves filters:** Filter states (search, tags, source) are preserved per-tab or globally as designed

---

**Spec Status:** FINAL  
**Version:** 1.0  
**Date:** 2026-03-10
