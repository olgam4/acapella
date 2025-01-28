<script lang="ts">
  import VirtualList from "svelte-tiny-virtual-list";
  import ListItem from "../../components/list.element.svelte";
  import { getSongs, url } from "../../stores/music/store.svelte";
  import { play } from "../../stores/now-playing/store.svelte";
  import { innerHeight } from "svelte/reactivity/window";

  const height = $derived(innerHeight.current || 0);
</script>

<div>
  <div class="list">
    <VirtualList {height} itemCount={getSongs().length + 3} itemSize={54}>
      <div slot="item" let:index let:style {style}>
        {#if getSongs()[index]}
          <ListItem
            title={getSongs()[index].title}
            img={url("getCoverArt", [`id=${getSongs()[index].coverArt}`])}
            navigate={() => play(getSongs()[index])}
          />
        {:else}
          <div style="height: 54px"></div>
        {/if}
      </div>
    </VirtualList>
  </div>
</div>

<style scoped>
  div {
    overflow-x: hidden;
  }
  .list {
    margin: 12px;
  }
</style>
