export class TextHandler {
  #buffer = "";
  #processor: (text: string) => string | void;
  constructor(processor: (text: string) => string | void) {
    this.#processor = processor;
  }
  text(text: Text) {
    this.#buffer += text.text;
    if (text.lastInTextNode) {
      const original = this.#buffer.trim();
      const replaced = this.#processor(original);
      text.replace(replaced ?? original);
      this.#buffer = "";
    } else {
      text.remove();
    }
  }
}
