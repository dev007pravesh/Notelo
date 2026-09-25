# 📝 Notelo — Privacy-First, Offline-First Notes App

> A **Google Keep-inspired**, feature-rich notes application built with **React Native / Expo SDK 57**, designed from the ground up for speed, privacy, and zero cloud dependency.

**Package:** `com.dev007pravesh.Notelo`  
**Version:** 2.0.0 (versionCode 5)  
**Platform:** Android (iOS ready)  
**Architecture:** Expo New Architecture (Fabric + TurboModules)

---

## 🎯 Project Vision

Notelo is a world-class, privacy-centric, offline-first notes app that rivals Google Keep in UX while offering:
- **Zero data leaves the device** — all storage is local SQLite
- **WhatsApp-style backups** — export/import ZIP archives or sync to Google Drive's hidden app folder
- **Biometric security** — app-level lock + per-note locking with fingerprint/PIN
- **Blazing-fast search** — FTS5 full-text search across thousands of notes
- **Beautiful UI** — Google Keep pastel palette, masonry grid, fluid animations

---

## ⚡ Tech Stack

| Layer | Technology | Version |
|:------|:-----------|:--------|
| **Framework** | Expo SDK | 57 |
| **UI Runtime** | React Native (New Arch) | 0.86.3 |
| **React** | React 19 | 19.2.3 |
| **Routing** | Expo Router (File-based) | 57.x |
| **Database** | `expo-sqlite` + raw SQL | 57.x |
| **ORM / Schema** | `drizzle-orm` | 0.45.3 |
| **Full-Text Search** | SQLite FTS5 | Native |
| **State Management** | `zustand` v5 | 5.0.15 |
| **List Performance** | `@shopify/flash-list` (Masonry) | 2.3.2 |
| **Animations** | `react-native-reanimated` | 4.5.1 |
| **Drawing Canvas** | `react-native-svg` | 15.15.4 |
| **Audio** | `expo-audio` | 57.x |
| **Security** | `expo-local-authentication` + `expo-secure-store` + `expo-crypto` | 57.x |
| **Notifications** | `expo-notifications` | 57.x |
| **Haptics** | `expo-haptics` | 57.x |
| **File Backup** | `jszip` + `expo-file-system` + `expo-sharing` | — |
| **Quick Actions** | `expo-quick-actions` | 6.x |

---

## ✅ Features Implemented — Full Checklist

### 🛡️ Phase 0: Legacy Data Migration (Zero Data Loss)
Ensures existing Play Store users upgrading from v1.x don't lose any notes stored in AsyncStorage.

- [x] Legacy `AsyncStorage` key `addedNotes` structure audit
- [x] `AsyncStorageMigrationService` — reads, transforms, and batch-inserts legacy notes into SQLite
- [x] Migration flag in `expo-secure-store` (`has_migrated_v1_to_v2`) — runs only once
- [x] Migration test verification

### 🗄️ Phase 1: Database Foundation & Schema
- [x] `expo-sqlite` + `drizzle-orm` + WAL mode (`PRAGMA journal_mode = WAL`)
- [x] Drizzle schema: `notes`, `folders`, `checklist_items`, `labels`, `note_labels`, `attachments`
- [x] FTS5 virtual table for instant full-text search
- [x] Typed CRUD repository layer (`notesRepository`, `foldersRepository`, `labelsRepository`)
- [x] `DatabaseProvider` — ensures DB readiness before UI render

### 🔐 Phase 2: Global State & Biometric Security
- [x] **Zustand stores**: `useNotesStore` (notes, folders, filters, selection) + `useSettingsStore` (theme, viewMode, lock prefs)
- [x] Hardware biometrics (`expo-local-authentication`) — fingerprint / Face ID
- [x] Secure 4-digit PIN fallback with SHA-256 hash (`expo-crypto` + `expo-secure-store`)
- [x] `AppLockScreen` — full-screen biometric prompt + animated PIN pad
- [x] Auto-lock on 30s background via `AppState` listener
- [x] Per-note locking (`isLocked`) — hides content preview until authenticated

### 📱 Phase 3: Google Keep Feed & Masonry Grid UI
- [x] **`MasonryFlashList`** — 2-column staggered masonry grid + 1-column list toggle
- [x] 12 Google Keep pastel colors (light + dark mode variants)
- [x] `NoteCard` — dynamic height, checklist preview, image thumbnails, folder/label chips
- [x] Pinned vs Others sectioned feed with sticky headers
- [x] `KeepHeader` — pill-shaped search bar, drawer icon, grid/list toggle, settings avatar
- [x] `KeepBottomBar` — quick actions (checklist, drawing, mic, image) + elevated FAB
- [x] Multi-selection mode with haptic long-press (pin, archive, color, delete)
- [x] Empty state illustration

### ✏️ Phase 4: Note Editor & Checklists
- [x] `addNote.tsx` — distraction-free editor with auto-growing title/body inputs
- [x] **Text mode** — rich multiline body with markdown rendering
- [x] **Checklist mode** — interactive checkboxes, auto-new-item on Enter, strikethrough, collapsible completed section
- [x] 500ms debounced auto-save to SQLite (no "Save" button needed)
- [x] `ColorPaletteModal` — 12 Keep pastel colors, real-time editor background update
- [x] `ImageLightboxModal` — image attachments with pinch-to-zoom full-screen viewer
- [x] `AudioRecorderModal` + `AudioPlayerWidget` — voice memo recording + inline playback
- [x] `DrawingCanvasModal` — finger sketching with pen/eraser/color/stroke tools, PNG export
- [x] Editor header: back, folder chip, pin, reminder, archive, more menu

### 🗂️ Phase 5: Organization (Folders, Labels, Archive, Trash)
- [x] **Folder management** — create with custom icons & colors, move notes, rename, delete
- [x] **Label / tag management** — create, rename, delete, multi-tag notes via bottom sheet
- [x] `FolderDrawerModal` — navigation drawer with All Notes, Folders, Labels, Archive, Trash, Settings
- [x] Search & filter combining text query + active folder + label/color chips
- [x] `archive.tsx` — dedicated archive screen with unarchive action
- [x] `trash.tsx` — soft-delete with restore/permanent-delete, auto-purge after 30 days
- [x] `ReminderPickerModal` — "Later today", "Tomorrow", "Next week", custom date/time + `expo-notifications`

### ☁️ Phase 6: Backup Engine (WhatsApp-Style)
- [x] SQLite WAL checkpoint + ZIP packaging (`jszip`)
- [x] **Local backup** — export to `Notelo/` folder on device storage + share via `expo-sharing`
- [x] **Local restore** — import ZIP file to restore notes offline
- [x] Google Drive `appDataFolder` integration (hidden, private backup)
- [x] Settings backup screen with last backup time, size, "Back Up Now" button

### 🚀 Phase 7: Polish & Play Store Release
- [x] **Android App Shortcuts** — "New Text Note" + "New Checklist" on home icon long-press
- [x] **Haptic feedback** — checklist tap, card long-press, pin toggle, pull-to-refresh
- [x] Android 15 edge-to-edge StatusBar compliance
- [x] 60/120 FPS scroll performance audit
- [x] Full offline mode verification (Airplane Mode)
- [x] Store config: version 2.0.0, versionCode 5, `expo-doctor` 18/18 passed, `tsc --noEmit` 0 errors

---

## 📂 Project Structure

```
Notelo/
├── app.json                     # Expo configuration
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript config
├── babel.config.js              # Babel config
├── eas.json                     # EAS Build profiles
├── assets/                      # Icons, splash, fonts
│   └── fonts/                   # Custom fonts (Danymeka, Cafenty, Chamos, etc.)
├── android/                     # Native Android project (auto-generated)
└── src/
    ├── app/                     # Expo Router screens (file-based routing)
    │   ├── _layout.tsx          # Root layout — providers, splash, notifications, quick actions
    │   ├── +not-found.tsx       # 404 screen
    │   ├── addNote.tsx          # Note editor (create & edit)
    │   ├── archive.tsx          # Archived notes screen
    │   ├── trash.tsx            # Trash / soft-deleted notes screen
    │   ├── settings.tsx         # Settings, theme, security, backup controls
    │   └── (tabs)/
    │       ├── _layout.tsx      # Tab navigator layout
    │       ├── index.tsx        # Home feed (masonry grid)
    │       └── search.tsx       # Search & filter screen
    ├── components/
    │   ├── common/
    │   │   └── SafeSvgImage.tsx  # SVG rendering wrapper
    │   ├── editor/
    │   │   ├── AudioPlayerWidget.tsx      # Inline audio playback
    │   │   ├── AudioRecorderModal.tsx     # Voice memo recording
    │   │   ├── ChecklistEditor.tsx        # Interactive checklist
    │   │   ├── ColorPaletteModal.tsx      # 12 Keep pastel color picker
    │   │   ├── DrawingCanvasModal.tsx     # Finger drawing canvas
    │   │   ├── ImageLightboxModal.tsx     # Full-screen image viewer
    │   │   ├── LabelPickerModal.tsx       # Label/tag selector
    │   │   └── ReminderPickerModal.tsx    # Reminder date/time picker
    │   ├── feed/
    │   │   ├── FolderDrawerModal.tsx      # Navigation drawer
    │   │   ├── KeepBottomBar.tsx          # Bottom quick-capture bar
    │   │   ├── KeepHeader.tsx             # Top search capsule header
    │   │   ├── NoteCard.tsx              # Masonry note card
    │   │   └── SelectionActionBar.tsx     # Multi-select action bar
    │   └── security/
    │       ├── AppLockScreen.tsx          # Biometric/PIN lock screen
    │       └── SecurityWrapper.tsx        # App-level security gate
    ├── constants/
    │   ├── colors.ts                     # Theme color tokens
    │   └── keepColors.ts                 # Google Keep pastel palette
    ├── contexts/
    │   └── ThemeContext.tsx               # Light/Dark theme provider
    ├── db/
    │   ├── db.ts                         # SQLite connection + WAL init
    │   ├── schema.ts                     # Drizzle ORM schema definitions
    │   ├── DatabaseProvider.tsx           # DB init + migration provider
    │   ├── migration/
    │   │   └── AsyncStorageMigrationService.ts  # v1→v2 data migration
    │   └── repositories/
    │       ├── notesRepository.ts        # Notes CRUD + FTS5 search
    │       ├── foldersRepository.ts      # Folders CRUD
    │       └── labelsRepository.ts       # Labels CRUD
    ├── services/
    │   ├── backupService.ts              # Backup/restore (ZIP + Drive)
    │   └── reminderNotificationService.ts # Local notification scheduler
    ├── store/
    │   ├── useNotesStore.ts              # Zustand notes state
    │   └── useSettingsStore.ts           # Zustand settings state
    └── utils/                            # Utility helpers
```

---

## 🚀 Getting Started — Run & Build Guide

### Prerequisites

| Tool | Required Version |
|:-----|:-----------------|
| **Node.js** | ≥ 18.x |
| **npm** | ≥ 9.x |
| **Expo CLI** | Installed globally or via `npx` |
| **Android Studio** | Latest with SDK 34+ |
| **JDK** | 17 |
| **ADB** | Available in PATH |
| **Physical Device** | USB debugging enabled |

### 1. Clone & Install

```bash
git clone https://github.com/dev007pravesh/Notelo.git
cd Notelo
npm install
```

### 2. Start the Metro Dev Server

```bash
npx expo start --dev-client
```

This starts Metro bundler on port **8081** and shows a QR code for the dev client.

### 3. Build & Run on Android Device (Development Build)

```bash
# First-time: build the native Android app and install on connected device
npx expo run:android --device

# This will:
# 1. Compile the native Android project (Gradle build)
# 2. Install the APK on your connected device
# 3. Start Metro bundler automatically
# 4. Launch the app on the device
```

### 4. Subsequent Launches (After First Build)

If the app is already installed on the device and you just need to start Metro:

```bash
# Step 1: Start Metro
npx expo start --dev-client --port 8081

# Step 2: Ensure ADB reverse tunnel is active
adb reverse tcp:8081 tcp:8081

# Step 3: Open the app on your phone
# The Expo Dev Launcher will auto-discover Metro and load the JS bundle
```

### 5. Production Build (EAS)

```bash
# Build for Play Store
eas build --platform android --profile production

# Or build locally
npx expo run:android --variant release
```

---

## 🐛 Debugging Guide — Common Issues & Fixes

### Issue 1: White Screen After Splash Screen

**Symptoms:** App opens, splash screen shows, then stuck on a blank white screen.

**Root Cause:** The Expo Dev Launcher (`expo-dev-client`) cannot discover or connect to the Metro bundler server. This happens when:
- Metro process died or is stuck on a zombie port
- Network/Wi-Fi isn't reachable between Mac and phone
- `adb reverse` tunnel isn't set up

**Fix Steps:**

```bash
# Step 1: Check if Metro is running
lsof -i :8081

# Step 2: Kill any zombie Metro/Node processes
kill -9 <PID_from_step_1>
# or kill all node processes on that port:
pkill -f "expo start"

# Step 3: Start a fresh Metro server
npx expo start --dev-client --port 8081

# Step 4: Set up ADB reverse tunnel (for USB-connected devices)
adb reverse tcp:8081 tcp:8081

# Step 5: Force-stop and relaunch the app
adb shell am force-stop com.dev007pravesh.Notelo

# Step 6: If auto-discovery fails, manually deep-link to Metro:
adb shell am start -a android.intent.action.VIEW \
  -d "exp+notelo://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" \
  com.dev007pravesh.Notelo
```

### Issue 2: Port 8081 Already in Use

```bash
# Find what's using port 8081
lsof -i :8081

# Kill the process
kill -9 <PID>

# Restart Metro
npx expo start --dev-client --port 8081
```

### Issue 3: App Not Connecting to Metro Over Wi-Fi

If your phone and Mac aren't on the same network (or the network blocks local traffic):

```bash
# Use USB + ADB reverse tunnel instead of Wi-Fi
adb reverse tcp:8081 tcp:8081

# Verify the reverse is active
adb reverse --list
# Should show: UsbFfs tcp:8081 tcp:8081
```

### Issue 4: Dev Launcher Shows But Doesn't Load Bundle

```bash
# Clear the app data and retry
adb shell pm clear com.dev007pravesh.Notelo

# Rebuild the native app
npx expo run:android --device
```

### Issue 5: Logcat Debugging

```bash
# View all app logs in real-time
adb logcat --pid=$(adb shell pidof com.dev007pravesh.Notelo)

# Filter for React Native / JS errors only
adb logcat -d | grep -iE "(ReactNative|expo|bundle|Hermes|error|fatal|Exception)"

# Filter for Metro connection issues
adb logcat -d | grep -iE "(DevLauncher|DevServer|metro|localhost|startSurface)"
```

### Issue 6: Build Errors After Dependency Changes

```bash
# Clean everything and rebuild
cd android && ./gradlew clean && cd ..
rm -rf node_modules
npm install
npx expo run:android --device
```

### Issue 7: Backup Import Fails (Java IO Exception)

If importing a backup ZIP file fails with a Java I/O exception:
- Ensure the backup file is a valid ZIP created by Notelo
- Check that the device has sufficient storage space
- The restore uses an atomic transaction — if it fails, no data is lost

---

## 📱 Data Architecture

### SQLite Schema (6 Tables)

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│   folders     │     │      notes       │     │ checklist_items│
│──────────────│     │──────────────────│     │────────────────│
│ id (PK)      │◄────│ folder_id (FK)   │     │ id (PK)        │
│ name         │     │ id (PK)          │────►│ note_id (FK)   │
│ color        │     │ title            │     │ text           │
│ icon         │     │ content          │     │ is_completed   │
│ order_index  │     │ note_type        │     │ order_index    │
│ created_at   │     │ color            │     │ created_at     │
└──────────────┘     │ is_pinned        │     └────────────────┘
                     │ is_archived      │
                     │ is_deleted       │     ┌────────────────┐
                     │ deleted_at       │     │  attachments   │
                     │ is_locked        │     │────────────────│
                     │ reminder_at      │     │ id (PK)        │
                     │ created_at       │────►│ note_id (FK)   │
                     │ updated_at       │     │ local_uri      │
                     └──────────────────┘     │ mime_type      │
                            │                 │ file_size      │
                            │                 │ created_at     │
                     ┌──────┴───────┐         └────────────────┘
                     │  note_labels │
                     │──────────────│
                     │ note_id (FK) │
                     │ label_id (FK)│         ┌────────────────┐
                     └──────┬───────┘         │    labels      │
                            │                 │────────────────│
                            └────────────────►│ id (PK)        │
                                              │ name           │
                                              │ created_at     │
                                              └────────────────┘
```

### FTS5 Full-Text Search

A virtual table `notes_fts` indexes `title` and `content` columns for instant keyword search with BM25 ranking.

---

## 🔒 Security Model

```
App Launch
    │
    ├── Is App Lock Enabled?
    │       ├── YES → Show AppLockScreen
    │       │           ├── Biometric prompt (fingerprint/face)
    │       │           └── 4-digit PIN fallback (SHA-256 hashed)
    │       └── NO → Continue to app
    │
    ├── App goes to background > 30 seconds?
    │       └── YES → Re-lock and show AppLockScreen on return
    │
    └── User taps a locked note?
            └── Biometric authentication required before viewing
```

---

## 📦 Backup System (WhatsApp Model)

```
Export Backup                         Import Backup
────────────                         ──────────────
1. PRAGMA wal_checkpoint(FULL)       1. Pick .zip file
2. Read notelo.db                    2. Extract to temp dir
3. Read attachments/                 3. Open temp SQLite DB
4. ZIP → notelo_backup_<ts>.zip      4. Read all folders + notes
5. Save to Notelo/ folder           5. Insert into active DB
   or share via expo-sharing         6. Copy attachments
                                     7. Refresh UI state
```

---

## 📜 License

This project is private and proprietary.  
**© 2025–2026 dev007pravesh. All rights reserved.**
