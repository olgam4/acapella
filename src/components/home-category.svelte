<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Album, Artist, Song } from "../stores/music/music";
  import { url } from "../stores/music/store.svelte";
  import { play } from "../stores/now-playing/store.svelte";

  let { title, list, access, type } = $props();
</script>

{#snippet songElement(song: Song)}
  <button onclick={() => play(song)}>
    <img
      src={url("getCoverArt", [`id=${song?.coverArt}`, "size=128x128"])}
      alt={song?.title + "cover art"}
    />
    <p>{song?.title}</p>
  </button>
{/snippet}
{#snippet artistElement(artist: Artist)}
  <button onclick={() => goto(`/artists/artist?id=${artist?.id}`)}>
    <img src={artist?.artistImageUrl} alt={artist?.name + "cover art"} />
    <p>{artist?.name}</p>
  </button>
{/snippet}
{#snippet albumElmement(album: Album)}
  <button onclick={() => goto(`/albums/album?id=${album?.id}`)}>
    <img
      src={url("getCoverArt", [`id=${album?.coverArt}`, "size=128x128"])}
      alt={album?.name + "cover art"}
    />
    <p>{album?.name}</p>
  </button>
{/snippet}

<section>
  <button class="header" onclick={access}>
    <h2>{title}</h2>
    <span>
      <iconify-icon icon="carbon:chevron-right"> </iconify-icon>
    </span>
  </button>
  <ul>
    {#each list as value}
      <li>
        {#if type === "song"}
          {@render songElement(value)}
        {:else if type === "artist"}
          {@render artistElement(value)}
        {:else if type === "album"}
          {@render albumElmement(value)}
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style scoped>
  section {
    padding: 1rem;
    display: grid;
    gap: 0.5rem;

    .header {
      font-size: 1.5rem;
      display: flex;
      width: 100%;
      font-weight: 500;
      color: var(--secondary-color);

      span {
        margin-left: auto;
      }
    }
  }
  button {
    width: 140px;
    height: 100%;

    img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
    }

    p {
      overflow: hidden;
      margin-block-start: 0.5rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--secondary-off-color);
    }
  }

  ul {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: scroll;
    overflow-y: hidden;
    gap: 1rem;
    padding-block-end: 1rem;
  }
</style>
