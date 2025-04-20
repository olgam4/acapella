<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { press, type PressCustomEvent } from "svelte-gestures";
  import type { Album } from "../../../stores/music/music";
  import { getAlbum, url } from "../../../stores/music/store.svelte";
  import {
    nowPlaying,
    playAlbum,
  } from "../../../stores/now-playing/store.svelte";
  import { contextMenu } from "../../../stores/context-menu/store.svelte";

  const albumId = page.url.searchParams.get("id") as string;

  const album = getAlbum(albumId) as Album;
  if (!album) {
    goto("/albums");
  }

  const songQty = $derived(album.songs.length);
  const year = $derived(parseInt(album.year));

  const isPlaying = (acappellaId: string) => {
    return acappellaId === nowPlaying.acappellaId && nowPlaying.playing;
  };

  const longPressHandler = (e: PressCustomEvent) => {
    console.log(e);
    contextMenu.opened = true;
  };
</script>

<main>
  <button class="back" onclick={() => history.back()} aria-label="back"
    ><iconify-icon icon="carbon:chevron-left"></iconify-icon></button
  >
  <div class="image-container">
    <img src={url("getCoverArt", [`id=${album.coverArt}`])} alt={album.name} />
  </div>
  <h1>{album.name}</h1>
  <button onclick={() => goto(`/artists/artist?id=${album.artistId}`)}
    ><h2>{album.artist}</h2></button
  >
  <p class="info">{year} ⦁ {songQty} song{songQty > 1 ? "s" : ""}</p>
  <ul>
    {#each album.songs as song}
      <li class="song" style:--id={`--song-${song.acappellaId}`}>
        <button
          class="song-name"
          onclick={() => playAlbum(song, album)}
          onpress={longPressHandler}
          use:press={() => ({ timeframe: 300, triggerBeforeFinished: false })}
        >
          {#if isPlaying(song.acappellaId)}
            <div class="synth">
              <div class="bar1"></div>
              <div class="bar2"></div>
              <div class="bar3"></div>
            </div>
          {:else}
            <div class="track">
              {song?.track?.toString().split(".")[0] || "_"}
            </div>
          {/if}
          <p>{song.title}</p></button
        >
      </li>
    {/each}
  </ul>
  <div class="buffer"></div>
</main>

<style scoped>
  .back {
    font-size: 1.2rem;
    color: var(--secondary-color);
  }

  .info {
    color: var(--gray);
    font-size: 0.9rem;
  }

  main {
    margin: 12px;
  }

  .image-container {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-inline: 4rem;
  }

  .song {
    margin-block: 1rem;
    height: 1.6rem;
    anchor-name: var(--id);
    p {
      user-select: none;
    }
  }

  .song-name {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    gap: 0.5rem;
  }

  .synth {
    width: 1.2rem;
    height: 1rem;
    margin-inline: 0.4rem;

    display: flex;
    justify-content: space-between;
    gap: 0.1rem;

    overflow: hidden;

    .bar1,
    .bar2,
    .bar3 {
      width: 100%;
      height: 100%;
      background-color: var(--secondary-off-color);

      animation-name: up-down, color-change;
      animation-iteration-count: infinite;
    }

    .bar1 {
      animation-delay: 0.1s;
      animation-duration: 1s;
    }

    .bar2 {
      animation-delay: 0.3s;
      animation-duration: 1.2s;
    }

    .bar3 {
      animation-delay: 0.7s;
      animation-duration: 1s;
    }
  }

  @keyframes up-down {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(0.5rem);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes color-change {
    0% {
      background-color: var(--secondary-off-color);
    }

    33% {
      background-color: var(--main-color);
    }

    66% {
      background-color: var(--secondary-color);
    }

    100% {
      background-color: var(--secondary-off-color);
    }
  }

  .track {
    color: var(--secondary-off-color);
    font-size: 0.9rem;
    width: 1rem;
    text-align: right;
    margin-inline: 0.5rem;
  }

  h1 {
    font-size: 2rem;
    margin-block-start: 0.5rem;
    font-weight: 600;
    color: var(--main-color);
    text-align: center;
  }

  h2 {
    font-size: 1.2rem;
    margin-block-end: 0.5rem;
    color: var(--secondary-color);
    text-align: center;
  }

  button:has(h2) {
    width: 100%;
  }

  img {
    width: 100%;
  }
</style>
