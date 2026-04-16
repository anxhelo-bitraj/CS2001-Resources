import { create } from 'zustand';
import type { Email, EmailCategory } from '../../shared/types';

interface EmailState {
  activeEmailId: string | null;
  activeEmail: Email | null;
  selectedCategory: EmailCategory | 'all';
  selectedFolder: string;
  searchQuery: string;
  setActiveEmail: (email: Email | null) => void;
  setSelectedCategory: (cat: EmailCategory | 'all') => void;
  setSelectedFolder: (folder: string) => void;
  setSearchQuery: (q: string) => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  activeEmailId: null,
  activeEmail: null,
  selectedCategory: 'all',
  selectedFolder: 'inbox',
  searchQuery: '',
  setActiveEmail: (email) => set({ activeEmail: email, activeEmailId: email?.id ?? null }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
