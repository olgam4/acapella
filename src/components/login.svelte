<script lang="ts">
  import { settings } from "../stores/settings/store.svelte";

  let loggedIn = $derived.by(() => settings.token !== "");

  let serverUrl = $state("");
  let username = $state("");
  let password = $state("");

  const login = async (e: Event) => {
    e.preventDefault();
    settings.login(username, password, serverUrl);
  };
</script>

{#if !loggedIn}
  <main class="login">
    <form onsubmit={login}>
      <label>
        <p>Server URL</p>
        <input bind:value={serverUrl} type="text" placeholder="http://" />
      </label>
      <label>
        <p>Username</p>
        <input bind:value={username} type="text" />
      </label>
      <label>
        <p>Password</p>
        <input bind:value={password} type="password" />
      </label>

      <button type="submit">
        <span>Login</span>
        <iconify-icon icon="carbon:arrow-right"></iconify-icon>
      </button>
    </form>
  </main>
{/if}

<style scoped>
  main {
    background-color: #fff;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;

    form {
      display: flex;
      flex-direction: column;
      background-color: var(--pale);
      border-radius: 1rem;
      padding: 1rem;
    }

    button {
      display: flex;
      width: 100px;
      padding: 0.5rem;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
      background-color: var(--main-color);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      align-self: end;
    }

    label {
      margin: 0.5rem;
      display: flex;

      input {
        margin-left: 0.5rem;
        flex: 1;
        background-color: transparent;
        border: none;
        text-align: right;

        &:focus-within {
          outline: none;
        }
      }
      p {
        margin: 0;
      }
    }
  }
</style>
