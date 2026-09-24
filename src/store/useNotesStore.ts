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
  searchQuery: string;
  selectedNoteIds: string[];
  isSelectionMode: boolean;
  isLoading: boolean;

  // Actions
  fetchNotes: (folderId?: string | null | 'all') => Promise<void>;
  fetchFoldersAndLabels: () => Promise<void>;
  setActiveFolder: (folderId: string | null | 'all') => Promise<void>;
  setSearchQuery: (query: string) => Promise<void>;
  saveNote: (
    noteData: NewNote,
    checklists?: Array<Omit<NewChecklistItem, 'noteId'>>,
    labelIds?: string[]
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
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  labels: [],
  activeFolderId: 'all',
  searchQuery: '',
  selectedNoteIds: [],
  isSelectionMode: false,
  isLoading: false,

  fetchNotes: async (folderId) => {
    const targetFolder = folderId !== undefined ? folderId : get().activeFolderId;
    set({ isLoading: true });
    try {
      let result: NoteWithDetails[];
      if (get().searchQuery.trim().length > 0) {
        result = await NotesRepository.searchNotes(get().searchQuery);
      } else if (targetFolder === 'all') {
        result = await NotesRepository.getActiveNotes(undefined);
      } else {
        result = await NotesRepository.getActiveNotes(targetFolder);
      }
      set({ notes: result, isLoading: false, activeFolderId: targetFolder });
    } catch (e) {
      console.error('Error fetching notes:', e);
      set({ isLoading: false });
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
    set({ activeFolderId: folderId, searchQuery: '' });
    await get().fetchNotes(folderId);
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

  saveNote: async (noteData, checklists, labelIds) => {
    const saved = await NotesRepository.upsertNote(noteData, checklists, labelIds);
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
}));
