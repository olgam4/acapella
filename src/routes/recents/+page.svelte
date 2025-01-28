<script lang="ts">
  import ListItem from "../../components/list.element.svelte";
  import { getRecentlyPlayed, url } from "../../stores/music/store.svelte";
  import { goto } from "$app/navigation";
  import VirtualList from "svelte-tiny-virtual-list";
  import { innerHeight } from "svelte/reactivity/window";

  const height = $derived(innerHeight.current || 0);
</script>

<main>
  <h1>Recently played</h1>
  <div class="list">
    <VirtualList
      height={height - 140}
      itemCount={getRecentlyPlayed().length + 4}
      itemSize={54}
    >
      <div class="item" slot="item" let:index let:style {style}>
        {#if getRecentlyPlayed()[index]}
          <ListItem
            title={getRecentlyPlayed()[index].name}
            img={url("getCoverArt", [
              `id=${getRecentlyPlayed()[index].coverArt}`,
            ])}
            navigate={() =>
              goto(`/albums/album?id=${getRecentlyPlayed()[index].id}`)}
          />
        {:else}
          <div style="height: 54px"></div>
        {/if}
      </div>
    </VirtualList>
  </div>
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

  .list {
    position: relative;
    .item {
      padding-inline-end: 1rem;
    }
  }
</style>
