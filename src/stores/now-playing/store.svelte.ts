import { invoke } from "@tauri-apps/api/core";
import type { Album, Song } from "../music/music";
import { updateRecentlyPlayed, url } from "../music/store.svelte";
import { next, queue } from "../queue/store.svelte";
import { setInterval, clearInterval } from "worker-timers";
import { listen } from "@tauri-apps/api/event";

class NowPlaying {
  acappellaId: string | undefined = $derived.by(() => this.song?.acappellaId)
  #song: Song | undefined = $state(undefined)
  #playing: boolean = $state(false)
  #paused: boolean = $state(false)
  #position: number = $state(0)
  #scrobbled: boolean = $state(false)
  #duration: number = $derived.by(() => this.song?.duration || 0)
  #source: string = $derived.by(() => url("stream", [`id=${this.#song?.id}`, `format=raw`]))
  #coverArtSource: string = $derived.by(() => url("getCoverArt", [`id=${this.#song?.coverArt}`]))
  sourceMp3: string = $derived.by(() => url("stream", [`id=${this.#song?.id}`, `format=mp3`]))
  interval: number | undefined

  get song(): Song | undefined {
    return this.#song
  }

  set song(song: Song) {
    this.reset();
    this.#song = song
  }

  removeSong() {
    this.reset()
    this.#song = undefined
  }

  get duration() {
    return this.#duration
  }

  get playing() {
    return this.#playing
  }

  set playing(playing: boolean) {
    this.#playing = playing
  }

  get position() {
    return this.#position
  }

  set position(position: number) {
    this.#position = position
  }

  get source() {
    return this.#source
  }

  get coverArtSource() {
    return this.#coverArtSource
  }

  async play() {
    this.playing = true

    this.interval = setInterval(async () => {
      this.position += 1
      const timeRemaining = await invoke('time_remaining')
      if (!timeRemaining && this.position >= 15) {
        next();
        this.playing = false
      }

      if (this.position >= (this.song?.duration || 30) / 2 && !this.#scrobbled) {
        await fetch(url("scrobble", [`id=${this.song?.id}`, `submission=true`]))
        this.#scrobbled = true
      }
    }, 1000)

    if (this.#paused) {
      await invoke("resume_audio")
    } else {
      await invoke("play_audio", {
        audioSource: this.source,
        artist: this.song?.artist,
        album: this.song?.album,
        title: this.song?.title,
        cover: this.coverArtSource,
        duration: this.song?.duration.toString(),
      })
    }

    this.#paused = false
  }

  pause() {
    this.clearInterval()

    this.playing = false
    this.#paused = true

    invoke("pause_audio")
  }

  reset() {
    this.clearInterval()

    this.playing = false
    this.#paused = false
    this.#scrobbled = false
    this.position = 0

    invoke("reset_audio")
  }

  back() {
    this.position = 0
  }

  clearInterval() {
    this.interval && clearInterval(this.interval)
  }

  seek(position: number) {
    this.position = position
  }
}

export const nowPlaying: NowPlaying = $state(new NowPlaying())

export async function play(song: Song) {
  nowPlaying.reset()
  nowPlaying.song = song
  nowPlaying.play()

  await updateRecentlyPlayed(song)
}

export function playAlbum(song: Song, album: Album) {
  queue.clear()
  play(song)
  const songsAfterCurrent = album.songs.slice(album.songs.indexOf(song) + 1)
  queue.enqueue(songsAfterCurrent)
}

listen("next-track", () => {
  next();
})

listen("play", () => {
  nowPlaying.play();
})

listen("pause", () => {
  nowPlaying.pause();
})
