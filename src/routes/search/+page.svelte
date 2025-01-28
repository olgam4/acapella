<script lang="ts">
  import MiniSearch, { type SearchResult } from "minisearch";
  import {
    getAlbums,
    getArtists,
    getSongs,
    url,
  } from "../../stores/music/store.svelte";
  import { goto } from "$app/navigation";
  const minisearchArtistInstance = new MiniSearch({
    fields: ["name"],
    storeFields: ["id", "name", "artistImageUrl"],
  });

  const minisearchAlbumInstance = new MiniSearch({
    fields: ["name", "artist"],
    storeFields: ["id", "name", "coverArt"],
  });

  const minisearchSongInstance = new MiniSearch({
    fields: ["title", "artist"],
    storeFields: ["albumId", "title", "coverArt"],
  });

  let searchTerm: string = $state("");
  let songs: SearchResult[] = $state([]);
  let albums: SearchResult[] = $state([]);
  let artists: SearchResult[] = $state([]);

  $effect(() => {
    minisearchSongInstance.removeAll();
    minisearchAlbumInstance.removeAll();
    minisearchArtistInstance.removeAll();

    minisearchSongInstance.addAll(getSongs());
    minisearchAlbumInstance.addAll(getAlbums());
    minisearchArtistInstance.addAll(getArtists());
  });

  $effect(() => {
    if (!minisearchSongInstance) return;
    if (!searchTerm) return;
    const results = minisearchSongInstance.search(searchTerm, { fuzzy: 0.2 });

    songs = results.slice(0, 3);
  });

  $effect(() => {
    if (!minisearchAlbumInstance) return;
    if (!searchTerm) return;
    const results = minisearchAlbumInstance.search(searchTerm, { fuzzy: 0.2 });

    albums = results.slice(0, 3);
  });

  $effect(() => {
    if (!minisearchArtistInstance) return;
    if (!searchTerm) return;
    const results = minisearchArtistInstance.search(searchTerm, { fuzzy: 0.2 });

    artists = results.slice(0, 3);
  });
</script>

<main>
  <div class="search">
    <div class="icon">
      <iconify-icon icon="carbon:search"></iconify-icon>
    </div>
    <input
      bind:value={searchTerm}
      type="text"
      name="search"
      placeholder="Search"
    />
  </div>

  {#if searchTerm}
    <div class="results">
      {#if songs.length > 0}
        <h2>Songs</h2>
        <ul>
          {#each songs as song}
            <li>
              <div class="image-container">
                <img
                  src={url("getCoverArt", [`id=${song.coverArt}`])}
                  alt={song.title}
                />
              </div>
              <button onclick={() => goto(`/albums/album?id=${song.albumId}`)}>
                <p>
                  {song.title}
                </p>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  {#if searchTerm}
    <div class="results">
      {#if albums.length > 0}
        <h2>Albums</h2>
        <ul>
          {#each albums as album}
            <li>
              <div class="image-container">
                <img
                  src={url("getCoverArt", [`id=${album.coverArt}`])}
                  alt={album.name}
                />
              </div>
              <button onclick={() => goto(`/albums/album?id=${album.id}`)}>
                <p>
                  {album.name}
                </p>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  {#if searchTerm}
    <div class="results">
      {#if artists.length > 0}
        <h2>Artists</h2>
        <ul>
          {#each artists as artist}
            <li>
              <div class="image-container">
                <img
                  src={artist.artistImageUrl}
                  alt={artist.name}
                />
              </div>
              <button onclick={() => goto(`/artists/artist?id=${artist.id}`)}>
                <p>{artist.name}</p>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  <div class="buffer"></div>
</main>

<style scoped>
  .search {
    position: relative;
    width: 100%;
    height: 100%;
  }

  input {
    padding: 0.5rem;
    padding-inline-start: 2.5rem;
    background: var(--pale);
    border: none;
    border-radius: 0.5rem;
    margin-inline: 0.5rem;
    margin-block: 0.5rem;
    width: calc(100% - 1rem);
  }

  .icon {
    position: absolute;
    top: 50%;
    left: 1rem;
    font-weight: bold;
    transform: translateY(-50%);
    color: var(--secondary-off-color);
  }

  h2 {
    margin: 0.5rem;
    font-size: 0.8rem;
    color: var(--gray);
  }

  li {
    display: flex;
    align-items: center;
    margin: 0.5rem;
    gap: 0.5rem;
    padding-block: 0.5rem;

    .image-container {
      width: 44px;
      height: 44px;

      img {
        width: 100%;
        height: 100%;
      }
    }

    button {
      width: 80%;
      text-align: left;
    }
  }
</style>
