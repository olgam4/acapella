<script lang="ts">
  import { queue, next } from "../stores/queue/store.svelte";
  import { nowPlaying } from "../stores/now-playing/store.svelte";
  import { url } from "../stores/music/store.svelte";

  import PrograssBar from "./prograss-bar.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fade, fly, scale, slide } from "svelte/transition";

  const metadata = $derived.by(() => {
    if (!nowPlaying.song) return null;

    return new MediaMetadata({
      title: nowPlaying.song.title,
      artist: nowPlaying.song.artist,
      album: nowPlaying.song.album,
      artwork: [
        {
          src: url("getCoverArt", [
            `id=${nowPlaying.song.coverArt}`,
            "size=96x96",
          ]),
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: url("getCoverArt", [
            `id=${nowPlaying.song.coverArt}`,
            "size=128x128",
          ]),
          sizes: "128x128",
          type: "image/png",
        },
        {
          src: url("getCoverArt", [
            `id=${nowPlaying.song.coverArt}`,
            "size=192x192",
          ]),
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: url("getCoverArt", [
            `id=${nowPlaying.song.coverArt}`,
            "size=256x256",
          ]),
          sizes: "256x256",
          type: "image/png",
        },
        {
          src: url("getCoverArt", [
            `id=${nowPlaying.song.coverArt}`,
            "size=384x384",
          ]),
          sizes: "384x384",
          type: "image/png",
        },
        {
          src: url("getCoverArt", [
            `id=${nowPlaying.song.coverArt}`,
            "size=512x512",
          ]),
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
  });

  function skip() {
    next();
  }

  function start() {
    nowPlaying.play();
  }

  function pause() {
    nowPlaying.pause();
  }

  function back() {
    nowPlaying.back();
  }

  function seek() {
    //nowPlaying.next();
  }

  $effect(() => {
    if (!metadata) return;
    if (!navigator?.mediaSession) return;

    navigator.mediaSession.metadata = metadata;
  });

  onMount(() => {
    navigator.mediaSession.setActionHandler("play", () => {
      start();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      back();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      next();
    });
  });

  let fullscreen = $state(false);
  let mode = $state("widget");

  function canGoNext() {
    return queue.length > 0;
  }
</script>

{#if fullscreen}
  <main
    style="background-image: url({nowPlaying.coverArtSource}); background-size: cover;"
    transition:fly={{ y: "100%", opacity: 1 }}
  >
    <div class="content">
      <button
        onclick={() => (fullscreen = false)}
        aria-label="close fullscreen"
      >
        <div class="close-tray-icon"></div>
      </button>
      {#if mode === "queue"}
        <div class="queue" transition:slide>
          <h2>Playing Next</h2>
          <ul class="queue-list">
            {#each queue.songs as song}
              <li>
                <p>{song.title}</p>
                <p>{song.artist}</p>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="widget" transition:fade>
          <div class="image-container">
            <button
              onclick={() => {
                fullscreen = false;
                goto(`/albums/album?id=${nowPlaying.song?.albumId}`);
              }}
            >
              <img alt="cover" src={nowPlaying.coverArtSource} />
            </button>
          </div>
          <div>
            <button
              onclick={() => {
                fullscreen = false;
                goto(`/artists/artist?id=${nowPlaying.song?.artistId}`);
              }}
            >
              <p class="title">{nowPlaying.song?.title}</p>
              <p class="artist">{nowPlaying.song?.artist}</p>
            </button>
          </div>
          <div class="controls">
            <button onclick={back} class="back" aria-label="back">
              <iconify-icon icon="carbon:skip-back-filled"></iconify-icon>
            </button>
            {#if nowPlaying.playing}
              <button onclick={pause} class="pause" aria-label="pause">
                <iconify-icon icon="carbon:pause-filled"></iconify-icon>
              </button>
            {:else}
              <button onclick={start} class="play" aria-label="play">
                <iconify-icon icon="carbon:play-filled-alt"></iconify-icon>
              </button>
            {/if}
            <button
              onclick={skip}
              disabled={!canGoNext()}
              class="skip"
              aria-label="skip"
            >
              <iconify-icon icon="carbon:skip-forward-filled"></iconify-icon>
            </button>
          </div>

          <div class="progress-bar">
            <PrograssBar
              {seek}
              max={nowPlaying.duration}
              value={nowPlaying.position}
            />
          </div>
        </div>
      {/if}
      <div class="actions">
        <button onclick={() => (fullscreen = false)} aria-label="close">
          <iconify-icon icon="carbon:media-cast"></iconify-icon>
        </button>
        <button
          onclick={() => (mode = mode === "queue" ? "widget" : "queue")}
          aria-label="close"
        >
          {#if mode === "queue"}
            <iconify-icon icon="carbon:music"></iconify-icon>
          {:else}
            <iconify-icon icon="carbon:playlist"></iconify-icon>
          {/if}
        </button>
      </div>
    </div>
  </main>
{/if}

{#if nowPlaying.song && !fullscreen}
  <div class="widget playing">
    <button
      class="cover"
      onclick={() => (fullscreen = true)}
      aria-label="open fullscreen"
    >
      <img alt="cover" src={nowPlaying.coverArtSource} />
    </button>

    <button onclick={() => (fullscreen = true)} class="info">
      <p class="title">{nowPlaying.song?.title}</p>
      <p class="artist">{nowPlaying.song?.artist}</p>
    </button>

    {#if nowPlaying.playing}
      <button onclick={pause} class="pause" aria-label="pause">
        <iconify-icon transition:scale icon="carbon:pause-filled"
        ></iconify-icon>
      </button>
    {:else}
      <button onclick={start} class="play" aria-label="play">
        <iconify-icon transition:scale icon="carbon:play-filled-alt"
        ></iconify-icon>
      </button>
    {/if}
  </div>
{/if}

<style scoped>
  .play,
  .pause,
  .skip,
  .back {
    &:disabled {
      color: var(--gray);
    }
  }
  .skip,
  .back {
    font-size: 1.2rem;
    color: var(--secondary-off-color);
  }

  .play,
  .pause {
    font-size: 1.8rem;
    color: var(--main-color);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  main {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;

    .title {
      font-weight: 600;
      font-size: 1.2rem;
      color: var(--main-color);
      text-align: center;
    }

    .artist {
      font-size: 0.9rem;
      color: var(--pale);
      text-align: center;
    }

    .widget {
      position: relative;
      display: flex;
      align-items: center;
      flex-direction: column;
      align-self: center;
      margin: auto;
      background: rgba(255, 251, 234, 0.1);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.18);

      width: 80%;
      padding-top: 60px;
      padding-inline: 20px;
      top: 15%;
    }

    .content {
      backdrop-filter: blur(100px) brightness(0.65);
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      flex-direction: column;
    }

    .image-container {
      position: absolute;
      margin-block: 1rem;
      width: 80%;
      overflow: hidden;
      bottom: 70%;

      img {
        width: 100%;
      }
    }

    .progress-bar {
      margin-block-end: 1rem;
      width: 100%;
    }

    .close-tray-icon {
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      top: 60px;
      margin-block: 1rem;
      width: 2rem;
      height: 0.5rem;
      border-radius: 9999px;
      background: #fff;
      opacity: 0.4;
    }

    .actions {
      position: absolute;
      bottom: 0;
      display: flex;
      width: 80%;
      padding-inline: 0.5rem;
      padding-block: 0.25rem;
      background: rgba(255, 251, 234, 0.1);
      justify-content: space-around;
      align-items: center;
      margin-block-end: 5rem;
      border-radius: 10px;

      button {
        padding: 0.5rem;
        border-radius: 50%;
        border: none;
        background: none;
        cursor: pointer;

        font-size: 1.5rem;
        color: var(--main-color);
      }
    }

    .queue {
      position: absolute;
      top: 100px;
      width: 80%;
      padding-inline: 0.5rem;
      padding-block: 0.25rem;
      background: rgba(255, 251, 234, 0.1);
      border-radius: 10px;

      h2 {
        color: var(--main-color);
        font-weight: 600;
        font-size: 1.2rem;
      }

      ul {
        margin-block: 0.5rem;
        height: 500px;
        overflow-y: scroll;
      }

      li {
        display: flex;
        font-weight: 500;
        justify-content: space-between;
        margin-block: 0.5rem;

        p {
          max-width: 50%;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
      }
    }
  }

  .playing.widget {
    display: flex;
    position: absolute;
    height: 70px;
    left: 12px;
    right: 12px;
    bottom: 12%;
    padding: 0.2rem;
    padding-inline: 20px;
    z-index: 9999;
    align-items: center;

    background: rgba(255, 251, 234, 0.7);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    backdrop-filter: blur(9px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);

    .cover {
      background: none;
      border: none;
      cursor: pointer;
      width: 80px;
      height: 80px;
      top: -20px;
      padding: 0;
      margin: 0;
      position: absolute;
    }

    img {
      width: 100%;
      height: 100%;
    }

    .play,
    .pause {
      border-radius: 100%;
      background: white;
      padding: 0.6rem;
      margin-inline-start: auto;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);

    }

    .info {
      margin-inline-start: calc(70px + 1rem);
      max-width: calc(100% - 70px - 5rem);
      display: flex;
      flex-direction: column;
      justify-content: center;

      p {
        width: 100%;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }

      .title {
        font-weight: 600;
        font-size: 1rem;
        color: var(--main-color);
      }

      .artist {
        font-size: 0.9rem;
        color: var(--secondary-color);
      }
    }
  }
</style>
