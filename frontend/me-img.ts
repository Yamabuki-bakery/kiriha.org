import { html, svg, attr, css, mutate } from "mutable-element";

const filter = [
  "'data:image/svg+xml,",
  '<svg xmlns="http://www.w3.org/2000/svg">',
  '<filter id="blur" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">',
  '<feGaussianBlur in="SourceGraphic" stdDeviation="10" />',
  "<feComponentTransfer>",
  '<feFuncA type="discrete" tableValues="1 1" />',
  "</feComponentTransfer>",
  "</filter",
  "</svg>",
  "#blur'",
].join("");

const style = css`
  :host {
    display: block;
    position: relative;
    height: 100%;
    overflow: hidden;
    border-radius: 0.5em;
  }

  img {
    position: absolute;
    inset: 0;
    z-index: -1;
    filter: url(${filter});
    object-fit: cover;
    width: 100%;
    height: 100%;
    opacity: 0.5;
  }
`;

class MeImg extends HTMLElement {
  #shadow: ShadowRoot = this.attachShadow({ mode: "open" });
  #image = html`img`(
    attr({
      loading: "lazy",
      alt: "",
    })
  ) as HTMLImageElement;
  static get observedAttributes() {
    return ["src"];
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(src: string) {
    this.#image.src = src;
    this.setAttribute("src", src);
  }

  constructor() {
    super();
    mutate(this.#shadow, [style, html`slot`, this.#image]);
  }

  connectedCallback() {
    if (!this.src) return;
    this.#image.src = this.src;
  }
}

customElements.define("me-img", MeImg);
