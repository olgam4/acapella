<script lang="ts">
  let { navigate, title, img } = $props();
</script>

<li>
  <img alt="decoration" src={img} />
  <button onclick={navigate}
    ><p>{title}</p>
    <iconify-icon class="icon" icon="material-symbols:arrow-forward-ios-rounded"
    ></iconify-icon>
  </button>
</li>

<style scoped>
  li {
    display: flex;
    align-items: center;
  }

  p {
    width: 27ch;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  img {
    width: 30px;
    height: 30px;
  }

  button {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 1rem;
    border-block-end: 1px solid var(--gray);

    .icon {
      margin-inline-start: auto;
      color: var(--gray);
    }
  }
</style>

