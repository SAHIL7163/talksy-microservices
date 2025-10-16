import { create } from "zustand";

export const useChatNotifications = create((set) => ({
  unread: {}, // { [channelId]: count }
  increment: (channelId) =>
    set((state) => ({
      unread: {
        ...state.unread,
        [channelId]: (state.unread[channelId] || 0) + 1,
      },
    })),
  reset: (channelId) =>
    set((state) => ({
      unread: { ...state.unread, [channelId]: 0 },
    })),
}));