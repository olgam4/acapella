<script lang="ts">
  import "@oddbird/css-anchor-positioning";
  import type { LayoutProps } from "./$types";
  import NowPlaying from "../components/playing.svelte";
  import { swipe, type SwipeCustomEvent } from "svelte-gestures";
  import { page } from "$app/state";
  import { settings } from "../stores/settings/store.svelte";
  import Login from "../components/login.svelte";

  function handler(event: SwipeCustomEvent) {
    const direction = event.detail.direction;
    const target = event.detail.target;
    const pointerType = event.detail.pointerType;

    if (direction === "right" && pointerType === "touch") {
      window.history.back();
    }
  }

  let { children, data }: LayoutProps = $props();

  function slideInFromRight(
    _: HTMLElement,
    params: {
      duration?: number;
    } = {},
  ) {
    const translate = (t: number) => `translateX(${t * 100}%)`;
    return {
      duration: params.duration || 300,
      css: (_: any, u: any) => `
      transform: ${translate(u)};
      position: absolute;
      left: 0;
      right: 0;
      `,
    };
  }

  function slideOutToLeft(
    _: HTMLElement,
    params: {
      duration?: number;
    } = {},
  ) {
    const translate = (t: number) => `translateX(-${t * 100}%)`;

    return {
      duration: params.duration || 300,
      css: (_: any, u: any) => `
      transform: ${translate(u)};
      position: absolute;
      left: 0;
      right: 0;
      `,
    };
  }
</script>

<Login></Login>

<div class="main">
  {#key data.url}
    <div in:slideInFromRight out:slideOutToLeft class="content">
      {@render children()}
    </div>
  {/key}
  <NowPlaying></NowPlaying>

  {#if settings.token !== ""}
    <nav>
      <a href="/" class={page.url.pathname === "/" ? "active" : ""}>
        <iconify-icon icon="carbon:home" style="font-size: 1.5rem"
        ></iconify-icon>
        <p>Home</p>
      </a>
      <a href="/radios" class={page.url.pathname === "/radios" ? "active" : ""}>
        <iconify-icon icon="carbon:radio" style="font-size: 1.5rem"
        ></iconify-icon>
        <p>Radios</p>
      </a>
      <a href="/search" class={page.url.pathname === "/search" ? "active" : ""}>
        <iconify-icon icon="carbon:search" style="font-size: 1.5rem"
        ></iconify-icon>
        <p>Search</p>
      </a>
      <a
        href="/settings"
        class={page.url.pathname === "/settings" ? "active" : ""}
      >
        <iconify-icon icon="carbon:settings" style="font-size: 1.5rem"
        ></iconify-icon>
        <p>Settings</p>
      </a>
    </nav>
  {/if}
</div>

<style scoped>
  .main {
    position: relative;
    height: 100vh;
    overflow: hidden;
    padding-top: 6vh;
  }

  .content {
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  nav {
    height: 10%;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    background: rgba(8, 6, 0, 0);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.18);

    display: flex;

    justify-content: space-around;
    align-items: center;

    a {
      display: flex;
      flex-direction: column;
      justify-items: center;
      align-content: center;
      transition: color 0.2s ease-in-out;

      &.active {
        color: var(--main-color);
      }
    }

    p {
      margin: 0;
      font-size: 0.5rem;
    }
  }
</style>
