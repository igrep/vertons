import {
  VertonVertexJsObject,
  VertonGarageJsObject,
  VertexId,
  Edge,
} from "./lib";

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
  | (VertexCore & {
      kind: "constant";
      plugs: { value: PlugNumber };
      config: { value: number };
    })
  | (VertexCore & {
      kind: "time";
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

type ClickVertexes = {
  justWhenClicked: ClickVertexJustWhenClicked[];
  whilePointerDown: ClickVertexWhilePointerDown[];
  lastPosition: ClickVertexLastPosition[];
};

type ClickVertexConfigValue =
  | "justWhenClicked"
  | "whilePointerDown"
  | "lastPosition";
type ClickVertexForEvaluationCore = VertexCore & {
  kind: "click";
  plugs: { x: PlugNumber; y: PlugNumber };
  config: { send: ClickVertexConfigValue };
};
type ClickVertexForEvaluation =
  | ClickVertexJustWhenClicked
  | ClickVertexWhilePointerDown
  | ClickVertexLastPosition;
// onclick
type ClickVertexJustWhenClicked = ClickVertexForEvaluationCore & {
  config: { send: "justWhenClicked" };
};
// onmousemove (with mousedown) & onmouseup
type ClickVertexWhilePointerDown = ClickVertexForEvaluationCore & {
  config: { send: "whilePointerDown" };
};
// onmousemove (with mousedown)
type ClickVertexLastPosition = ClickVertexForEvaluationCore & {
  config: { send: "lastPosition" };
};

function vertexesForEvaluation(
  vertexes: Required<VertonVertexJsObject>[]
): {
  plugsCount: number;
  plugJackOrdered: VertexForEvaluation[];
  clickVertexes: ClickVertexes;
  idOrdered: VertexForEvaluation[];
} {
  const vertexes0 = [...vertexes];
  vertexes0.sort((a, b) => weight(a) - weight(b) || a._id - b._id);
  function weight({ plugs, jacks }: Required<VertonVertexJsObject>): number {
    if (plugs.length) {
      if (jacks.length) {
        return 0; // has both
      }
      return -1; // has only plugs
    }
    return 1; // has only jacks. (All vertexes have at least either!)
  }

  const plugJackOrdered: VertexForEvaluation[] = [];
  const idOrdered: VertexForEvaluation[] = [];
  const clickVertexes: Record<string, ClickVertexForEvaluation[]> = {
    justWhenClicked: [],
    whilePointerDown: [],
    lastPosition: [],
  };
  let plugId = 0;
  let jackId = 0;
  for (const v of vertexes0) {
    let v1: VertexForEvaluation;
    switch (v.kind) {
      case "click":
        const configClick = validateConfigClick(v);
        v1 = {
          _id: v._id,
          kind: v.kind,
          header: v.header,
          plugs: { x: plugId++, y: plugId++ },
          config: { send: configClick },
          jacks: {},
        } as ClickVertexForEvaluation;
        clickVertexes[configClick].push(v1);
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
      case "time":
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
    plugJackOrdered,
    idOrdered,
    clickVertexes: clickVertexes as ClickVertexes,
  };
}

// key: JackNumber
type Graph = PlugNumber[][];

namespace Graph {
  export function build(
    edges: Edge.JsObject[],
    idOrdered: VertexForEvaluation[]
  ): Graph {
    const graph: Graph = [];
    for (const { from, to } of edges) {
      const { plugs } = idOrdered[from.vertexId];
      const plugNumber = (plugs as Record<string, PlugNumber>)[from.plugId];
      graph[plugNumber] ||= [];

      const { jacks } = idOrdered[to.vertexId];
      const jackNumber = (jacks as Record<string, JackNumber>)[to.jackId];
      graph[plugNumber].push(jackNumber);
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
    plugJackOrdered,
    idOrdered,
    clickVertexes,
  } = vertexesForEvaluation(vertexes);
  const graph = Graph.build(edges, idOrdered);
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
  stage.addEventListener("mousedown", handleMouseDownMove);
  stage.addEventListener("mousemove", handleMouseDownMove);
  stage.addEventListener("mouseup", handleMouseUp);
  function handleClick(e: MouseEvent) {
    const { x, y } = stage.getBoundingClientRect();
    for (const vertex of clickVertexes.justWhenClicked) {
      plugState[vertex.plugs.x] = e.clientX - x;
      plugState[vertex.plugs.y] = e.clientY - y;
    }
  }
  function handleMouseDownMove(e: MouseEvent) {
    if (e.buttons === 0) {
      return;
    }
    const { x, y } = stage.getBoundingClientRect();
    for (const vertex of clickVertexes.whilePointerDown) {
      plugState[vertex.plugs.x] = e.clientX - x;
      plugState[vertex.plugs.y] = e.clientY - y;
    }
    for (const vertex of clickVertexes.lastPosition) {
      plugState[vertex.plugs.x] = e.clientX - x;
      plugState[vertex.plugs.y] = e.clientY - y;
    }
  }
  function handleMouseUp() {
    for (const vertex of clickVertexes.whilePointerDown) {
      plugState[vertex.plugs.x] = 0;
      plugState[vertex.plugs.y] = 0;
    }
  }
  // }

  const runState = { shouldStop: false };
  doEvaluate(plugJackOrdered, graph, clickVertexes, plugState, runState, stage);
  return () => {
    runState.shouldStop = true;
    stage.removeEventListener("click", handleClick);
    stage.removeEventListener("mousemove", handleMouseDownMove);
    stage.removeEventListener("mouseup", handleMouseUp);
    stage.innerHTML = "";
  };
}

function doEvaluate(
  plugJackOrdered: VertexForEvaluation[],
  graph: Graph,
  { justWhenClicked }: ClickVertexes,
  plugState: PlugState,
  runState: RunState,
  stage: HTMLElement
) {
  requestAnimationFrame(go);
  let start: number | undefined = undefined;
  function go(time: number) {
    if (runState.shouldStop) {
      return;
    }
    start ??= time;
    const elapsed = time - start;

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
        case "time":
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

    for (const vertex of justWhenClicked) {
      // reset the state of `justWhenClicked` click vertexes
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
  return graph[jack].reduce((a, b) => plugState[a] + plugState[b], 0);
}

function validateConfigClick(
  v: Required<VertonVertexJsObject>
): ClickVertexConfigValue {
  if (!(v.config.send instanceof Object)) {
    throw new Error(`Invalid config for a click vertex: ${v.config.send}`);
  }
  switch (v.config.send.chosen) {
    case "justWhenClicked":
    case "whilePointerDown":
    case "lastPosition":
      return v.config.send.chosen;
    default:
      throw new Error(`Invalid config for a click vertex: ${v.config.send}`);
  }
}
