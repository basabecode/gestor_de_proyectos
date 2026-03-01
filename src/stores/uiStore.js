import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      sidebarWidth: 260,
      theme: 'light',
      searchOpen: false,
      searchQuery: '',
      activeModal: null,
      modalData: null,
      contextMenu: null,
      mobileSidebarOpen: false,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
      setMobileSidebarOpen: (val) => set({ mobileSidebarOpen: val }),
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

      setTheme: (theme) => set({ theme }),

      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false, searchQuery: '' }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      showContextMenu: (config) => set({ contextMenu: config }),
      hideContextMenu: () => set({ contextMenu: null }),
    }),
    {
      name: 'workos-ui',
      version: 1,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

export default useUIStore;
