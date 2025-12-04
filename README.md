# Color Preference Picker 
## Discover Your Color Preferences Through Intelligent Comparison

**An interactive web application that uses modified Elo rating to help you discover your true color preferences**

---

## 🎨 What Is This?

Color Preference Picker helps you discover which colors you genuinely prefer by presenting them in carefully selected batches. Through simple comparisons, the system builds an intelligent understanding of your preferences and ranks colors accordingly.

### How It Works
1. **View** - See 10 carefully selected colors
2. **Select** - Click on the colors you like
3. **Compare** - System updates rankings using Elo rating
4. **Repeat** - Continue for 20 rounds
5. **Discover** - See your top 10 favorite colors!

### Why It's Effective
- **No cognitive overload** - Only 10 colors at a time
- **Intelligent ranking** - Modified Elo rating (like chess rankings)
- **Perceptual accuracy** - 200 distinct colors across the spectrum
- **Bias reduction** - Adaptive algorithm prevents pattern gaming

---

## ✨ Key Features

### Core Functionality
- **200 Perceptually Distinct Colors** - Maximum visual variety
- **Smart Batch Selection** - Ensures diverse, balanced comparisons
- **Elo Rating System** - Proves chess ranking math to colors
- **20 Quick Comparisons** - Complete session in 3-5 minutes
- **Real-Time Rankings** - See your top colors as you go

### Undo/Redo System
- **50-State History** - Track your entire session
- **Full Undo** - Changed your mind? Go back!
- **Full Redo** - Want that choice back? Redo it!
- **Keyboard Shortcuts** - Ctrl+Z to undo, Ctrl+Y to redo
- **Smart Buttons** - Automatically enable/disable based on history

### Accessibility Features
- **3 Colorblind Modes**
  - Protanopia (red-blind) simulation
  - Deuteranopia (green-blind) simulation  
  - Tritanopia (blue-blind) simulation
- **10 Pattern Overlays** - Identify colors without relying on color alone
- **High Contrast Mode** - Enhanced visibility
- **Audio Descriptions** - Spoken color information
- **Full Keyboard Navigation** - Mouse optional
- **Screen Reader Support** - WCAG 2.1 AA compliant

### Palette Management
- **Save Palettes** - Keep up to 50 favorite combinations
- **Organize** - Name, describe, and tag your palettes
- **Search** - Find palettes by name, description, or tags
- **Load Anytime** - Resume previous selections
- **Mark Favorites** - Star your best palettes

### Export Options
- **JSON** - Complete data with all metadata
- **CSS** - Ready-to-use CSS custom properties
- **Hex Codes** - Simple comma-separated list
- **CSV** - Open in Excel or Google Sheets

### Analytics
- **Consistency Tracking** - How stable are your preferences?
- **Decision Metrics** - Average decision time, picks vs passes
- **Session History** - Review past sessions
- **Spearman Correlation** - Statistical consistency score

---

## 🚀 Getting Started

### Super Simple Start
1. Open `index.html` in your web browser
2. Start clicking colors you like!
3. That's it - no installation, no signup, no complexity

### Local Server (Recommended for Best Performance)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Then visit: http://localhost:8000
```

---

## 📖 How to Use

### Basic Workflow

#### Step 1: View Your First Batch
- 10 colors appear automatically
- All colors start with equal ratings (1500 Elo)
- Colors are distributed across the spectrum

#### Step 2: Select Your Favorites
- Click on colors you like (they get a border)
- Click again to deselect
- Select as many or as few as you want
- No pressure - you can always undo!

#### Step 3: Make Your Choice
- Click **"Pick Selected"** if you chose favorites
- Click **"Pass"** if you're indifferent to all of them
- The system updates all color ratings

#### Step 4: Continue Comparing
- A new batch appears with updated selections
- Colors you liked appear more often
- Progress bar shows your advancement
- 20 comparisons total per session

#### Step 5: View Your Results
- After 20 rounds, see your top 10 colors
- Colors are ranked by Elo rating
- Save as a palette for future reference
- Export in your preferred format

### Using Undo/Redo

Made a mistake? No problem!

**To Undo:**
- Click the **Undo** button, or
- Press **Ctrl+Z** (Windows/Linux) or **Cmd+Z** (Mac)
- Goes back one action at a time
- Can undo up to 50 actions

**To Redo:**
- Click the **Redo** button, or
- Press **Ctrl+Y** (Windows/Linux) or **Cmd+Y** (Mac)
- Moves forward through undone actions
- Available after you've used undo

**Tips:**
- Buttons are disabled when unavailable (grayed out)
- Making a new choice clears redo history
- History persists for the entire session

### Accessibility Settings

#### For Colorblind Users
1. Click **"Accessibility Settings"**
2. Select your vision mode:
   - Protanopia (can't see reds well)
   - Deuteranopia (can't see greens well)
   - Tritanopia (can't see blues well)
3. Colors transform to show how they appear to you
4. Consider enabling pattern overlays too

#### Pattern Overlays
1. Check **"Enable Patterns"** in settings
2. Each color gets a unique pattern
3. 10 different patterns available
4. Identify colors by pattern, not just color
5. Great for all users, essential for colorblind users

#### High Contrast Mode
1. Check **"High Contrast"** in settings
2. All interface elements get enhanced contrast
3. Borders become more prominent
4. Text becomes more legible
5. Reduces eye strain

#### Audio Descriptions
1. Check **"Audio Descriptions"** in settings
2. System speaks color information:
   - Hex codes (like "#A1B2C3")
   - RGB values
   - HSL values  
   - Elo ratings
3. Action confirmations spoken aloud
4. Requires browser permission (grants once)

### Saving Palettes

#### To Save a Palette:
1. Complete a session (20 comparisons)
2. Click **"Save Palette"** button
3. Enter a name (required)
4. Add description (optional)
5. Add tags for searching (optional)
6. Click **"Save"**

#### To Load a Palette:
1. Click **"Palette Library"**
2. Browse your saved palettes
3. Click on a palette to view
4. Click **"Load"** to restore those colors
5. Or click **"Export"** for one of 4 formats

#### To Organize Palettes:
- **Search:** Type in search box to filter
- **Sort:** By date, name, or favorites
- **Favorite:** Click star icon to mark important ones
- **Delete:** Click trash icon to remove

### Exporting Your Colors

#### JSON Export
- Complete data package
- Includes all metadata
- Perfect for developers
- Machine-readable format

**Example:**
```json
{
  "palette": {
    "name": "Ocean Blues",
    "colors": [
      {"hex": "#1E3A5F", "rating": 1650},
      {"hex": "#2E5090", "rating": 1625}
    ]
  }
}
```

#### CSS Export
- Ready-to-use in websites
- CSS custom properties (variables)
- Includes utility classes
- Copy-paste into your stylesheet

**Example:**
```css
:root {
  --color-1: #1E3A5F;
  --color-2: #2E5090;
}
.color-1 { background-color: var(--color-1); }
```

#### Hex Export
- Simple comma-separated list
- Perfect for design tools
- Copy into Figma, Sketch, etc.
- Easy to share

**Example:**
```
#1E3A5F, #2E5090, #3F6FC1, #5080D2
```

#### CSV Export
- Open in Excel or Google Sheets
- Includes rank, hex, RGB, HSL, rating
- Great for analysis
- Spreadsheet-friendly

**Example:**
```csv
Rank,Hex,RGB,HSL,Rating
1,#1E3A5F,"rgb(30,58,95)","hsl(210,52%,25%)",1650
```

---

## ⌨️ Keyboard Shortcuts

### Essential Shortcuts
| Key | Action | When Available |
|-----|--------|----------------|
| **Enter** | Pick selected colors | Any time |
| **Space** | Pass (skip batch) | Any time |
| **Ctrl+Z** | Undo last action | After any action |
| **Ctrl+Y** | Redo action | After undo |

### Quick Selection
| Key | Action |
|-----|--------|
| **1** | Toggle first color |
| **2** | Toggle second color |
| **3** | Toggle third color |
| ... | ... |
| **9** | Toggle ninth color |

### Navigation
| Key | Action |
|-----|--------|
| **Tab** | Move to next element |
| **Shift+Tab** | Move to previous element |
| **Esc** | Clear all selections |

### Help & Search
| Key | Action |
|-----|--------|
| **?** | Show keyboard shortcuts help |
| **/** | Focus search (in palette library) |

---

## 📊 Understanding the System

### Elo Rating Explained
The system uses a modified version of the Elo rating system (invented for chess):

- **Start:** All colors begin at 1500 rating
- **Win:** Chosen colors increase, unchosen decrease
- **Volatility:** Early choices matter more (ratings change faster)
- **Stability:** Later choices fine-tune (smaller changes)
- **Result:** Top-rated colors are your genuine favorites

### Batch Selection Logic
Colors aren't random - the system is smart:

- **Diverse:** Colors from different rating tiers
- **Fair:** High-rated colors appear more, but not exclusively
- **Spread:** Full spectrum represented in each batch
- **Recency:** Recently shown colors are temporarily excluded

### Consistency Score
After multiple sessions, consistency is measured:

- **Score:** -1.0 to +1.0 (Spearman's rank correlation)
- **Target:** 0.80 or higher (80% consistency)
- **Meaning:** How similar are your preferences across sessions?
- **Interpretation:**
  - 1.0 = Perfect consistency
  - 0.8+ = Very consistent
  - 0.5-0.8 = Moderately consistent
  - <0.5 = Variable preferences

---

## 🎨 Example Use Cases

### 1. Personal Website
Find your brand colors:
1. Complete 2-3 sessions for consistency
2. Export top 5 as CSS
3. Use as primary, secondary, accent colors
4. Save palette for future reference

### 2. Design Projects
Build color schemes:
1. Set context (warm/cool, bright/muted)
2. Complete session with that mindset
3. Export top 10 as hex codes
4. Import into Figma/Sketch/Adobe XD

### 3. Data Visualization
Choose distinct colors:
1. Enable pattern overlays
2. Test in colorblind modes
3. Export as CSV for charting libraries
4. Verify sufficient contrast

### 4. Brand Identity
Discover your aesthetic:
1. Multiple sessions over several days
2. Check consistency scores
3. Export most consistent colors
4. Use as brand palette foundation

---

## 📝 Version History

### v4.0.0 Ultimate Edition (Current)
- ✅ Full undo/redo implementation (50 states)
- ✅ Complete accessibility features
- ✅ All V3 features included
- ✅ Improved architecture
- ✅ Better performance
- ✅ Enhanced documentation

### v3.0.0 (Previous)
- Initial modular implementation
- Elo rating algorithm
- Basic accessibility features
- Palette management
- localStorage persistence

---

## 🤝 Credits & License

### Authors
- **Austin LaHue** - Core implementation
- **Frederick Gyasi** - UI/UX, accessibility features

### Institution
Clemson University

### Inspiration
- Dragonfly Cave's Favorite Pokémon Picker (https://www.dragonflycave.com/favorite.html)
- Elo Rating System (Arpad Elo, 1960)

### License
MIT License - Free to use, modify, and distribute

---

## 🎉 Start Discovering Your Colors!

Ready to find your true color preferences?

1. Open `index.html`
2. Start clicking colors
3. Complete 20 comparisons
4. See your personalized palette!

**It's that simple. Enjoy!** 🎨

---

**Color Preference Picker v4.0 Ultimate Edition**  
December 3, 2025

*Discover your color preferences through intelligent comparison*
