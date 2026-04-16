import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  composeOpen: boolean;
  darkMode: boolean;
  replyPanelOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setComposeOpen: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  setReplyPanelOpen: (v: boolean) => void;
  toggleDarkMode: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  composeOpen: false,
  darkMode: false,
  replyPanelOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setComposeOpen: (v) => set({ composeOpen: v }),
  setDarkMode: (v) => set({ darkMode: v }),
  setReplyPanelOpen: (v) => set({ replyPanelOpen: v }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
