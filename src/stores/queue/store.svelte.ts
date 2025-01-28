import type { Song } from "../music/music";
import { play } from "../now-playing/store.svelte";

class Queue {
  #songs: Array<Song> = $state([] as Array<Song>);

  get songs(): Array<Song> {
    return this.#songs.toReversed();
  }

  push(song: Song) {
    this.#songs.push(song);
  }

  enqueue(songs: Array<Song>) {
    this.#songs = this.#songs.concat(songs.reverse());
  }

  unshift(song: Song) {
    this.#songs.unshift(song);
  }

  clear() {
    this.#songs = [];
  }

  pop(): Song | undefined {
    return this.#songs.pop();
  }

  remove(song: Song) {
    this.#songs = this.#songs.filter((s) => s.id !== song.id);
  }

  removeIndex(index: number) {
    this.#songs.splice(index, 1);
  }

  get length() {
    return this.#songs.length;
  }
}

export const queue = $state(new Queue());
export const next = () => {
  const song = queue.pop();
  if (song) play(song);
}
