<script lang="ts">
  import ListItem from "../../components/list.element.svelte";
  import { getArtists } from "../../stores/music/store.svelte";
  import { goto } from "$app/navigation";
  import VirtualList from "svelte-tiny-virtual-list";
  import { innerHeight } from "svelte/reactivity/window";

  const height = $derived(innerHeight.current || 0);

  let scrollToIndex = $state(0);

  const letters = [
    "#",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "漢",
  ];

  const getIndexOfFirstElementStartingWithLetter = (letter: string) => {
    const index = getArtists().findIndex((artist) => {
      return artist.name.startsWith(letter);
    });

    if (letter === "漢") {
      scrollToIndex = getArtists().length;
    } else {
      scrollToIndex = index === -1 ? 0 : index;
    }
  };
  
  const dragOnIndex = (e: TouchEvent) => {
    const element = document.elementFromPoint(
      e.touches[0].clientX,
      e.touches[0].clientY,
    );
    if (!element) return;
    const letter = element.getAttribute("data-letter");
    if (!letter) return;

    getIndexOfFirstElementStartingWithLetter(
      element.getAttribute("data-letter") as string,
    );
  };
</script>

<main>
  <button
  onclick={() => history.back()}
    ><h1><iconify-icon icon="carbon:chevron-left"></iconify-icon> Artists</h1></button
  >
  <div class="list">
    <VirtualList
      height={height - 140}
      itemCount={getArtists().length + 4}
      itemSize={54}
      {scrollToIndex}
      scrollToAlignment="start"
    >
      <div class="item" slot="item" let:index let:style {style}>
        {#if getArtists()[index]}
          <ListItem
            title={getArtists()[index].name}
            img={getArtists()[index].artistImageUrl}
            navigate={() =>
              goto(`/artists/artist?id=${getArtists()[index].id}`)}
          />
        {:else}
          <div style="height: 54px"></div>
        {/if}
      </div>
    </VirtualList>
    <div class="index" ontouchmove={dragOnIndex}>
      {#each letters as letter}
        <div>
          <button
            data-letter={letter}
            class="letter">{letter}</button
          >
        </div>
      {/each}
    </div>
  </div>
</main>

<style scoped>
  main {
    overflow: hidden;
    margin: 12px;
  }

  h1 {
    display: flex;
    align-items: center;
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

  .index {
    position: absolute;
    right: 0;
    top: 11%;
    color: var(--secondary-off-color);
    text-align: center;
    font-size: 0.75rem;
    width: 1rem;
    z-index: 1;
  }
</style>
