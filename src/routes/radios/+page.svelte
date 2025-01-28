<script lang="ts">
  import { onMount } from "svelte";
  import { url } from "../../stores/music/store.svelte";
  import { nowPlaying } from "../../stores/now-playing/store.svelte";

  let stations: any[] = $state([]);
  let audio: HTMLAudioElement | undefined = $state();

  onMount(async () => {
    const radioStationsResult = await fetch(url("getInternetRadioStations"));
    const radioStations = await radioStationsResult.json();

    stations =
      radioStations["subsonic-response"]["internetRadioStations"][
        "internetRadioStation"
      ];
  });

  const getFavicon = (url: string) => {
    const path = new URL(url).host.replace("www.", "");
    return `https://www.faviconextractor.com/favicon/${path}`;
  };
</script>

<main>
  <h1>Radio</h1>

  <ul>
    {#each stations as station}
      <li>
        <button
          onclick={() => {
            if (!audio) return;
            nowPlaying.removeSong();
            audio.src = station.streamUrl;
            audio.play();
          }}
        >
          <div class="image-container">
            <img alt="radio logo" src={getFavicon(station.homePageUrl)} />
          </div>
          {station.name}
        </button>
      </li>
    {/each}
  </ul>

  <audio controls bind:this={audio}></audio>

  <div class="buffer"></div>
</main>

<style scoped>
  main {
    overflow: hidden;
    margin: 12px;
  }

  h1 {
    font-size: 2rem;
    margin-block: 0.5rem;
    font-weight: 600;
    color: var(--secondary-color);
  }

  ul {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-block: 0.5rem;

    li {
      button {
        display: flex;
        padding: 0.5rem;
        align-items: center;
        width: 100%;
        height: 100%;

        .image-container {
          display: flex;

          margin-right: 0.5rem;
          width: 2rem;
        }
      }
    }
  }
</style>
