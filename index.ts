type VertexSpec = {
  header: string;
  plugContents?: VertexContent[];
  jackContents?: VertexContent[];
};

type VertexContent = { label: string } | { type: ValueType; label?: string };

type ValueType = "number" | "label";

export class VertonTrack extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
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

customElements.define("verton-track", VertonTrack);

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
        flex-direction: column;
        flex-wrap: nowrap;

        --height: 15em;
        --width: 17em;

        min-height: var(--height);
        max-width: var(--width);
      }
      :host([hidden]) {
        display: none;
      }

      #inner {
        display: flex;
        border-left: 5px solid ${this.color};
        border-right: 5px solid ${this.color};
        border-radius: 10%;

        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: space-between;

        min-height: var(--height);
        max-width: var(--width);
      }

      #header {
        background-color: ${this.color};
        text-align: center;
        font-size: 170%;
        font-weight: bold;
        color: white;
      }

      #jack-types {
      }
      .between-jacks {
      }
      #jack-labels {
      }

      #plugs {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
      }
      #plug-labels {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
      }
      #plugs-left-corner {
        border-bottom: 5px solid ${this.color};
        width: 1em;
      }
      .between-plugs {
        border-bottom: 5px solid ${this.color};
      }
      #plugs-right-corner {
        border-bottom: 5px solid ${this.color};
        width: 1em;
      }

      .label {
        /* TODO: Darken a little */
        color: ${this.color};
        font-weight: bold;
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

    obj._appendJacks(jackContents, inner);

    const headerElem = document.createElement("div");
    headerElem.id = "header";
    headerElem.innerText = header;

    inner.append(headerElem);
    r.append(inner);

    obj._appendPlugs(plugContents, inner);

    return obj;
  }

  private _appendJacks(jackContents: VertexContent[], inner: HTMLDivElement) {
    const r = this.shadowRoot!;

    const jacksElem = document.createElement("div");
    jacksElem.id = "jacks";

    const labels = document.createElement("div");
    labels.id = "jack-labels";

    const leftCorner = document.createElement("div");
    leftCorner.id = "jacks-left-corner";
    labels.append(leftCorner);

    const lastIndex = jackContents.length - 1;
    for (const [i, jack] of jackContents.entries()) {
      const hasType = "type" in jack;
      if (hasType) {
        //jacksElem.append(VertonJack.build((jack as any).type, this.color));
      }

      const hasLabel = "label" in jack;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = jack.label!;
        labels.append(labelElem);
      }

      if (i !== lastIndex) {
        const betweenJacks = document.createElement("div");
        betweenJacks.className = "between-jacks";
        labels.append(betweenJacks);
      }

      if (!hasType && !hasLabel) {
        console.error(`Unkown object in jackContents:`, jack);
      }
    }

    const rightCorner = document.createElement("div");
    rightCorner.id = "jacks-right-corner";
    labels.append(rightCorner);

    inner.append(labels);
    r.append(jacksElem);
  }

  private _appendPlugs(plugContents: VertexContent[], inner: HTMLElement) {
    const r = this.shadowRoot!;

    const plugsElem = document.createElement("div");
    plugsElem.id = "plugs";

    const labels = document.createElement("div");
    labels.id = "plug-labels";

    const leftCorner = document.createElement("div");
    leftCorner.id = "plugs-left-corner";
    labels.append(leftCorner);

    const lastIndex = plugContents.length - 1;
    for (const [i, plug] of plugContents.entries()) {
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

      if (i !== lastIndex) {
        const betweenPlugs = document.createElement("div");
        betweenPlugs.className = "between-plugs";
        labels.append(betweenPlugs);
      }
    }

    const rightCorner = document.createElement("div");
    rightCorner.id = "plugs-right-corner";
    labels.append(rightCorner);

    inner.append(labels);
    r.append(plugsElem);
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
    // Next: draw plug
    style.textContent = `
      :host {
        --main-color: ${color};
        display: flex;
        justify-content: center;
        width: 1.3em;
        height: 0.65em;
        border-radius: 0 0 1.3em 1.3em;
        border-left: 5px solid ${color};
        border-right: 5px solid ${color};
        border-bottom: 5px solid ${color};
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

const track = document.getElementsByTagName("verton-track")[0] as VertonTrack;

track.addVertex({
  header: "クリックしたら",
  plugContents: [
    { label: "X座標", type: "number" },
    { label: "Y座標", type: "number" },
  ],
});

track.addVertex({
  header: "足し算",
  jackContents: [{ type: "number" }, { label: "+" }, { type: "number" }],
  plugContents: [{ label: "=" }, { type: "number" }],
});

track.addVertex({
  header: "🐶",
  jackContents: [
    { label: "X座標" },
    { type: "number" },
    { label: "Y座標" },
    { type: "number" },
  ],
});
