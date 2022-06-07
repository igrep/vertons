import {
  VertonVertexJsObject,
  VertonGarageJsObject,
  VertexId,
  Edge,
} from "./lib";
import { topologicalSort } from "./topological-sort";

type PlugNumber = number;
type JackNumber = number;

type VertexCore = {
  _id: VertexId;
  header: string;
  plugs: {};
  jacks: {};
};

type VertexForEvaluation =
  | ClickVertexForEvaluation
  | CursorVertexForEvaluation
  | (VertexCore & {
      kind: "constant";
      plugs: { value: PlugNumber };
      config: { value: number };
    })
  | (VertexCore & {
      kind: "tick";
      plugs: { value: PlugNumber };
    })
  | (VertexCore & {
      kind: "calculate";
      jacks: { left: JackNumber; right: JackNumber };
      plugs: { result: PlugNumber };
      config: { operator: string };
    })
  | (VertexCore & {
      kind: "compare";
      jacks: { left: JackNumber; right: JackNumber };
      plugs: { result: PlugNumber };
      config: { operator: string };
    })
  | (VertexCore & {
      kind: "counter";
      jacks: { increment: JackNumber };
      plugs: { count: PlugNumber };
    })
  | (VertexCore & {
      kind: "not";
      jacks: { input: JackNumber };
      plugs: { output: PlugNumber };
    })
  | (VertexCore & {
      kind: "and";
      jacks: { left: JackNumber; right: JackNumber };
      plugs: { output: PlugNumber };
    })
  | (VertexCore & {
      kind: "object";
      jacks: { x: JackNumber; y: JackNumber };
      config: { initialX: number; initialY: number };
    });

type MouseVertexes = {
  click: ClickVertexForEvaluation[];
  whilePointerDown: CursorVertexWhilePointerDown[];
  lastPosition: CursorVertexLastPosition[];
};

type ClickVertexForEvaluation = VertexCore & {
  kind: "click";
  plugs: { clicked: PlugNumber };
};

type CursorVertexConfigValue = "whilePointerDown" | "lastPosition";
type CursorVertexForEvaluationCore = VertexCore & {
  kind: "cursor";
  plugs: { x: PlugNumber; y: PlugNumber };
  config: { send: CursorVertexConfigValue };
};
type CursorVertexForEvaluation =
  | CursorVertexWhilePointerDown
  | CursorVertexLastPosition;
// onmousemove (with pointerdown) & onmouseup
type CursorVertexWhilePointerDown = CursorVertexForEvaluationCore & {
  config: { send: "whilePointerDown" };
};
// onmousemove (with pointerdown)
type CursorVertexLastPosition = CursorVertexForEvaluationCore & {
  config: { send: "lastPosition" };
};

function vertexesForEvaluation(
  vertexes: Required<VertonVertexJsObject>[],
  edges: Edge.JsObject[]
): {
  plugsCount: number;
  jacksCount: number;
  plugJackOrdered: VertexForEvaluation[];
  mouseVertexes: MouseVertexes;
  idOrdered: VertexForEvaluation[];
} {
  const vertexesById: Required<VertonVertexJsObject>[] = [];
  for (const vertex of vertexes) {
    vertexesById[vertex._id] = vertex;
  }

  const sortedIds = topologicalSort<{ vertexId: VertexId }>(
    edges,
    (edge) => edge.vertexId
  );
  const sortedVertexes: Required<VertonVertexJsObject>[] = [];
  for (const id of sortedIds) {
    sortedVertexes.push(vertexesById[id]);
  }

  const plugJackOrdered: VertexForEvaluation[] = [];
  const idOrdered: VertexForEvaluation[] = [];
  const mouseVertexes: Record<
    string,
    (CursorVertexForEvaluation | ClickVertexForEvaluation)[]
  > = {
    click: [],
    whilePointerDown: [],
    lastPosition: [],
  };
  let plugId = 0;
  let jackId = 0;
  for (const v of sortedVertexes) {
    let v1: VertexForEvaluation;
    switch (v.kind) {
      case "click":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          plugs: { clicked: plugId++ },
          jacks: {},
        };
        mouseVertexes["click"].push(v1);
        break;
      case "cursor":
        const configCursor = validateConfigCursor(v);
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          plugs: { x: plugId++, y: plugId++ },
          config: { send: configCursor },
          jacks: {},
        } as CursorVertexForEvaluation;
        mouseVertexes[configCursor].push(v1);
        break;
      case "constant":
        if (!("value" in v.config)) {
          throw new Error("Invalid constant vertex.");
        }
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          plugs: { value: plugId++ },
          config: v.config as { value: number },
          jacks: {},
        };
        break;
      case "tick":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          plugs: { value: plugId++ },
          jacks: {},
        };
        break;
      case "calculate":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          jacks: { left: jackId++, right: jackId++ },
          plugs: { result: plugId++ },
          config: { operator: v.jacks[1].label! },
        };
        break;
      case "compare":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          jacks: { left: jackId++, right: jackId++ },
          plugs: { result: plugId++ },
          config: { operator: v.jacks[1].label! },
        };
        break;
      case "counter":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          jacks: { increment: jackId++ },
          plugs: { count: plugId++ },
        };
        break;
      case "not":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          jacks: { input: jackId++ },
          plugs: { output: plugId++ },
        };
        break;
      case "and":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          jacks: { left: jackId++, right: jackId++ },
          plugs: { output: plugId++ },
        };
        break;
      case "object":
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          jacks: { x: jackId++, y: jackId++ },
          plugs: {},
          config: { initialX: v.position.x, initialY: v.position.y },
        };
        break;
      default:
        throw new Error(`Invalid vertex kind: ${v.kind}`);
    }
    plugJackOrdered.push(v1);
    idOrdered[v1._id] = v1;
  }
  return {
    plugsCount: plugId,
    jacksCount: jackId,
    plugJackOrdered,
    idOrdered,
    mouseVertexes: mouseVertexes as MouseVertexes,
  };
}

// key: JackNumber
type Graph = PlugNumber[][];

namespace Graph {
  export function build(
    edges: Edge.JsObject[],
    idOrdered: VertexForEvaluation[],
    jacksCount: number
  ): Graph {
    const graph: Graph = new Array(jacksCount);
    for (let jackNumber = 0; jackNumber < graph.length; ++jackNumber) {
      graph[jackNumber] = [];
    }

    for (const { from, to } of edges) {
      const { jacks } = idOrdered[to.vertexId];
      const jackNumber = (jacks as Record<string, JackNumber>)[to.jackId];

      const { plugs } = idOrdered[from.vertexId];
      const plugNumber = (plugs as Record<string, PlugNumber>)[from.plugId];
      if (plugNumber === undefined || jackNumber === undefined) {
        console.error("Invalid edge: ", { from, to });
      }
      graph[jackNumber].push(plugNumber);
    }
    return graph;
  }
}

// key: PlugNumber
type PlugState = number[];

namespace PlugState {
  export function init(size: number): PlugState {
    return new Array(size).fill(0);
  }
}

type RunState = { shouldStop: boolean };

type Stop = () => void;

export function evaluate(
  { vertexes, edges }: VertonGarageJsObject,
  stage: HTMLElement
): Stop {
  const {
    plugsCount,
    jacksCount,
    plugJackOrdered,
    idOrdered,
    mouseVertexes,
  } = vertexesForEvaluation(vertexes, edges);
  const graph = Graph.build(edges, idOrdered, jacksCount);
  const plugState = PlugState.init(plugsCount);

  // beforeEvaluate {
  for (const vertex of plugJackOrdered) {
    switch (vertex.kind) {
      case "constant":
        plugState[vertex.plugs.value] = vertex.config.value;
        break;
      case "object":
        const element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        element.setAttribute("x", vertex.config.initialX.toString());
        element.setAttribute("y", vertex.config.initialY.toString());
        element.setAttribute("id", `js-object-${vertex._id}`);
        element.textContent = vertex.header;
        stage.appendChild(element);
        break;
      default:
        // do nothing
        break;
    }
  }

  stage.addEventListener("click", handleClick);
  stage.addEventListener("pointerdown", handlePointerDownMove);
  stage.addEventListener("pointermove", handlePointerDownMove);
  function handleClick() {
    for (const vertex of mouseVertexes.click) {
      plugState[vertex.plugs.clicked] = 1;
    }
  }

  const rect = stage.getBoundingClientRect();
  let lastX = rect.left;
  let lastY = rect.top;
  function handlePointerDownMove(e: MouseEvent) {
    for (const vertex of mouseVertexes.lastPosition) {
      plugState[vertex.plugs.x] = e.clientX - lastX;
      plugState[vertex.plugs.y] = e.clientY - lastY;
    }

    if (e.buttons !== 0) {
      for (const vertex of mouseVertexes.whilePointerDown) {
        plugState[vertex.plugs.x] = e.clientX - lastX;
        plugState[vertex.plugs.y] = e.clientY - lastY;
      }
    }
    lastX = e.clientX;
    lastY = e.clientY;
  }
  // }

  const runState = { shouldStop: false };
  doEvaluate(plugJackOrdered, graph, mouseVertexes, plugState, runState, stage);
  return () => {
    runState.shouldStop = true;
    stage.removeEventListener("click", handleClick);
    stage.removeEventListener("pointermove", handlePointerDownMove);
    stage.removeEventListener("pointerdown", handlePointerDownMove);
    stage.innerHTML = "";
  };
}

function doEvaluate(
  plugJackOrdered: VertexForEvaluation[],
  graph: Graph,
  { click, whilePointerDown, lastPosition }: MouseVertexes,
  plugState: PlugState,
  runState: RunState,
  stage: HTMLElement
) {
  requestAnimationFrame(go);
  let lastTime: number | undefined = undefined;
  function go(time: number) {
    if (runState.shouldStop) {
      return;
    }
    lastTime ??= time;
    const elapsed = time - lastTime;
    lastTime = time;

    let jackVal1: number, jackVal2: number;
    for (const vertex of plugJackOrdered) {
      switch (vertex.kind) {
        case "click":
          // do nothing. The result of click is set by the event handler set in
          // beforeEvaluate.
          break;
        case "constant":
          // do nothing. The result of constant is set by beforeEvaluate().
          break;
        case "tick":
          plugState[vertex.plugs.value] = elapsed;
          break;
        case "calculate":
          jackVal1 = getJackValue(vertex.jacks.left, graph, plugState);
          jackVal2 = getJackValue(vertex.jacks.right, graph, plugState);
          switch (vertex.config.operator) {
            case "+":
              plugState[vertex.plugs.result] = jackVal1 + jackVal2;
              break;
            case "-":
              plugState[vertex.plugs.result] = jackVal1 - jackVal2;
              break;
            case "×":
              plugState[vertex.plugs.result] = jackVal1 * jackVal2;
              break;
            case "÷":
              plugState[vertex.plugs.result] = jackVal1 / jackVal2;
              break;
            default:
              throw new Error(
                `calculate: Unknown operator: ${vertex.config.operator}`
              );
          }
          break;
        case "compare":
          jackVal1 = getJackValue(vertex.jacks.left, graph, plugState);
          jackVal2 = getJackValue(vertex.jacks.right, graph, plugState);
          switch (vertex.config.operator) {
            case "=":
              plugState[vertex.plugs.result] = boolVal(jackVal1 == jackVal2);
              break;
            case "<":
              plugState[vertex.plugs.result] = boolVal(jackVal1 < jackVal2);
              break;
            case "≦":
              break;
            case ">":
              plugState[vertex.plugs.result] = boolVal(jackVal1 > jackVal2);
              break;
            case "≧":
              plugState[vertex.plugs.result] = boolVal(jackVal1 >= jackVal2);
              break;
            default:
              throw new Error(
                `calculate: Unknown operator: ${vertex.config.operator}`
              );
          }
          break;
        case "counter":
          jackVal1 = getJackValue(vertex.jacks.increment, graph, plugState);
          plugState[vertex.plugs.count] += jackVal1;
          break;
        case "not":
          jackVal1 = getJackValue(vertex.jacks.input, graph, plugState);
          plugState[vertex.plugs.output] = boolVal(!jackVal1);
          break;
        case "and":
          jackVal1 = getJackValue(vertex.jacks.left, graph, plugState);
          jackVal2 = getJackValue(vertex.jacks.right, graph, plugState);
          plugState[vertex.plugs.output] = jackVal1 && jackVal2;
          break;
        case "object":
          jackVal1 = getJackValue(vertex.jacks.x, graph, plugState);
          jackVal2 = getJackValue(vertex.jacks.y, graph, plugState);
          const objectElem = stage.querySelector(`#js-object-${vertex._id}`)!;
          const x = Number(objectElem.getAttribute("x"));
          const y = Number(objectElem.getAttribute("y"));
          objectElem.setAttribute("x", (x + jackVal1).toString());
          objectElem.setAttribute("y", (y + jackVal2).toString());
          break;
      }
    }

    // reset the state of mouse related vertexes
    for (const vertex of click) {
      plugState[vertex.plugs.clicked] = 0;
    }
    for (const vertex of whilePointerDown) {
      plugState[vertex.plugs.x] = 0;
      plugState[vertex.plugs.y] = 0;
    }
    for (const vertex of lastPosition) {
      plugState[vertex.plugs.x] = 0;
      plugState[vertex.plugs.y] = 0;
    }

    requestAnimationFrame(go);
  }
}

function boolVal(b: boolean): number {
  return b ? 1 : 0;
}

function getJackValue(
  jack: JackNumber,
  graph: Graph,
  plugState: PlugState
): number {
  return graph[jack].reduce(
    (jackVal, plugNumber) => jackVal + plugState[plugNumber],
    0
  );
}

function validateConfigCursor(
  v: Required<VertonVertexJsObject>
): CursorVertexConfigValue {
  if (!(v.config.send instanceof Object)) {
    throw new Error(`Invalid config for a click vertex: ${v.config.send}`);
  }
  switch (v.config.send.chosen) {
    case "whilePointerDown":
    case "lastPosition":
      return v.config.send.chosen;
    default:
      throw new Error(`Invalid config for a click vertex: ${v.config.send}`);
  }
}
