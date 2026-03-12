# Proposal: Theme Switcher

## Intent
Add dark/light theme toggle to improve user experience, especially at night.

## Scope
- CSS variables for color scheme
- Theme toggle button in top-right corner
- LocalStorage persistence
- No backend changes

## Out of Scope
- System preference detection (optional future)
- Multiple color themes (only dark/light)
- Per-character theme (global only)

## Approach
1. Define CSS custom properties for colors
2. Create `[data-theme="dark"]` overrides
3. Add button to DOM, bind click handler
4. Initialize theme from LocalStorage on page load

---

*This is a simple, low-risk feature. Estimated effort: 20-30 minutes.*