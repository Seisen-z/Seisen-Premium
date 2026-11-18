# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-10-16

### Fixed

- Library stays above game interfaces.

- Trackstat image caching and upload limits.

- Trackstat stops live presence when the library unloads.

### Added

- Auto Reconnect in Performance / Server Hop.

## [1.1.4] - 2026-01-22

### Added

- **Built-in Settings**: Added optional "Settings" tab automatically generated via `ConfigSettings = true` in `CreateWindow`. Includes:
  - **Player Settings**: WalkSpeed, JumpPower, Fly, Anti-AFK, and FPS Boost toggles.
  - **UI Settings**: Auto Hide UI toggle.

### Fixed

- **Dropdown**: Fixed issue where open dropdowns remained visible when the UI was hidden.
- **Icons**: Fixed syntax error in Lucide icon library loader that prevented icons from loading.
- **Icons**: Improved `Library:GetIcon` to automatically support numeric asset IDs.
- **Watermark**: Fixed background transparency and made the title dynamic based on window name.

### Changed

- **API**: Added `Library:Toggle(visible)` method for central visibility management.
- **API**: Reordered `AddTab` arguments to `(name, icon, subtitle)` for a more intuitive developer experience.
- **Sections**: Added support for icons in Section titles (`AddLeftSection(name, icon)`).

## [1.1.3] - 2026-01-21

### Fixed

- **Toggle**: Added `Type` property to toggle objects for SaveManager compatibility
- **Slider**: Fixed SaveManager parser to properly convert string values to numbers when loading
- **Input**: Fixed SaveManager parser to remove flawed value comparison check
- **SaveManager**: Removed `object.Value ~= data.value` comparison from Toggle and Slider parsers that prevented values from loading
- **SaveManager**: All UI elements now consistently call SetValue without comparison checks

## [1.1.2] - 2026-01-21

### Fixed

- **Dropdown**: Fixed save/load functionality by adding `Multi` and `Type` properties to dropdown objects
- **Dropdown**: Added value validation in `SetValue` to ensure loaded values exist in current options list
- **Dropdown**: Single-select dropdowns now fall back to first option if loaded value is invalid
- **Dropdown**: Multi-select dropdowns now filter out invalid values when loading
- **SaveManager**: Removed flawed value comparison check that prevented dropdown values from loading
- **SaveManager**: Added `multi` property to saved dropdown data for proper restoration

## [1.1.1] - 2026-01-21

### Fixed

- **SaveManager**: Config list now automatically refreshes upon creation, deletion, or overwriting of configs.
- **Dropdown**: Fixed `SetValue` logic for Multi-Select dropdowns to correctly accept table values, ensuring saved configurations load properly.

## [1.1.0] - 2026-01-19

### Added

- **Mobile Support**: Full responsive design for mobile devices.
  - Dynamic window scaling based on screen width.
  - Auto-scaling floating widget (Watermark).
  - Touch-specific input handling.
- **Size Footer**: Live dimension tracker at the bottom of the UI.

### Changed

- **PC Default Size**: Updated to 680x560.
- **Mobile Default Size**: Updated to 670x350.
- **Resize Logic**: Completely rewritten to support Touch inputs and fix "snapping" bugs.
- **Toggle**: Adjusted padding to prevent text truncation.
- **Dropdown**: Boosted Z-Index visibility to fix layering issues.

### Added

- Changelog to track project changes

## [1.0.1] - 2026-01-19

### Changed

- **Dropdown**: Added Multi-Select support (`Multi = true`).
- **Dropdown**: Fixed Z-Index layering issues to ensure dropdowns appear above other elements.

## [1.0.0] - 2026-01-18

### Added

- Modern UI library for Roblox with dark theme aesthetic
- Window management system with draggable windows
- Sidebar navigation with tab support
- Lucide Icons integration for consistent iconography
- Core UI components:
  - Toggle switches with keybind support
  - Sliders with customizable ranges and increments
  - Dropdowns with search functionality
  - Buttons with double-click and confirm options
  - Labels and text elements
  - Input fields (TextBox)
  - Color pickers
  - Tab boxes for organized content
- Theme system with live color updates
- Save/Load manager for persistent settings
- Theme manager for custom color schemes
- Tooltip system with hover delays
- Common properties support (Disabled, Visible, Risky, Tooltip)
- Template and Debug template files for quick setup
- Comprehensive documentation website

### Features

- Smooth animations and transitions using TweenService
- Click-away dropdown closing
- Global toggle keybind support
- Registry system for dynamic theme updates
- Custom icon support alongside Lucide icons
- Responsive UI scaling
- Professional dark theme with accent colors

---

## How to Update

Add changes under `[Unreleased]` using: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**

When releasing: Change `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD` and create a new `[Unreleased]` section above it.
