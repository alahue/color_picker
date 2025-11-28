# CLAUDE.md - AI Assistant Guide for Color Preference Picker

## Project Overview

**Color Preference Picker** is an interactive web application that uses a modified Elo rating system to discover users' implicit color preferences through progressive elimination and comparison. Users select favorites from batches of 10 colors, gradually building a ranked palette of their top colors.

- **Authors:** Austin LaHue & Frederick Gyasi
- **Inspired by:** Dragonfly Cave's Favorite Pokémon Picker, favorite-picker project
- **Algorithm:** Modified Elo Rating System with Adaptive Pruning
- **Color Space:** 200 perceptually distinct colors generated from HSL

## Architecture

```
┌─────────────────────────────────────┐
│    Application Layer                 │
│    (app-init.js)                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Feature Integration Layer         │
│    (enhanced-integration.js)         │
└─────────────────────────────────────┘
              ↓
┌──────────────────┬──────────────────┐
│   UI Layer       │   Storage Layer   │
│   (picker-ui.js) │   (palette-lib,   │
│                  │    consistency,   │
│                  │    tooltip-mgr)   │
└──────────────────┴──────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Core Algorithm Layer              │
│    (picker-core.js)                  │
└─────────────────────────────────────┘
```

## Directory Structure

```
/color_picker/
├── index.html              # Main application (587 lines)
├── testing.html            # Debug console & tests (458 lines)
├── picker-core.js          # Core Elo algorithm (474 lines)
├── picker-ui.js            # UI rendering (760 lines)
├── app-init.js             # Bootstrap & init (188 lines)
├── palette-library.js      # Palette storage (435 lines)
├── consistency-tracker.js  # Session tracking (383 lines)
├── tooltip-manager.js      # Tooltip system (246 lines)
├── enhanced-integration.js # Feature integration (438 lines)
├── picker-styles.css       # Main styles (811 lines)
└── enhanced-features.css   # Advanced styles (554 lines)
```

## Key Files

| File | Responsibility |
|------|----------------|
| `picker-core.js` | Elo rating calculations, color generation, batch selection, state management |
| `picker-ui.js` | Rendering, user interactions, accessibility features, keyboard navigation |
| `app-init.js` | Initialization, state restoration, analytics tracking |
| `palette-library.js` | Save/load/manage palettes, metadata, search/sort |
| `consistency-tracker.js` | Cross-session preference tracking, consistency scores |
| `tooltip-manager.js` | Rich tooltips with color data (hex, RGB, HSL, Elo) |
| `enhanced-integration.js` | Coordinates all features, export functions |

## Technology Stack

- **Frontend:** Vanilla JavaScript + jQuery 3.6.0
- **Styling:** Pure CSS3 with CSS Variables
- **Storage:** Browser localStorage
- **APIs:** Web Speech API, MutationObserver, Performance API

**No build system** - Files are loaded directly in browser.

## Script Loading Order

Scripts must be loaded in this order (defined in index.html):
1. jQuery 3.6.0 (CDN)
2. picker-core.js
3. picker-ui.js
4. tooltip-manager.js
5. consistency-tracker.js
6. palette-library.js
7. app-init.js
8. enhanced-integration.js

## Code Conventions

### Module Pattern (UMD)
All JavaScript modules use the Universal Module Definition pattern:
```javascript
(function (root, factory) {
    if (typeof define === 'function' && define.amd) { /* AMD */ }
    else if (typeof module === 'object' && module.exports) { /* CommonJS */ }
    else { root.ModuleName = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
    // Module code
}));
```

### Constructor Pattern
Classes use constructor functions with prototypal inheritance:
```javascript
function ClassName(options) {
    this.property = options.property;
}
ClassName.prototype.methodName = function() { ... };
```

### Naming Conventions
- **camelCase** - variables and functions
- **PascalCase** - constructors/classes
- **UPPERCASE** - constants
- **Underscore prefix** - private methods (convention)
- **data-* attributes** - for DOM data binding

### Global Objects
These are exposed on `window`:
- `window.pickerState` - EloPickerState instance
- `window.pickerUI` - PickerUI instance
- `window.consistencyTracker` - ConsistencyTracker instance
- `window.paletteLibrary` - PaletteLibrary instance
- `window.tooltipManager` - TooltipManager instance

## Key Data Structures

### Color Object
```javascript
{
  id: 'color_0',
  name: 'Color 1',
  hex: '#A1B2C3',
  hsl: { h: 210, s: 15, l: 70 },
  rgb: { r: 161, g: 178, b: 195 },
  eloRating: 1500,
  comparisons: 0,
  wins: 0,
  losses: 0
}
```

### Accessibility State
```javascript
{
  mode: 'full-color|protanopia|deuteranopia|tritanopia',
  highContrast: boolean,
  patterns: boolean,
  audioDescriptions: boolean,
  keyboardNav: boolean
}
```

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `colorPickerState` | Current session state |
| `colorPickerFeedback` | Survey responses |
| `colorPicker_paletteLibrary` | Saved palettes (max 50) |
| `colorPicker_sessionHistory` | Session history (max 10) |
| `keyboardHintShown` | UI hints flag |

## Configuration (Embedded in Code)

### picker-core.js
```javascript
{ colorCount: 200, generateColors: true, maxComparisons: 20, batchSize: 10 }
```

### palette-library.js
```javascript
{ storageKey: 'colorPicker_paletteLibrary', maxPalettes: 50, autoSave: true }
```

### consistency-tracker.js
```javascript
{ storageKey: 'colorPicker_sessionHistory', maxSessions: 10 }
```

## Development Workflow

### Running the Application
1. Open `index.html` in a modern browser
2. No build step required - direct browser loading

### Testing
- Open `testing.html` for debug console
- Use browser console for debugging (extensive console.log output)
- Global objects accessible for manual testing

### Adding New Features
1. Create new JS file with UMD pattern
2. Add to script loading in `index.html` (order matters!)
3. Initialize in `app-init.js` or `enhanced-integration.js`
4. Add styles to `enhanced-features.css`

## Accessibility Features

The application includes comprehensive accessibility support:
- **Color blindness modes:** protanopia, deuteranopia, tritanopia
- **High contrast mode** with specific color palette
- **Pattern overlays** for color differentiation
- **Audio descriptions** via Web Speech API
- **Full keyboard navigation**

## Export Formats

- **JSON** - Full palette data with metadata
- **CSS** - CSS custom properties
- **Hex codes** - Plain text list
- **Consistency reports** - JSON, text, CSV

## Important Notes

### Clemson Theme Colors
The UI uses Clemson University colors for interface elements only (not the color picker colors):
- Primary: #F56600 (Clemson Orange)
- Secondary: #522D80 (Clemson Purple)

### Algorithm Details
- Colors start at 1500 Elo rating
- After 10 comparisons, low-rated colors are pruned
- Batches ensure diverse representation across rating tiers
- Target consistency score: >80% across sessions

### Browser Requirements
- ES6+ support (const, let, arrow functions)
- CSS Grid and Flexbox
- localStorage support
- Modern browser (Chrome, Firefox, Safari, Edge)

## Common Tasks

### Modify Elo Algorithm
Edit `picker-core.js` - `updateEloRatings()` method

### Change Color Generation
Edit `picker-core.js` - `generateColorPalette()` method

### Update UI Rendering
Edit `picker-ui.js` - `renderBatch()` and related methods

### Add New Accessibility Mode
1. Add option in `picker-ui.js` accessibility object
2. Add CSS in `enhanced-features.css`
3. Add color matrix in `picker-ui.js` if needed

### Modify Storage Behavior
Edit relevant file's save/load methods with localStorage operations

## Error Handling

- Try-catch for all localStorage operations
- Graceful fallbacks for missing data
- Console error logging for debugging
- User-friendly alert messages for critical errors
