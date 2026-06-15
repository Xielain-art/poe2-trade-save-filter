# POE2 - Save Trade Filter (Fork)

This is a fork of the original [poe2-trade-save-filter](https://github.com/LorenzoDv/poe2-trade-save-filter) by LorenzoDv, maintained and improved by **Xielain-art**.

This extension adds a **Save Filter** button directly to the Path of Exile 2 trade site search controls. Once you perform a search, you can click this button to save your search configuration for quick loading later.

---

## 🌟 What's New in This Fork (v2.0+)

I have significantly upgraded the extension, adding several core usability and styling features:

### 1. 📂 Folder & Grouping Support
- Organize your saved filters into collapsible accordion **folders (groups)**.
- Create new folders directly in the extension popup using the `+ Group` button.
- Move filters between folders easily via dropdown selects in edit mode.
- Deleting a folder safely moves its filters to the **"Ungrouped"** category rather than deleting them.

### 2. ⭐ Favorites System
- Star your most important or frequently used filters.
- Starred items are automatically pinned to a special **"★ Favorites"** folder at the very top of your list.

### 3. 🔍 Real-Time Search Bar
- Instantly filter your saved searches by name/description or URL as you type.
- Empty folders are hidden dynamically while searching to keep the view clean.

### 4. 🔲 List vs. Tile (Grid) View Switcher
- Toggle between a compact **List View** and a modern **Tile (Grid) View** with larger clickable cards.
- Layout height is constrained with a scrollbar to prevent the popup window from overflowing Chrome's height limit.

### 5. 🌍 8-Language Support & Custom Flags Dropdown
- Full translation support for all 8 official languages of the PoE2 trade website:
  - English (EN)
  - Russian (RU)
  - French (FR)
  - Portuguese (PT)
  - German (DE)
  - Spanish (ES)
  - Thai (TH)
  - Japanese (JA)
- Includes a custom select dropdown menu featuring flag images from `flagcdn.com` (fully compatible with Windows, where emoji country flags do not render natively in Chrome).
- Auto-detects your browser language on first load.

### 6. 🛠️ Custom Injected Save Modal
- Replaced the browser's basic `prompt()` dialog with a custom, game-themed modal injected directly on the trade website.
- Enter the filter description and select/create a folder on the fly during saving.

### 7. 🚀 Bug Fixes & Compatibility Updates
- **Domain Match Fixes**: Matched `https://*.pathofexile.com/trade2/search/**` to ensure the script runs correctly on both `www.` and non-www main domains, as well as language subdomains.
- **League Compatibility**: The save button now works across all leagues by matching any league pattern in the URL.
- **Performance**: Removed duplicated click listeners and optimized DOM mutation observing.
- Removed donation buttons and cleaned up layout spacing.

---

## 🔧 How to Install and Test Locally

1. Download or clone this repository.
2. Open Google Chrome and go to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left corner) and select this project's folder.
5. Pin the extension to your Chrome toolbar.
6. Open the PoE2 Trade page, perform a search, and enjoy!

---

## 🎮 Credits
- **Original Developer**: Shinry / LorenzoDv (Original repository: [poe2-trade-save-filter](https://github.com/LorenzoDv/poe2-trade-save-filter)).
- **Fork Contributor**: Xielain-art (Fork repository: [poe2-trade-save-filter](https://github.com/Xielain-art/poe2-trade-save-filter)).

This tool was developed by community members and is not affiliated with Grinding Gear Games.