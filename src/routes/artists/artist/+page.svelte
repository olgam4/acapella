<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import type { Artist } from "../../../stores/music/music";
  import { getArtist } from "../../../stores/music/store.svelte";
  import { nowPlaying, play } from "../../../stores/now-playing/store.svelte";
  import { next, queue } from "../../../stores/queue/store.svelte";

  const artistId = page.url.searchParams.get("id") as string;

  const artist = getArtist(artistId) as Artist;
  if (!artist) {
    goto("/artists");
  }

  const albumQty = $derived(artist.albums.length);
  const songQty = $derived.by(() => {
    return artist.albums.reduce((acc, album) => {
      return acc + album.songs.length;
    }, 0);
  });

  const queueArist = () => {
    queue.clear();
    queue.enqueue(artist.albums.flatMap((album) => album.songs).sort(() => 0.5 - Math.random()));
    next();
  };
</script>

<main>
  <div class="image-container">
    <img src={artist.artistImageUrl} alt={artist.name} />
  </div>

  <h1>{artist.name}</h1>

  <div class="actions">
    <button onclick={queueArist}>
      <p>Random</p>
      <iconify-icon icon="carbon:shuffle"></iconify-icon>
    </button>
  </div>

  <p class="info">
    {albumQty} album{albumQty > 1 ? "s" : ""} ⦁ {songQty} song{songQty > 1
      ? "s"
      : ""}
  </p>

  <ul>
    {#each artist.albums as album}
      <li class="album">
        <a class="album-name" href={`/albums/album?id=${album.id}`}
          >{album.name}</a
        >
        <ul>
          {#each album.songs as song}
            <li class="song">
              <button class="song-name" onclick={() => play(song)}
                ><p>{song.title}</p></button
              >
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
  <div class="buffer"></div>
</main>

<style scoped>
  main {
    margin: 12px;
  }

  h1 {
    font-size: 2rem;
    margin-block: 0.5rem;
    font-weight: 600;
    color: var(--main-color);
    text-align: center;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-block: 1rem;

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-inline: 0.5rem;
      padding-block: 0.25rem;
      font-size: 1.3rem;
      border: 2px solid var(--main-color);
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;

      [icon] {
        color: var(--secondary-off-color);
      }
    }
  }

  .album {
    margin-block: 1rem;

    button {
      width: 100%;
      height: 100%;
    }
  }

  .album-name {
    font-size: 1.2rem;
    color: var(--secondary-color);
  }

  .song {
    margin-block: 0.5rem;
    padding-left: 1rem;
    margin-left: 0.5ch;
    border-left: 4px solid var(--secondary-off-color);

    button {
      width: 100%;
      height: 100%;
    }
  }

  .song-name {
    font-size: 1rem;
  }

  .info {
    color: var(--gray);
    font-size: 0.9rem;
  }

  .image-container {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-inline: 4rem;

    img {
      width: 100%;
    }
  }
</style>
