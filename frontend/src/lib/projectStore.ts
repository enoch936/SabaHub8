"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import type { Project, KanbanCard, KanbanColumnId } from './types';

const MOCK_PROJECT: Project = {
  id: 'PROJ001',
  title: 'SabaHub Platform Development',
  description: 'Full-stack development of the SABAHUB freelancing platform',
  ownerId: 'USER001',
  memberIds: ['USER001', 'USER002', 'USER003'],
  createdAt: '2026-01-15T10:00:00Z',
  deadline: '2026-06-30T00:00:00Z',
  columns: {
    TODO: [
      { id: 'CARD001', projectId: 'PROJ001', columnId: 'TODO', title: 'Design system documentation', description: 'Document all design tokens and component guidelines', assigneeName: 'Alice Chen', priority: 'MEDIUM', tags: ['design', 'docs'], order: 0, dueDate: '2026-04-15' },
      { id: 'CARD002', projectId: 'PROJ001', columnId: 'TODO', title: 'API endpoint testing', description: 'Write comprehensive tests for all REST endpoints', assigneeName: 'Bob Smith', priority: 'HIGH', tags: ['testing', 'backend'], order: 1, dueDate: '2026-04-10' },
      { id: 'CARD003', projectId: 'PROJ001', columnId: 'TODO', title: 'Mobile responsive fixes', description: 'Fix layout issues on mobile devices', priority: 'LOW', tags: ['mobile', 'css'], order: 2 },
    ],
    IN_PROGRESS: [
      { id: 'CARD004', projectId: 'PROJ001', columnId: 'IN_PROGRESS', title: 'Wallet module implementation', description: 'Build the complete wallet UI with all payment methods', assigneeName: 'Carol Davis', priority: 'HIGH', tags: ['wallet', 'frontend'], order: 0, dueDate: '2026-04-05' },
      { id: 'CARD005', projectId: 'PROJ001', columnId: 'IN_PROGRESS', title: 'Job feed AI matching', description: 'Implement AI-powered job matching algorithm', assigneeName: 'David Lee', priority: 'HIGH', tags: ['ai', 'jobs'], order: 1 },
    ],
    REVIEW: [
      { id: 'CARD006', projectId: 'PROJ001', columnId: 'REVIEW', title: 'Authentication flow', description: 'Review JWT auth implementation and role switching', assigneeName: 'Eve Wilson', priority: 'MEDIUM', tags: ['auth', 'security'], order: 0 },
    ],
    DONE: [
      { id: 'CARD007', projectId: 'PROJ001', columnId: 'DONE', title: 'Project setup & configuration', description: 'Next.js, TypeScript, Tailwind, MUI setup', priority: 'HIGH', tags: ['setup'], order: 0 },
      { id: 'CARD008', projectId: 'PROJ001', columnId: 'DONE', title: 'Database schema design', description: 'PostgreSQL schema for all entities', priority: 'HIGH', tags: ['database'], order: 1 },
    ],
  },
};

interface ProjectStore {
  project: Project | null;
  isLoading: boolean;
  fetchProject: (id?: string) => Promise<void>;
  moveKanbanCard: (cardId: string, toColumn: KanbanColumnId, toIndex: number) => void;
  addCard: (columnId: KanbanColumnId, card: Omit<KanbanCard, 'id' | 'projectId' | 'order'>) => void;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
  deleteCard: (cardId: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  isLoading: false,

  fetchProject: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 600));
    set({ project: JSON.parse(JSON.stringify(MOCK_PROJECT)), isLoading: false });
  },

  moveKanbanCard: (cardId, toColumn, toIndex) => {
    set((state) => {
      if (!state.project) return state;
      const columns = JSON.parse(JSON.stringify(state.project.columns)) as Project['columns'];

      let card: KanbanCard | null = null;
      for (const col of Object.keys(columns) as KanbanColumnId[]) {
        const idx = columns[col].findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          [card] = columns[col].splice(idx, 1);
          columns[col].forEach((c, i) => { c.order = i; });
          break;
        }
      }

      if (!card) return state;
      card.columnId = toColumn;
      const dest = columns[toColumn];
      const safeIndex = Math.max(0, Math.min(toIndex, dest.length));
      dest.splice(safeIndex, 0, card);
      dest.forEach((c, i) => { c.order = i; });

      return { project: { ...state.project!, columns } };
    });
  },

  addCard: (columnId, cardData) => {
    set((state) => {
      if (!state.project) return state;
      const columns = JSON.parse(JSON.stringify(state.project.columns)) as Project['columns'];
      const newCard: KanbanCard = {
        ...cardData,
        id: `CARD${Date.now()}`,
        projectId: state.project.id,
        columnId,
        order: columns[columnId].length,
      };
      columns[columnId].push(newCard);
      toast.success('Card added');
      return { project: { ...state.project!, columns } };
    });
  },

  updateCard: (cardId, updates) => {
    set((state) => {
      if (!state.project) return state;
      const columns = JSON.parse(JSON.stringify(state.project.columns)) as Project['columns'];
      for (const col of Object.keys(columns) as KanbanColumnId[]) {
        const idx = columns[col].findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          columns[col][idx] = { ...columns[col][idx], ...updates };
          break;
        }
      }
      toast.success('Card updated');
      return { project: { ...state.project!, columns } };
    });
  },

  deleteCard: (cardId) => {
    set((state) => {
      if (!state.project) return state;
      const columns = JSON.parse(JSON.stringify(state.project.columns)) as Project['columns'];
      for (const col of Object.keys(columns) as KanbanColumnId[]) {
        const idx = columns[col].findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          columns[col].splice(idx, 1);
          columns[col].forEach((c, i) => { c.order = i; });
          break;
        }
      }
      toast.success('Card deleted');
      return { project: { ...state.project!, columns } };
    });
  },
}));
