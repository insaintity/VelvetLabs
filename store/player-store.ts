"use client";

import { create } from "zustand";
import { tracks } from "@/lib/demo-data";

type PlayerState = {
  currentTrackId: string;
  isPlaying: boolean;
  positionSeconds: number;
  volume: number;
  setTrack: (trackId: string) => void;
  togglePlaying: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrackId: tracks[0].id,
  isPlaying: false,
  positionSeconds: 84,
  volume: 78,
  setTrack: (trackId) => set({ currentTrackId: trackId, positionSeconds: 0, isPlaying: true }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  seek: (seconds) => set({ positionSeconds: seconds }),
  setVolume: (volume) => set({ volume }),
  next: () => {
    const index = tracks.findIndex((track) => track.id === get().currentTrackId);
    const nextTrack = tracks[(index + 1) % tracks.length];
    set({ currentTrackId: nextTrack.id, positionSeconds: 0, isPlaying: true });
  },
  previous: () => {
    const index = tracks.findIndex((track) => track.id === get().currentTrackId);
    const nextTrack = tracks[(index - 1 + tracks.length) % tracks.length];
    set({ currentTrackId: nextTrack.id, positionSeconds: 0, isPlaying: true });
  }
}));
