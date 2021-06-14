type VertexSpec = {
  header: string;
  plugContents?: VertexContent[];
  jackContents?: VertexContent[];
};

type VertexContent = { label: string } | { type: ValueType; label?: string };

type ValueType = "number" | "label";

export class VertonGarage extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
      }
    `;
    shadow.appendChild(style);
  }

  addVertex(spec: VertexSpec): void {
    const specFilled = Object.assign(
      { plugContents: [], jackContents: [] },
      spec
    );
    this.shadowRoot!.append(VertonVertex.build(specFilled));
  }
}

customElements.define("verton-garage", VertonGarage);

export class VertonVertex extends HTMLElement {
  readonly color: string;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");

    this.color = "red";

    style.textContent = `
      :host {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;

        --height: 15em;
        --width: 17em;
        --header-height: 1.6em;

        min-height: var(--height);
        min-width: var(--width);
      }
      :host([hidden]) {
        display: none;
      }

      #inner {
        border-top: 5px solid ${this.color};
        border-bottom: 5px solid ${this.color};
        border-left: 5px solid ${this.color};
        border-right: 5px solid ${this.color};
        border-radius: 15px;

        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: flex-start;

        min-height: var(--height);
        min-width: var(--width);
      }

      #header {
        background-color: ${this.color};
        border-radius: 7px 7px 0 0;
        text-align: left;
        transform: scale(101%, 103%);
        font-size: var(--header-height);
        font-weight: bold;
        color: white;
      }

      #upper-right-corner {
        height: calc(var(--header-height) * 1.53);
      }

      #jacks-jack-labels-plug-labels {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        justify-content: space-between;
      }

      #jacks-jack-labels {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      #plugs-outer {
        display: flex;
        flex-direction: column;
      }

      #jacks, #plugs {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      #plugs {
        flex-grow: 1;
      }
      #jack-labels, #plug-labels {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        min-width: 1.5em;
      }
      #jack-labels {
        align-items: flex-start;
      }
      #plug-labels {
        align-items: flex-end;
      }

      .label {
        /* TODO: Darken a little */
        color: ${this.color};
        font-weight: bold;
        padding: 0 0.5em;
      }
    `;
    shadow.appendChild(style);
  }

  static build({
    header,
    plugContents,
    jackContents,
  }: Required<VertexSpec>): VertonVertex {
    const obj = new this();
    const r = obj.shadowRoot!;

    const inner = document.createElement("div");
    inner.id = "inner";

    const headerElem = document.createElement("div");
    headerElem.id = "header";
    headerElem.innerText = header;
    inner.append(headerElem);

    const jacksJackLabelsPlugLabels = document.createElement("div");
    jacksJackLabelsPlugLabels.id = "jacks-jack-labels-plug-labels";
    inner.append(jacksJackLabelsPlugLabels);

    obj._appendJacks(jackContents, jacksJackLabelsPlugLabels);

    r.append(inner);

    obj._appendPlugs(plugContents, jacksJackLabelsPlugLabels);

    return obj;
  }

  private _appendJacks(jackContents: VertexContent[], inner: HTMLDivElement) {
    const jacksElem = document.createElement("div");
    jacksElem.id = "jacks";

    const labels = document.createElement("div");
    labels.id = "jack-labels";

    for (const jack of jackContents) {
      const hasType = "type" in jack;
      if (hasType) {
        jacksElem.append(VertonJack.build((jack as any).type, this.color));
      }

      const hasLabel = "label" in jack;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = jack.label!;
        labels.append(labelElem);
      }

      if (!hasType && !hasLabel) {
        console.error(`Unkown object in jackContents:`, jack);
      }
    }

    const jacksJackLabels = document.createElement("div");
    jacksJackLabels.id = "jacks-jack-labels";

    jacksJackLabels.append(jacksElem);
    jacksJackLabels.append(labels);
    inner.append(jacksJackLabels);
  }

  private _appendPlugs(plugContents: VertexContent[], inner: HTMLElement) {
    const r = this.shadowRoot!;

    const plugsOuter = document.createElement("div");
    plugsOuter.id = "plugs-outer";

    const upperRightCorner = document.createElement("div");
    upperRightCorner.id = "upper-right-corner";
    plugsOuter.append(upperRightCorner);

    const plugsElem = document.createElement("div");
    plugsElem.id = "plugs";
    plugsOuter.append(plugsElem);

    const labels = document.createElement("div");
    labels.id = "plug-labels";

    for (const plug of plugContents) {
      const hasType = "type" in plug;
      if (hasType) {
        plugsElem.append(VertonPlug.build((plug as any).type, this.color));
      }

      const hasLabel = "label" in plug;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = plug.label!;
        labels.append(labelElem);
      }

      if (!hasType && !hasLabel) {
        console.error(`Unkown object in plugContents:`, plug);
      }
    }

    inner.append(labels);

    r.append(plugsOuter);
  }
}

customElements.define("verton-vertex", VertonVertex);

export class VertonPlug extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const point = document.createElement("div");
    point.id = "point";
    shadow.append(point);
  }

  static build(type: string, color: string): VertonPlug {
    const o = new this();
    o.dataset.type = type;
    o._setStyle(color);

    return o;
  }

  private _setStyle(color: string) {
    const r = this.shadowRoot!;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        --main-color: ${color};
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 0.65em;
        height: 1.3em;
        border-radius: 0 1.3em 1.3em 0;
        border: 5px solid  ${color};
        border-left: 6px solid white; /* TODO: set background color */
        margin-left: -5px;
      }
      :host([hidden]) {
        display: none;
      }
      #point {
        width: 0.4em;
        height: 0.4em;
        border-radius: 0.5em;
        background-color: ${color};
      }
    `;
    r.append(style);
  }
}

customElements.define("verton-plug", VertonPlug);

export class VertonJack extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const point = document.createElement("div");
    point.id = "point";
    shadow.append(point);
  }

  static build(type: string, color: string): VertonJack {
    const o = new this();
    o.dataset.type = type;
    o._setStyle(color);

    return o;
  }

  private _setStyle(color: string) {
    const r = this.shadowRoot!;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        --main-color: ${color};
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 0.65em;
        height: 1.3em;
        border-radius: 0 1.3em 1.3em 0;
        border: 5px solid  ${color};
        border-left: 6px solid white; /* TODO: set background color */
        margin-left: -5px;
      }
      :host([hidden]) {
        display: none;
      }
      #point {
        width: 0.4em;
        height: 0.4em;
        border-radius: 0.5em;
        background-color: ${color};
      }
    `;
    r.append(style);
  }
}

customElements.define("verton-jack", VertonJack);

export class VertonStage extends HTMLElement {
  constructor() {
    super();

    // const shadow = this.attachShadow({ mode: "open" });
  }
}

customElements.define("verton-stage", VertonStage);

export class VertonObject extends HTMLElement {
  constructor() {
    super();

    // const shadow = this.attachShadow({ mode: "open" });
  }
}

customElements.define("verton-object", VertonObject);

const garage = document.getElementsByTagName(
  "verton-garage"
)[0] as VertonGarage;

garage.addVertex({
  header: "クリック",
  plugContents: [
    { label: "X座標", type: "number" },
    { label: "Y座標", type: "number" },
  ],
});

garage.addVertex({
  header: "足し算",
  jackContents: [{ type: "number" }, { label: "+" }, { type: "number" }],
  plugContents: [{ label: "=" }, { type: "number" }],
});

garage.addVertex({
  header: "🐶",
  jackContents: [
    { label: "X座標" },
    { type: "number" },
    { label: "Y座標" },
    { type: "number" },
  ],
});
