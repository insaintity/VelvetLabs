"use client";

import { create } from "zustand";

type PlayerState = {
  activeTrack: { title: string; projectTitle: string; durationSeconds: number; artworkTitle: string; sourceUrl?: string; version?: number } | null;
  isPlaying: boolean;
  positionSeconds: number;
  volume: number;
  loadTrack: (track: NonNullable<PlayerState["activeTrack"]>) => void;
  clearTrack: () => void;
  togglePlaying: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  activeTrack: null,
  isPlaying: false,
  positionSeconds: 0,
  volume: 78,
  loadTrack: (activeTrack) => set({ activeTrack, positionSeconds: 0, isPlaying: false }),
  clearTrack: () => set({ activeTrack: null, positionSeconds: 0, isPlaying: false }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  seek: (seconds) => set({ positionSeconds: seconds }),
  setVolume: (volume) => set({ volume })
}));
