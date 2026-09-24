# Master Plan: Production-Ready, Privacy-Focused, Offline-First Notes App (Google Keep Alternative)

> **Target Platform:** React Native / Expo (SDK 53, React 19, New Architecture)  
> **Target Release:** Seamless Google Play Store Update for existing **Notelo** (`com.dev007pravesh.Notelo`)  
> **Architecture:** Offline-First, Zero-Server, Local-First SQLite + Drizzle ORM + Cloud Backup

---

## 1. Executive Summary & Core Objectives

This master plan lays out the complete architectural blueprint and phased implementation guide for transforming **Notelo** into a world-class, privacy-centric, offline-first notes app inspired by **Google Keep**, with superior speed, modern aesthetics, biometric security, and zero cloud dependency.

### Core Pillars
1. **Zero Data Loss on Play Store Update**: Automatic, idempotent migration from the legacy `AsyncStorage` (`addedNotes`) to the new SQLite database on the very first launch after updating.
2. **Extreme Speed & Offline-First**: Instant startup (<300ms) with local SQLite database queries powered by Drizzle ORM and FTS5 (Full-Text Search) for instantaneous search across thousands of notes.
3. **Google Keep UI/UX Parity & Polish**: Staggered Masonry FlashList grid, pastel card palettes, interactive checklist items, note pinning, fluid Reanimated micro-interactions, and search/filter bar.
4. **Zero Central Server / WhatsApp-Style Backup**: Complete data privacy. Backups are created locally (compressed/encrypted ZIP of SQLite DB + media) and synced directly to the user's personal Google Drive (`appDataFolder`).
5. **Fast Organization**: Hierarchical Folders, manual Labels/Tags, and time-based local reminders.
6. **Hardened App Security**: App-level and per-note biometric authentication (FaceID/Fingerprint) with PIN fallback, backed by hardware-backed `expo-secure-store`.

---

## 2. Technical Stack & Compatibility Matrix (Expo SDK 53 + React 19)

| Layer | Technology | Justification & Compatibility Notes |
| :--- | :--- | :--- |
| **Framework** | Expo SDK 53 + React 19 + React Native 0.79 | Target stack of Notelo. New Architecture enabled (`newArchEnabled: true`). |
| **Routing** | Expo Router v5 (File-based) | Type-safe navigation, deep linking, modal sheets, and drawer support. |
| **Database** | `expo-sqlite` (v15+) + `drizzle-orm` | Native C-based SQLite engine with sync/async queries, zero JS thread blocking, type-safe schema with Drizzle ORM. |
| **Full-Text Search** | SQLite `FTS5` Virtual Table | Instant offline search across titles, contents, and checklists with typo tolerance and BM25 ranking. |
| **State Management** | `zustand` (v5) + `immer` | Micro state footprint, no boilerplate, seamless offline persistence via MMKV or AsyncStorage adapter. |
| **List Performance** | `@shopify/flash-list` (`MasonryFlashList`) | 10x performance over FlatList; native staggered 2-column masonry grid with recycling. |
| **Animations** | `react-native-reanimated` (v3.16+) + `react-native-gesture-handler` | 60/120 FPS UI thread animations for pinning, card reordering, and layout transitions. |
| **Styling** | Modern Theme System (StyleSheet + Design Tokens) | Ultra-fast rendering on React 19 / New Arch without runtime Metro transformer compilation friction. |
| **Bottom Sheets** | `@gorhom/bottom-sheet` (v5) | Native gesture-driven bottom sheets for tags, colors, reminders, and AI tools. |
| **Security** | `expo-local-authentication` + `expo-secure-store` | Hardware biometrics (Fingerprint/Biometrics) + encrypted key storage for API keys and passcodes. |
| **Files & Media** | `expo-file-system` + `expo-image-picker` | Local attachment storage in `FileSystem.documentDirectory`, image picking and compression. |
| **Audio Notes** | `expo-av` | Voice memo audio recording and inline playback with waveform/duration progress. |
| **Drawing Canvas** | `react-native-svg` | Finger gesture drawing canvas (pen, eraser, stroke width) exported to SVG/PNG attachments. |
| **Reminders** | `expo-notifications` | Time-based local push alerts with direct deep linking to note. |
| **Haptics** | `expo-haptics` | Delightful physical feedback on tap, long press, reorder, and checklist completion. |

---

## 3. Data Architecture & Migration Strategy

### 3.1 Legacy AsyncStorage Migration (Critical for Play Store Update)
Existing Play Store users have notes stored in AsyncStorage under the key `"addedNotes"`, formatted as:
```json
[
  {
    "id": "abc123xyz",
    "shortTitle": "Meeting Notes",
    "description": "Discuss Q3 roadmap...",
    "addedDate": "2025-08-24",
    "addedTime": "10:30 AM",
    "lastModified": 1724495400000
  }
]
```

#### Migration Workflow
1. At application launch (inside root layout `MigrationProvider`):
2. Check `SecureStore.getItemAsync('has_migrated_v1_to_v2')`.
3. If `false` or null:
   - Query `AsyncStorage.getItem('addedNotes')`.
   - If legacy notes exist, batch-insert into the SQLite `notes` table inside a single database transaction.
   - Map:
     - `id` -> `id`
     - `shortTitle` -> `title`
     - `description` -> `content`
     - `lastModified` -> `updatedAt` (timestamp)
     - `addedDate + addedTime` -> `createdAt` (timestamp)
     - `color` -> Default `#FFFFFF`
     - `isPinned` -> `0` (false), `isArchived` -> `0`, `isDeleted` -> `0`
   - Set `SecureStore.setItemAsync('has_migrated_v1_to_v2', 'true')`.
   - Keep the legacy AsyncStorage copy untouched as a safe fallback.

---

### 3.2 Relational SQLite Schema (Drizzle ORM)

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Folders / Notebooks Table
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').default('#64748B'),
  icon: text('icon').default('folder'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Notes Table
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }), // Optional folder assignment
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  noteType: text('note_type', { enum: ['text', 'checklist'] }).notNull().default('text'),
  color: text('color').notNull().default('#FFFFFF'), // Keep pastel colors
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false), // Trash support
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Auto-purge after 30 days
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false), // Note-level biometric lock
  reminderAt: integer('reminder_at', { mode: 'timestamp' }), // Notification timestamp
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Checklist Items (For Google Keep Style Checklist Notes)
export const checklistItems = sqliteTable('checklist_items', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  text: text('text').notNull().default(''),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Labels / Tags Table
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Note-to-Label Many-to-Many
export const noteLabels = sqliteTable('note_labels', {
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
});

// Attachments Table (Images, Audio Voice Memos)
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  localUri: text('local_uri').notNull(),
  mimeType: text('mime_type').notNull(), // 'image/jpeg', 'audio/m4a'
  fileSize: integer('file_size').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});
```

---

## 4. Google Keep Feature Breakdown & UX Specifications

### 4.1 Masonry Grid & Feed Layout
- **Toggle View**: Switch between 2-column Staggered Masonry (`MasonryFlashList`) and 1-column Full-width list.
- **Pinned vs Others Section**:
  - Notes with `isPinned === true` are grouped under a `"PINNED"` header.
  - Remaining notes are grouped under `"OTHERS"`.
  - Layout transitions animate with Reanimated `Layout.springify()`.
- **Note Cards**:
  - Dynamic card height based on content length (clamped to max 8 lines with gradient fade-out).
  - Checklists preview: First 4 checklist items shown with unchecked/checked status and "+ X more items" badge.
  - Media preview: Thumbnails of attached images shown at top of card.
  - Label chips rendered at bottom of card.

### 4.2 Color Palette (Google Keep Exact Match)
Support both Light and Dark mode variations of Keep's signature pastel palette:

| Name | Light Mode Hex | Dark Mode Hex |
| :--- | :--- | :--- |
| **Default** | `#FFFFFF` | `#202124` |
| **Coral** | `#FAAFA8` | `#77172E` |
| **Peach** | `#F39F76` | `#692B17` |
| **Sand** | `#FFF8B8` | `#7C4A03` |
| **Mint** | `#E2F6D3` | `#264D3B` |
| **Sage** | `#B4DDD3` | `#0C625D` |
| **Fog** | `#D4E4ED` | `#256377` |
| **Storm** | `#AECCDC` | `#284255` |
| **Dusk** | `#D3BFDB` | `#472E5B` |
| **Blossom** | `#F6E2DD` | `#6C394F` |
| **Clay** | `#E9E3D4` | `#4B443A` |
| **Chalk** | `#EFEFF1` | `#232427` |

### 4.3 Keep-Style Bottom Bar & Top Search Header
- **Top Header**:
  - Rounded search capsule: Navigation drawer trigger (left), Search placeholder (center), View toggle (Grid/List), and Profile/Settings avatar (right).
- **Bottom Action Bar (Quick Capture)**:
  - Checkbox icon: Instant new checklist note.
  - Brush icon: Instant drawing/canvas note.
  - Mic icon: Voice memo note with real-time transcription.
  - Image icon: Camera/Gallery image picker note.
  - Right Floating Action Button (FAB): Huge `+` for standard note creation.

---

## 5. Security Architecture (App Lock & Private Notes)

1. **App-Level Lock**:
   - Master toggle: `Lock App with Biometrics / Passcode`.
   - React Native `AppState` listener triggers lock overlay when app enters background for >30 seconds.
   - Uses `LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Notelo' })`.
   - Fallback custom PIN pad (4 or 6 digits) with secure hashing (`expo-crypto` SHA-256).
2. **Note-Level Lock**:
   - Individual notes can be locked (`isLocked: true`).
   - In the feed, locked notes hide their title and content preview (shows a sleek lock icon and "Locked Note" badge).
   - Tapping requires biometric authentication before decrypting and rendering the editor.

---

## 6. The Zero-Server Backup Engine ("WhatsApp Model")

1. **Local Archive Pipeline**:
   - SQLite `.db` file is checkpointed via `PRAGMA wal_checkpoint(FULL)`.
   - Local attachments from `FileSystem.documentDirectory/attachments/` and `notelo.db` are bundled into a single ZIP archive: `notelo_backup_<timestamp>.zip`.
2. **Google Drive Integration (AppData Folder)**:
   - Uses Google OAuth 2.0 (`drive.appdata` scope).
   - Files stored in the `appDataFolder` are private to Notelo and do not clutter the user's regular Google Drive.
   - Metadata manifest includes: `backupVersion`, `deviceModel`, `timestamp`, `noteCount`, `checksum`.
3. **Restore Engine**:
   - On new device or reinstall, detects existing Drive backups.
   - Downloads archive, extracts files, replaces SQLite DB, and triggers schema verification.

---

## 8. Step-by-Step Implementation Prompts

*Feed these prompts sequentially into your development workflow. Each step includes verification criteria.*

---

### Step 1: SDK 53 Environment, SQLite Database & Legacy Migration Engine
**Prompt for LLM:**
```text
Act as a Principal React Native Architect. We are updating the Notelo application (Expo SDK 53, React 19, New Architecture enabled).

TASK:
1. Set up Expo SQLite (v15+) with Drizzle ORM.
2. Create the Drizzle schema in `src/db/schema.ts` with tables: `notes`, `checklist_items`, `labels`, `note_labels`, and `attachments`.
3. Configure `db.ts` to open SQLite synchronously with WAL mode enabled (`PRAGMA journal_mode = WAL;`) and initialize Drizzle.
4. Implement `AsyncStorageMigrationService.ts`:
   - Checks if legacy key 'addedNotes' exists in AsyncStorage.
   - If found and migration flag in SecureStore is false, runs a single SQLite transaction inserting all legacy notes (mapping shortTitle -> title, description -> content, addedDate/lastModified -> timestamps).
   - Sets 'has_migrated_v1_to_v2' flag in SecureStore.
5. Create a root `DatabaseProvider.tsx` that ensures the DB is initialized and migrations run before rendering child screens.

Ensure full TypeScript strict typing and zero build warnings on Expo SDK 53.
```

---

### Step 2: Global State (Zustand) & Biometric App Lock
**Prompt for LLM:**
```text
Continuing with Notelo. We now need global state management and app security.

TASK:
1. Install and configure `zustand` (v5) with modular stores:
   - `useNotesStore`: Handles fetching, filtering, searching, pinning, archiving, deleting, and updating notes.
   - `useSettingsStore`: Handles viewMode ('grid' | 'list'), theme ('light' | 'dark' | 'system'), appLockEnabled, biometricAuthEnabled, and autoBackup.
2. Build `AppLockScreen.tsx` using `expo-local-authentication` and `expo-secure-store`.
   - Triggers biometric authentication on mount.
   - Provides a smooth 4-digit PIN fallback pad if biometrics are cancelled or unavailable.
   - Listens to React Native `AppState` to auto-lock the app if backgrounded for more than 30 seconds.
3. Integrate the lock check inside `src/app/_layout.tsx` with a buttery smooth fade transition using Reanimated.
```

---

### Step 3: Google Keep Feed (Masonry Grid, Pinned Notes & Search Bar)
**Prompt for LLM:**
```text
Now let's build the primary Google Keep-style dashboard in `src/app/(tabs)/index.tsx`.

TASK:
1. Implement `@shopify/flash-list` using `MasonryFlashList` (2 columns) with instant toggle to 1-column list view.
2. Build the `NoteCard.tsx` component:
   - Supports Google Keep pastel background colors (light & dark mode variants).
   - Displays title, content snippet (up to 6 lines with fade), checklist preview chips, and label tags.
   - Handles long-press with `expo-haptics` (selection mode: Pin, Archive, Color Change, Delete).
   - Smooth entry/layout animation with Reanimated.
3. Implement separate sections:
   - "PINNED" notes section on top.
   - "OTHERS" notes section below.
4. Build `KeepHeader.tsx`:
   - Pill-shaped search bar with menu drawer icon, search input, grid/list toggle icon, and profile/settings avatar.
5. Build `KeepBottomBar.tsx`:
   - Quick action icons: New Checklist, Voice Memo, Drawing/Image, and bottom-right elevated '+' FAB.
```

---

### Step 4: The Keep Editor (Rich Text Markdown, Checklist Mode & Palette Picker)
**Prompt for LLM:**
```text
Now build the note editing experience in `src/app/note/[id].tsx` and `src/app/note/new.tsx`.

TASK:
1. Create a distraction-free note editor matching Google Keep:
   - Header: Back button, Pin toggle, Reminder toggle, Archive toggle.
   - Title input: Auto-growing, bold H1 styling with no border.
   - Body: Supports two modes toggleable on the fly:
     a) Plain Text / Markdown Mode: Auto-growing multiline input.
     b) Checklist Mode: Interactive todo items with checkbox, strikethrough text, drag-to-reorder, and completed items collapsed at bottom.
2. Auto-save engine:
   - Debounced auto-save (500ms) directly to SQLite on keystroke. No manual "Save" button required.
   - Real-time timestamp indicator ("Edited 10:45 AM").
3. Bottom Editor Toolbar & Media:
   - Color & Background picker modal/sheet (12 Keep pastel colors).
   - Add Checklist toggle.
   - Image Attachment picker using `expo-image-picker` with full-screen pinch-to-zoom Lightbox modal.
   - Voice Memo Recorder using `expo-av` with inline playback waveform & audio player.
   - Drawing / Canvas Note using `react-native-svg` (brush tool with pen, eraser, color picker, and export to note attachment).
   - Delete / Move to Trash action.
```

---

### Step 5: Folders, Labels, Reminders & Trash Management
**Prompt for LLM:**
```text
We will now implement note organization, categorization, reminders, and trash management for Notelo.

TASK:
1. Folder & Label System:
   - Folder selector and manager (create, rename, customize icon/color, move notes).
   - Label management sheet (`@gorhom/bottom-sheet`) to add/remove manual labels from notes.
   - Navigation drawer / filter chips to filter notes by Folder and Label.
2. Time-Based Reminders & Local Notifications:
   - Reminders picker sheet ("Later today", "Tomorrow morning", "Next week", "Pick date & time").
   - Schedule local notifications using `expo-notifications`.
   - Notification response handler: Tapping notification launches app and deep-links directly to `/note/[id]`.
3. Archive & Trash System:
   - Dedicated screens `src/app/archive.tsx` and `src/app/trash.tsx`.
   - Soft-delete pattern: Deleted notes move to Trash; option to Restore or Permanently Delete.
   - Auto-purge notes that have remained in Trash for >30 days.
```

---

### Step 6: Zero-Server Backup Engine (Local & Google Drive with Conflict Handling)
**Prompt for LLM:**
```text
Implement the "WhatsApp-style" Zero-Server Backup system in `src/services/backupService.ts`.

TASK:
1. Local Database Export/Import:
   - Checkpoints SQLite DB (`PRAGMA wal_checkpoint(FULL)`).
   - Packages `notelo.db` and attached images/audio into a zip file in `FileSystem.documentDirectory/backups/`.
   - Provides an export button using `expo-sharing` so users can save or transfer their backup file anywhere.
2. Google Drive AppData Sync:
   - Integration with Google Drive REST API (`drive.appdata` scope).
   - `uploadBackupToDrive()`: Uploads the zip archive to the hidden app folder.
   - `fetchBackupsFromDrive()`: Lists available cloud backups with timestamps and sizes.
   - `restoreBackupFromDrive(fileId)`: Downloads and replaces local SQLite DB, running integrity check.
   - Conflict Resolution: Implements Last-Write-Wins (LWW) based on `updatedAt` timestamps with safety prompt to keep both versions if conflicts exist.
3. Create `SettingsBackupView.tsx`:
   - Shows Last Backup Time, Backup Size, "Backup Now" button, and Auto-Backup toggle.
```

---

### Step 7: Final Polish, App Shortcuts, Edge-to-Edge Android 15 & Play Store Release
**Prompt for LLM:**
```text
Prepare Notelo for production deployment as an update to Google Play Store.

TASK:
1. Android App Shortcuts (Quick Actions):
   - Configure launcher app shortcuts for "New Text Note" and "New Checklist" on home screen icon long-press.
2. Verify Android 15 edge-to-edge status bar compliance without warnings.
3. Check `app.json`:
   - Version bump to 1.1.0 (or next increment).
   - Ensure `versionCode` is incremented.
   - Confirm package name `com.dev007pravesh.Notelo` and EAS `projectId` are intact.
4. Performance auditing:
   - Verify FlashList scroll performance at 60/120 FPS.
   - Ensure zero memory leaks on image/audio attachments.
   - Validate full offline operation in Airplane Mode.
```

---

## 8. Testing & Quality Verification Checklist

- [ ] **First Launch Migration**: Upgraded app loads with 100% of existing AsyncStorage notes visible and intact.
- [ ] **Airplane Mode**: All CRUD actions (create, edit, delete, pin, label) function flawlessly with zero network connection.
- [ ] **FlashList Recycling**: Smooth scrolling with 1,000+ mock notes in both Grid and List modes without UI frame drops.
- [ ] **Checklist Operations**: Checking, unchecking, deleting, and reordering checklist items works with accurate state persistence.
- [ ] **App Lock**: App prompts for biometrics on launch and after 30s backgrounding; PIN fallback functions accurately.
- [ ] **Backup & Restore**: Exporting DB and restoring on a clean install yields identical notes, labels, and colors.
- [ ] **Reminders & Push Notifications**: Local notifications trigger at exact scheduled time and tap navigates directly to note.

