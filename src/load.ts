import { loadFromDB } from "./stores/music/store.svelte";
import { loadSettingsFromDB } from "./stores/settings/store.svelte";

export default async () => {
  await loadFromDB();
  await loadSettingsFromDB();
}
