export type VertexId = number;
export type Edge<V> = { from: V; to: V };

export type GraphById = Map<VertexId, Set<VertexId>>;

export function topologicalSort<V>(
  edges: Edge<V>[],
  getId: (v: V) => VertexId
): VertexId[] {
  const graph: GraphById = new Map();
  const entries = new Set<VertexId>();
  const exits = new Set<VertexId>();
  for (const { from, to } of edges) {
    const fromId = getId(from);
    const toId = getId(to);
    if (!graph.has(fromId)) {
      graph.set(fromId, new Set());
    }
    graph.get(fromId)!.add(toId);
    entries.add(fromId);
    exits.add(toId);
  }
  for (const exit of exits) {
    entries.delete(exit);
  }

  if (entries.size === 0) {
    throw new Error("No entry nodes! Not a DAG!");
  }

  const result: VertexId[] = [];
  const entriesList = Array.from(entries);
  while (entriesList.length > 0) {
    const vertex = entriesList.pop()!;
    result.push(vertex);

    const edges = graph.get(vertex) ?? new Set();
    const tos = Array.from(edges);
    while (tos.length > 0) {
      const to = tos.pop()!;

      edges.delete(to);
      if (edges.size < 1) {
        graph.delete(vertex);
      }

      const hasOtherEntries = Array.from(graph.values()).some((inputEdges) =>
        inputEdges.has(to)
      );
      if (!hasOtherEntries) {
        entriesList.push(to);
      }
    }
  }
  if (graph.size > 0) {
    throw new Error("The graph has still some edges. Not a DAG!");
  }
  return result;
}
