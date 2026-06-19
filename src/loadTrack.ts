import type { Track } from "./types";

export default async function loadTrack(): Promise<Track> {
  return {
    title: "hoge",
    bpm: 10,
    notes: [
      { lane: 0, pos: 10 },
      { lane: 0, pos: 20 },
      { lane: 0, pos: 30 },
    ],
  }
}
