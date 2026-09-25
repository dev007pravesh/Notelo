import { create } from 'zustand';
import { NotesRepository, NoteWithDetails } from '../db/repositories/notesRepository';
import { FoldersRepository } from '../db/repositories/foldersRepository';
import { LabelsRepository } from '../db/repositories/labelsRepository';
import { Folder, Label, NewNote, NewChecklistItem } from '../db/schema';

interface NotesState {
  notes: NoteWithDetails[];
  folders: Folder[];
  labels: Label[];
  activeFolderId: string | null | 'all';
  activeLabelId: string | null;
  searchQuery: string;
  selectedNoteIds: string[];
  isSelectionMode: boolean;
  isLoading: boolean;
  hasMoreNotes: boolean;
  isLoadingMore: boolean;

  // Actions
  fetchNotes: (folderId?: string | null | 'all', labelId?: string | null) => Promise<void>;
  fetchMoreNotes: () => Promise<void>;
  fetchFoldersAndLabels: () => Promise<void>;
  setActiveFolder: (folderId: string | null | 'all') => Promise<void>;
  setActiveLabel: (labelId: string | null) => Promise<void>;
  setSearchQuery: (query: string) => Promise<void>;
  saveNote: (
    noteData: NewNote,
    checklists?: Array<Omit<NewChecklistItem, 'noteId'>>,
    labelIds?: string[],
    attachments?: Array<{ localUri: string; mimeType: string; fileSize?: number }>
  ) => Promise<NoteWithDetails>;
  togglePin: (id: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  
  // Selection Mode Actions
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  bulkMoveToTrash: () => Promise<void>;
  bulkMoveToFolder: (folderId: string | null) => Promise<void>;
  bulkTogglePin: (pinState: boolean) => Promise<void>;
  bulkSetColor: (color: string) => Promise<void>;
  bulkSetReminder: (date: Date | null) => Promise<void>;
  bulkAddLabel: (labelId: string) => Promise<void>;
  reorderNotes: (orderedNotes: NoteWithDetails[]) => Promise<void>;
  moveNote: (id: string, direction: 'up' | 'down') => Promise<void>;
  resetNoteOrder: () => Promise<void>;
}

const PAGE_SIZE = 50;

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  labels: [],
  activeFolderId: 'all',
  activeLabelId: null,
  searchQuery: '',
  selectedNoteIds: [],
  isSelectionMode: false,
  isLoading: false,
  hasMoreNotes: true,
  isLoadingMore: false,

  fetchNotes: async (folderId, labelId) => {
    const targetFolder = folderId !== undefined ? folderId : get().activeFolderId;
    const targetLabel = labelId !== undefined ? labelId : get().activeLabelId;
    set({ isLoading: true });
    try {
      let result: NoteWithDetails[];
      let hasMore = false;
      if (get().searchQuery.trim().length > 0) {
        result = await NotesRepository.searchNotes(get().searchQuery);
        hasMore = false;
      } else if (targetLabel) {
        result = await NotesRepository.getActiveNotesByLabel(targetLabel, PAGE_SIZE, 0);
        hasMore = result.length === PAGE_SIZE;
      } else {
        const folderParam = targetFolder === 'all' ? undefined : targetFolder;
        result = await NotesRepository.getActiveNotes(folderParam, PAGE_SIZE, 0);
        hasMore = result.length === PAGE_SIZE;
      }
      set({
        notes: result,
        hasMoreNotes: hasMore,
        isLoading: false,
        activeFolderId: targetFolder,
        activeLabelId: targetLabel,
      });
    } catch (e) {
      console.error('Error fetching notes:', e);
      set({ isLoading: false });
    }
  },

  fetchMoreNotes: async () => {
    if (get().isLoadingMore || !get().hasMoreNotes || get().searchQuery.trim().length > 0) {
      return;
    }
    set({ isLoadingMore: true });
    try {
      const targetLabel = get().activeLabelId;
      const targetFolder = get().activeFolderId;
      const offset = get().notes.length;
      let nextNotes: NoteWithDetails[];
      if (targetLabel) {
        nextNotes = await NotesRepository.getActiveNotesByLabel(targetLabel, PAGE_SIZE, offset);
      } else {
        const folderParam = targetFolder === 'all' ? undefined : targetFolder;
        nextNotes = await NotesRepository.getActiveNotes(folderParam, PAGE_SIZE, offset);
      }
      set((state) => ({
        notes: [...state.notes, ...nextNotes],
        hasMoreNotes: nextNotes.length === PAGE_SIZE,
        isLoadingMore: false,
      }));
    } catch (e) {
      console.error('Error fetching more notes:', e);
      set({ isLoadingMore: false });
    }
  },

  fetchFoldersAndLabels: async () => {
    try {
      const [foldersList, labelsList] = await Promise.all([
        FoldersRepository.getAllFolders(),
        LabelsRepository.getAllLabels(),
      ]);
      set({ folders: foldersList, labels: labelsList });
    } catch (e) {
      console.error('Error fetching folders and labels:', e);
    }
  },

  setActiveFolder: async (folderId) => {
    set({ activeFolderId: folderId, activeLabelId: null, searchQuery: '' });
    await get().fetchNotes(folderId, null);
  },

  setActiveLabel: async (labelId) => {
    set({ activeLabelId: labelId, activeFolderId: 'all', searchQuery: '' });
    await get().fetchNotes('all', labelId);
  },

  setSearchQuery: async (query: string) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      await get().fetchNotes();
      return;
    }
    set({ isLoading: true });
    try {
      const results = await NotesRepository.searchNotes(query);
      set({ notes: results, isLoading: false });
    } catch (e) {
      console.error('Error searching notes:', e);
      set({ isLoading: false });
    }
  },

  saveNote: async (noteData, checklists, labelIds, attachments) => {
    const saved = await NotesRepository.upsertNote(noteData, checklists, labelIds, attachments);
    await get().fetchNotes();
    return saved;
  },

  togglePin: async (id: string) => {
    const current = get().notes.find((n) => n.id === id);
    if (!current) return;
    const newPinned = !current.isPinned;
    await NotesRepository.togglePin(id, newPinned);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, isPinned: newPinned } : n)),
    }));
  },

  moveToTrash: async (id: string) => {
    await NotesRepository.moveToTrash(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteIds: state.selectedNoteIds.filter((selectedId) => selectedId !== id),
    }));
  },

  restoreFromTrash: async (id: string) => {
    await NotesRepository.restoreFromTrash(id);
    await get().fetchNotes();
  },

  deletePermanently: async (id: string) => {
    await NotesRepository.deletePermanently(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteIds: state.selectedNoteIds.filter((selectedId) => selectedId !== id),
    }));
  },

  toggleSelection: (id: string) => {
    const currentSelected = get().selectedNoteIds;
    let newSelected: string[];
    if (currentSelected.includes(id)) {
      newSelected = currentSelected.filter((item) => item !== id);
    } else {
      newSelected = [...currentSelected, id];
    }
    set({
      selectedNoteIds: newSelected,
      isSelectionMode: newSelected.length > 0,
    });
  },

  selectAll: () => {
    set({
      selectedNoteIds: get().notes.map((n) => n.id),
      isSelectionMode: true,
    });
  },

  clearSelection: () => {
    set({
      selectedNoteIds: [],
      isSelectionMode: false,
    });
  },

  bulkMoveToTrash: async () => {
    const ids = get().selectedNoteIds;
    for (const id of ids) {
      await NotesRepository.moveToTrash(id);
    }
    set((state) => ({
      notes: state.notes.filter((n) => !ids.includes(n.id)),
      selectedNoteIds: [],
      isSelectionMode: false,
    }));
  },

  bulkMoveToFolder: async (folderId: string | null) => {
    const ids = get().selectedNoteIds;
    for (const id of ids) {
      const note = get().notes.find((n) => n.id === id);
      if (note) {
        await NotesRepository.upsertNote({
          ...note,
          folderId,
        });
      }
    }
    await get().fetchNotes();
    get().clearSelection();
  },

  bulkTogglePin: async (pinState: boolean) => {
    const ids = get().selectedNoteIds;
    for (const id of ids) {
      await NotesRepository.togglePin(id, pinState);
    }
    set((state) => ({
      notes: state.notes.map((n) => (ids.includes(n.id) ? { ...n, isPinned: pinState } : n)),
      selectedNoteIds: [],
      isSelectionMode: false,
    }));
  },

  bulkSetColor: async (color: string) => {
    const ids = get().selectedNoteIds;
    await NotesRepository.bulkUpdateColor(ids, color);
    set((state) => ({
      notes: state.notes.map((n) => (ids.includes(n.id) ? { ...n, color } : n)),
    }));
  },

  bulkSetReminder: async (date: Date | null) => {
    const ids = get().selectedNoteIds;
    await NotesRepository.bulkUpdateReminder(ids, date);
    set((state) => ({
      notes: state.notes.map((n) => (ids.includes(n.id) ? { ...n, reminderAt: date } : n)),
    }));
  },

  bulkAddLabel: async (labelId: string) => {
    const ids = get().selectedNoteIds;
    await NotesRepository.bulkAddLabel(ids, labelId);
    await get().fetchNotes();
  },

  reorderNotes: async (orderedNotes: NoteWithDetails[]) => {
    set({ notes: orderedNotes });
    try {
      await NotesRepository.updateNotesOrder(orderedNotes.map((n) => n.id));
    } catch (e) {
      console.error('Error persisting note order:', e);
    }
  },

  moveNote: async (id: string, direction: 'up' | 'down') => {
    const currentNotes = [...get().notes];
    const index = currentNotes.findIndex((n) => n.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentNotes.length) return;

    // Boundary check: keep pinned notes within pinned section and vice-versa
    if (currentNotes[index].isPinned !== currentNotes[targetIndex].isPinned) return;

    const [movedNote] = currentNotes.splice(index, 1);
    currentNotes.splice(targetIndex, 0, movedNote);

    set({ notes: currentNotes });

    try {
      await NotesRepository.updateNotesOrder(currentNotes.map((n) => n.id));
    } catch (e) {
      console.error('Error persisting moved note:', e);
    }
  },

  resetNoteOrder: async () => {
    try {
      await NotesRepository.resetNotesOrder();
      await get().fetchNotes();
    } catch (e) {
      console.error('Error resetting note order:', e);
    }
  },
}));
