class ContextMenu {
  #opened = $state(false);

  get opened(): boolean {
    return this.#opened;
  }

  set opened(opened: boolean) {
    this.#opened = opened;
  }
}

export const contextMenu = $state(new ContextMenu());
