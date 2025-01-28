<script lang="ts">
  import {
    getRandomAlbums,
    getRandomArtists,
    getRandomSongs,
    getRecentlyPlayed,
  } from "../stores/music/store.svelte";
  import HomeCategory from "../components/home-category.svelte";
  import { goto } from "$app/navigation";

</script>

<main>
  <HomeCategory
    access={() => goto("/artists")}
    list={getRandomArtists()}
    title="Artists"
    type="artist"
  />
  <HomeCategory
    access={() => goto("/albums")}
    list={getRandomAlbums()}
    title="Albums"
    type="album"
  />
  <HomeCategory
    access={() => goto("/recents")}
    list={getRecentlyPlayed().slice(0, 10)}
    title="Recently played"
    type="album"
  />
  <HomeCategory
    access={() => {}}
    list={getRandomSongs()}
    title="Random"
    type="song"
  />
  <div class="buffer"></div>
</main>
