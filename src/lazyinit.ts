export class LazyInit<T, R> {
  #value: T | null = null;
  constructor(private readonly initializer: (args: R) => T) {}
  get(args: R): T {
    if (!this.#value) {
      this.#value = this.initializer(args);
    }
    return this.#value;
  }
}
