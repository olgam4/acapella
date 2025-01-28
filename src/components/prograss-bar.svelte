<script lang="ts">
  let { max, value, seek } = $props();

  let progress = $derived.by(() => {
    return (value / max) * 100;
  });
</script>

<button class="seek-bar" onclick={seek} aria-label="progress">
  <div class="progress" style="width: {progress}%"></div>
</button>

<style scoped>
  .seek-bar {
    height: 10px;
    background-color: var(--off-color);
    border-radius: 999px;
    cursor: pointer;
    width: 100%;

    overflow: hidden;

    .progress {
      height: 100%;
      background-color: var(--secondary-color);
      border-radius: 999px;
    }
  }
</style>
