<script lang="ts">
  import {
    getArtists,
    getAlbums,
    getSongs,
    getLoading,
    doScan,
  } from "../../stores/music/store.svelte";
  import { settings } from "../../stores/settings/store.svelte";
  import { getVersion } from "@tauri-apps/api/app";

  let loading = $derived(() => getLoading().loadingSongs);
  let password = $state("");
  let server = $state(settings.server);
</script>

<main>
  <h1>Settings</h1>
  <h2>ACAPELLA</h2>
  <form>
    <label>
      <p>Version</p>
      {#await getVersion() then value}
        <input value={value} disabled />
      {/await}
    </label>
  </form>
  <h2>SERVER DETAILS</h2>
  <form>
    <label>
      <p>Server URL</p>
      <input
        bind:value={server}
        type="text"
        onblur={() => settings.save()}
        placeholder="http://"
      />
    </label>
    <label>
      <p>User</p>
      <input type="text" value={settings.user} onblur={settings.save} />
    </label>
    <label>
      <p>Password</p>
      <input type="password" bind:value={password} />
    </label>
  </form>

  <h2>SYNC</h2>
  <form>
    <label>
      <p>Artists</p>
      {#if getLoading().loadingArtists}
        <input value="?" disabled />
      {:else}
        <input value={getArtists().length} disabled />
      {/if}
    </label>
    <label>
      <p>Albums</p>
      {#if getLoading().loadingAlbums}
        <input value="?" disabled />
      {:else}
        <input value={getAlbums().length} disabled />
      {/if}
    </label>
    <label>
      <p>Songs</p>
      {#if getLoading().loadingSongs}
        <input value="?" disabled />
      {:else}
        <input value={getSongs().length} disabled />
      {/if}
    </label>
    <div class="action">
      <button onclick={doScan}>
        {#if loading()}
          <iconify-icon icon="line-md:loading-twotone-loop"> </iconify-icon>
        {:else}Scan{/if}
      </button>
    </div>
  </form>
  <form>
    <div class="action">
      <button onclick={settings.reset}>
        {#if loading()}
          <iconify-icon icon="line-md:loading-twotone-loop"> </iconify-icon>
        {:else}Log out{/if}
      </button>
    </div>
  </form>
</main>

<style scoped>
  main {
    h1 {
      color: var(--secondary-color);
      font-size: 2rem;
      margin-block-start: 0.5rem;
      font-weight: 600;
    }

    h2 {
      color: var(--secondary-off-color);
    }

    padding: 1rem;

    display: flex;
    flex-direction: column;
    gap: 1rem;

    form {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;

      background: var(--pale);
      border-radius: 0.5rem;

      button {
        padding-inline: 0.5rem;
        padding-block: 0.25rem;
        background: var(--main-color);
        border: none;
        border-radius: 0.5rem;
      }

      .action {
        display: flex;
        justify-content: flex-end;
      }

      p {
        color: var(--gray);
        font-size: 0.9rem;
      }

      label {
        display: flex;
        gap: 0.5rem;
        align-items: center;

        padding-block: 0.5rem;

        [icon] {
          margin-left: auto;
          height: 1em;
        }

        input {
          flex: 1;
          background: none;
          border: none;
          text-align: right;

          &:focus-within {
            outline: none;
          }

          &:disabled {
            color: var(--text-color);
            opacity: 1;
          }
        }

        &:not(:last-child):not(:has(+ .action)) {
          border-bottom: 1px solid var(--gray);
        }
      }
    }
  }
</style>
