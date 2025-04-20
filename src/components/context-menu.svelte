<script lang="ts">
  import { nowPlaying } from "../stores/now-playing/store.svelte";
  import { contextMenu } from "../stores/context-menu/store.svelte";
</script>

<div
  class="context-menu"
  style:--id={`--song-${nowPlaying.acappellaId}`}
  style:display={contextMenu.opened ? "block" : "none"}
>
  hello
</div>

<style scoped>
  .context-menu {
    position: absolute;
    position-anchor: var(--id);
    position-area: block-start;
    position-try: flip-block;
    max-inline-size: 20em;

    background: red;

    z-index: 9999;
  }
</style>
