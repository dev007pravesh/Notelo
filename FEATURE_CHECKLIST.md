# Notelo: Complete Feature Implementation & Testing Checklist

> **Purpose:** Track step-by-step progress for upgrading **Notelo** to a Google Keep-style offline-first notes app without losing existing Play Store users' data.  
> **Rule:** Every time a feature is coded, integrated, and verified, mark its checkbox as completed (`[x]`).

---

## 📊 Overall Progress Summary

- [x] **Phase 0: Safety & Legacy Data Migration** (4/4 completed) ✅
- [x] **Phase 1: Database Foundation & Schema** (6/6 completed) ✅
- [x] **Phase 2: Global State & Biometric Security** (6/6 completed) ✅
- [x] **Phase 3: Google Keep Feed & Masonry Grid** (8/8 completed) ✅
- [x] **Phase 4: The Keep Note Editor & Checklists** (10/10 completed) ✅
- [ ] **Phase 5: Organization (Folders, Labels, Reminders, Trash)** (0/7 completed)
- [ ] **Phase 6: Zero-Server WhatsApp-Style Backup** (0/5 completed)
- [ ] **Phase 7: Edge-to-Edge, Haptics & Play Store Release** (0/6 completed)

---

## 🛡️ Phase 0: Safety & Legacy Data Migration (Zero Data Loss)
*Ensures existing Play Store users upgrading to this version don't lose any notes stored in AsyncStorage (`addedNotes`).*

- [x] **0.1 Legacy Data Audit**: Verify existing `AsyncStorage` key `addedNotes` structure (`shortTitle`, `description`, `addedDate`, `addedTime`, `lastModified`).
- [x] **0.2 Migration Engine (`AsyncStorageMigrationService`)**: 
  - Reads legacy `addedNotes` on first launch.
  - Transforms legacy notes to new SQLite `notes` schema format.
  - Batch-inserts them within a single atomic SQLite transaction.
- [x] **0.3 Safe Migration Flag**: Save `has_migrated_v1_to_v2: true` in `expo-secure-store` so migration runs only once and legacy data is kept safely as a backup.
- [x] **0.4 Migration Test Verification**: Test updating an app pre-loaded with mock legacy notes and verify all notes appear seamlessly in SQLite.

---

## 🗄️ Phase 1: Database Foundation & Schema (Expo SQLite + Drizzle ORM)
*Local-first, ultra-fast C-based SQLite with Drizzle ORM on Expo SDK 53.*

- [x] **1.1 Dependencies Setup**: Install `expo-sqlite` (v15+), `drizzle-orm`, and configure `drizzle-kit`.
- [x] **1.2 Database Initializer (`db.ts`)**:
  - Configure synchronous SQLite connection (`SQLite.openDatabaseSync('notelo.db')`).
  - Enable Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) for high concurrency and performance.
- [x] **1.3 Drizzle Schema Definitions (`src/db/schema.ts`)**:
  - `folders` table (id, name, color, icon, orderIndex, createdAt) - for structured notebooks.
  - `notes` table (id, folderId, title, content, noteType, color, isPinned, isArchived, isDeleted, isLocked, reminderAt, createdAt, updatedAt).
  - `checklist_items` table (id, noteId, text, isCompleted, orderIndex, createdAt).
  - `labels` table (id, name, createdAt).
  - `note_labels` table (noteId, labelId).
  - `attachments` table (id, noteId, localUri, mimeType, fileSize, createdAt).
- [x] **1.4 Full-Text Search (FTS5)**: Initialize SQLite FTS5 virtual table for lightning-fast keyword search across note titles, contents, and checklist items.
- [x] **1.5 Data Access Layer (CRUD Repository)**: Create typed repository helpers for Folders, Notes, Checklists, Labels, and Attachments.
- [x] **1.6 Database Provider Component**: Root level `DatabaseProvider` to ensure database readiness and migration completion before UI render.

---

## 🔐 Phase 2: Global State & Biometric Security
*Zustand stores and privacy protection with hardware biometrics and PIN fallback.*

- [x] **2.1 Zustand Stores (`src/store/`)**:
  - `useNotesStore`: Notes list, active folder, current filters, search query, selection mode, pinned/unpinned split.
  - `useSettingsStore`: View mode (`grid` vs `list`), theme (`light` vs `dark`), biometric lock preference, auto-backup toggle.
- [x] **2.2 Hardware Biometrics Integration**: Use `expo-local-authentication` for fingerprint / Face ID check.
- [x] **2.3 Secure PIN Storage**: Store user-configured 4-digit PIN securely using `expo-secure-store` with SHA-256 hash.
- [x] **2.4 App Lock Screen (`AppLockScreen.tsx`)**:
  - Full-screen biometric prompt on launch.
  - 4-digit keypad fallback when biometrics fail or are cancelled.
  - Smooth unlock animation using Reanimated.
- [x] **2.5 Background Auto-Lock**: Listen to React Native `AppState` and auto-lock the app if backgrounded for more than 30 seconds.
- [x] **2.6 Note-Level Lock**: Support locking sensitive individual notes (`isLocked: true`), hiding their content preview on the feed until authenticated.

---

## 📱 Phase 3: Google Keep Feed & Masonry Grid UI
*Buttery-smooth dashboard inspired by Google Keep with 60/120 FPS performance.*

- [x] **3.1 Masonry Grid (`MasonryFlashList`)**:
  - 2-column staggered card layout using `@shopify/flash-list`.
  - 1-column toggleable list view with instant switch.
- [x] **3.2 Google Keep Pastel Palette**:
  - Exact 12 pastel color variants (Coral, Peach, Sand, Mint, Sage, Fog, Storm, Dusk, Blossom, Clay, Chalk, Default).
  - Dark mode and Light mode color parity.
- [x] **3.3 Note Card Component (`NoteCard.tsx`)**:
  - Dynamic height calculation based on content.
  - Checklist preview (shows first 4 checklist items + "+X more" chip).
  - Image attachment thumbnail preview at card top.
  - Folder & Label tags rendered at bottom of card.
  - Color tinting matching Google Keep.
- [x] **3.4 Sectioned Feed (Pinned vs Others)**:
  - Sticky "PINNED" section header when pinned notes exist.
  - "OTHERS" section header for remaining notes.
  - Reanimated layout animations when pinning/unpinning notes.
- [x] **3.5 Top Search Capsule Header (`KeepHeader.tsx`)**:
  - Drawer menu icon on left (opens Folders & Labels drawer).
  - Center search input with clear button.
  - View toggle icon (Grid ⊞ / List ☰).
  - Settings avatar on right.
- [x] **3.6 Bottom Quick Capture Bar (`KeepBottomBar.tsx`)**:
  - Checkbox icon: One-tap create new checklist note.
  - Brush icon: Create canvas/drawing note.
  - Mic icon: Create voice memo note.
  - Image icon: Pick camera/gallery image note.
  - Large elevated Floating Action Button (`+` FAB) on the right for standard text note.
- [x] **3.7 Multi-Selection Mode**:
  - Long press on a note card triggers selection mode with haptics.
  - Top action bar shows: Count selected, Pin, Move to Folder, Archive, Color Change, Delete.
- [x] **3.8 Empty State & Loading State**: Clean, elegant Google Keep style illustration and message when no notes exist.

---

## ✏️ Phase 4: The Keep Note Editor & Checklists
*Distraction-free, responsive note creation and editing experience.*

- [x] **4.1 Screen Architecture (`src/app/note/[id].tsx` & `new.tsx`)**: Clean layout with header, title input, scrollable body canvas, and bottom toolbar.
- [x] **4.2 Auto-Growing Title Input**: Large H1-styled title without borders, auto-capitalizing first letters.
- [x] **4.3 Mode 1 - Text & Markdown Editor**:
  - Fluid multiline body input with line height and subtle notebook background lines (optional).
  - Markdown formatting support for bold, italic, lists, and headers.
  - Single note `.md` file export & import.
- [x] **4.4 Mode 2 - Interactive Checklist Editor**:
  - Dynamic list of todo items with checkboxes.
  - Auto-create new item on Enter/Return key press.
  - Strikethrough effect on completed items.
  - "Completed Items (X)" collapsible section at the bottom.
  - Delete item button on each row.
- [x] **4.5 Keystroke Auto-Save**:
  - 500ms debounced auto-save directly to SQLite as the user types.
  - "Edited [Time]" status indicator so the user never worries about pressing "Save".
- [x] **4.6 Color & Background Picker**:
  - Bottom sheet or modal with 12 Google Keep pastel color circles.
  - Dynamically updates editor background color in real-time.
- [x] **4.7 Image Attachments & Full-Screen Lightbox**:
  - Integration with `expo-image-picker`.
  - Saves images permanently to local app storage (`FileSystem.documentDirectory/attachments/`).
  - Full-screen pinch-to-zoom Lightbox viewer modal on image tap.
- [x] **4.8 Voice Memo Notes (`expo-av`)**:
  - Audio recording with live duration timer.
  - Saves `.m4a` file to `attachments/` folder.
  - Inline playback widget with waveform/scrubber, play/pause, and duration display.
- [x] **4.9 Drawing / Canvas Notes (`react-native-svg`)**:
  - Gesture-based drawing canvas (finger sketching).
  - Pen, eraser, stroke width selector, and color palette.
  - Auto-export drawing as PNG attachment linked to note.
- [x] **4.10 Editor Header Actions**: Back arrow, Folder selector chip, Pin toggle icon, Reminder button, Archive button, More options menu.

---

## 🗂️ Phase 5: Organization (Folders, Labels, Archive, Trash)
*Complete hierarchical and tagged note organization.*

- [x] **5.1 Folder / Notebook Management System**:
  - Create new folders with custom icons & accent colors (e.g. 📁 Work, 💡 Ideas, 📚 Study, 💰 Finance).
  - Move notes between folders via a bottom sheet picker.
  - Filter feed by specific folder or "All Notes".
  - Rename and delete folders (with option to delete notes or move to default "All Notes").
- [x] **5.2 Label / Tag Management System**:
  - Create, rename, and delete multi-purpose labels.
  - Tag/untag multiple labels to any note via a sleek bottom sheet selector.
- [x] **5.3 Navigation Drawer / Side Menu**:
  - Drawer showing: All Notes, Folders section (with + New Folder), Labels section (with + New Label), Reminders, Archive, Trash, Settings.
- [x] **5.4 Filter & Search Screen**:
  - Fast search filter combining text query, active folder, label chips, and color chips.
- [x] **5.5 Archive System**:
  - Dedicated Archive screen (`src/app/archive.tsx`).
  - Ability to unarchive notes back to main feed.
- [x] **5.6 Trash / Soft-Delete System**:
  - Dedicated Trash screen (`src/app/trash.tsx`).
  - Deleted notes are marked `isDeleted = true` with timestamp.
  - "Restore" or "Delete Forever" buttons.
  - Auto-purge notes that have been in Trash for >30 days.
- [x] **5.7 Time-Based Reminders & Local Notifications (`expo-notifications`)**:
  - Date and time picker sheet ("Later today", "Tomorrow morning", "Next week", "Pick date & time").
  - Schedule local push notifications using `expo-notifications`.
  - Notification response handler: Tapping notification launches app and deep-links directly to `/addNote?id=[id]`.

---

## ☁️ Phase 6: Zero-Server WhatsApp-Style Backup Engine
*Private, user-owned backups with local archive and Google Drive sync.*

- [ ] **6.1 SQLite WAL Checkpoint & Packaging**:
  - Run `PRAGMA wal_checkpoint(FULL)` to flush all pending transactions into `notelo.db`.
  - Bundle `notelo.db`, attached images, and audio notes into a compressed ZIP file.
- [ ] **6.2 Local Backup Export & Import**:
  - Export backup ZIP to phone storage or share via `expo-sharing`.
  - Import ZIP file to restore notes completely offline.
- [ ] **6.3 Google Drive AppData Integration**:
  - Google OAuth authentication using Google REST API.
  - Upload backup ZIP to the hidden `appDataFolder` (`drive.appdata` scope) so it remains private and doesn't clutter user's Drive.
- [ ] **6.4 Restore from Google Drive & Conflict Handling**:
  - Detect latest cloud backup, verify checksum, download, and replace local SQLite database with hot reload.
  - Timestamp-based Last-Write-Wins (LWW) conflict handling with option to keep both versions.
- [ ] **6.5 Settings Backup Screen (`SettingsBackupScreen.tsx`)**:
  - Display "Last Backup: [Date & Time]", Backup Size, "Back Up Now" button, and Auto-Backup frequency toggle.

---

## 🚀 Phase 7: Edge-to-Edge, Haptics & Play Store Release
*Production readiness and Store update verification.*

- [ ] **7.1 Android App Shortcuts (Quick Actions)**:
  - Configure launcher home screen app shortcuts for "New Text Note" and "New Checklist".
- [ ] **7.2 Haptic Micro-Interactions**: Subtle `expo-haptics` on checklist tap, card long-press, pin toggle, and pull-to-refresh.
- [ ] **7.3 Android 15 Edge-to-Edge & StatusBar**: Validate edge-to-edge transparent navigation bar and StatusBar compatibility without warnings.
- [ ] **7.4 60/120 FPS Performance Audit**: Test smooth scrolling on low-end and high-end Android devices with 1,000+ notes.
- [ ] **7.5 Offline Mode Testing**: Enable Airplane Mode and test all features (creation, editing, searching, checklists, pinning, locking).
- [ ] **7.6 Store Configuration & Build Verification**:
  - Bump `version` and `versionCode` in `app.json`.
  - Validate package name `com.dev007pravesh.Notelo` and EAS `projectId`.
  - Run `npx expo-doctor` and `npx tsc --noEmit` to ensure 0 errors.
