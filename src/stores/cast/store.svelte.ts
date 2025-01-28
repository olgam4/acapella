import { invoke } from "@tauri-apps/api/core";
import { nowPlaying } from "../now-playing/store.svelte";

let casts = $state([] as Array<any>),
  error = $state("");

const getChromecasts = async () => {
  try {
    casts = await invoke("discover_cast_devices");
  } catch (_) {
    error = "Failed to get chromecasts";
  }
};

const connectToChromecast = async (cast: any) => {
  return await invoke("connect_to_cast_device", { addr: cast[1] });
};

const start = async () =>
  await invoke("cast_audio", { audioSource: nowPlaying.source });

const bypass = async () => await invoke("bypass");
