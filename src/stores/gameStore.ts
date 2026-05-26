import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt?: string;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
  unlockedAt: string;
}

export interface UserData {
  totalScore: number;
  level: number;
  badges: Badge[];
  unlockedGames: string[];
  knowledgeCards: KnowledgeCard[];
}

interface GameStore {
  user: UserData;
  addScore: (score: number) => void;
  addBadge: (badge: Badge) => void;
  unlockGame: (gameId: string) => void;
  addKnowledgeCard: (card: KnowledgeCard) => void;
  resetProgress: () => void;
}

const initialUserData: UserData = {
  totalScore: 0,
  level: 1,
  badges: [],
  unlockedGames: ['fruit-slice', 'run', 'quiz', 'doctor'],
  knowledgeCards: [],
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      user: initialUserData,
      addScore: (score) =>
        set((state) => ({
          user: {
            ...state.user,
            totalScore: state.user.totalScore + score,
            level: Math.floor((state.user.totalScore + score) / 500) + 1,
          },
        })),
      addBadge: (badge) =>
        set((state) => ({
          user: {
            ...state.user,
            badges: state.user.badges.some((b) => b.id === badge.id)
              ? state.user.badges
              : [...state.user.badges, { ...badge, unlockedAt: new Date().toISOString() }],
          },
        })),
      unlockGame: (gameId) =>
        set((state) => ({
          user: {
            ...state.user,
            unlockedGames: state.user.unlockedGames.includes(gameId)
              ? state.user.unlockedGames
              : [...state.user.unlockedGames, gameId],
          },
        })),
      addKnowledgeCard: (card) =>
        set((state) => ({
          user: {
            ...state.user,
            knowledgeCards: state.user.knowledgeCards.some((c) => c.id === card.id)
              ? state.user.knowledgeCards
              : [...state.user.knowledgeCards, card],
          },
        })),
      resetProgress: () => set({ user: initialUserData }),
    }),
    {
      name: 'health-guardian-storage',
    }
  )
);
