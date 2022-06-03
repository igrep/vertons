import * as fc from "fast-check";

import { topologicalSort, Edge } from "./topological-sort";

function shouldBeTopologicallySorted(edges: Edge<number>[], actual: number[]) {
  for (const { from, to } of edges) {
    const iFrom = actual.indexOf(from);
    expect(iFrom).not.toEqual(-1);

    const iTo = actual.indexOf(to);
    expect(iTo).not.toEqual(-1);

    expect(iFrom).toBeLessThan(iTo);
  }
}

describe("topologicalSort", () => {
  describe("can sort nodes in a DAG topologically", () => {
    const shuffled = (
      originalEdges: Edge<number>[]
    ): fc.Arbitrary<Edge<number>[]> =>
      fc.shuffledSubarray(originalEdges, {
        minLength: originalEdges.length,
      });

    test("test case from https://en.wikipedia.org/wiki/Topological_sorting", () => {
      const originalEdges: Edge<number>[] = [
        { from: 7, to: 11 },
        { from: 11, to: 2 },
        { from: 11, to: 9 },
        { from: 11, to: 10 },
        { from: 5, to: 11 },
        { from: 7, to: 8 },
        { from: 8, to: 9 },
        { from: 3, to: 8 },
        { from: 3, to: 10 },
      ];

      fc.assert(
        fc.property(shuffled(originalEdges), (edges) => {
          const actual = topologicalSort(edges, (v) => v);
          shouldBeTopologicallySorted(edges, actual);
        })
      );
    });

    test("test case from https://fr.wikipedia.org/wiki/Tri_topologique", () => {
      const originalEdges: Edge<number>[] = [
        { from: 1, to: 2 },
        { from: 1, to: 8 },
        { from: 2, to: 8 },
        { from: 2, to: 3 },
        { from: 3, to: 6 },
        { from: 4, to: 3 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
        { from: 9, to: 8 },
      ];

      fc.assert(
        fc.property(shuffled(originalEdges), (edges) => {
          const actual = topologicalSort(edges, (v) => v);
          shouldBeTopologicallySorted(edges, actual);
        })
      );
    });

    test("test case from https://es.wikipedia.org/wiki/Ordenamiento_topol%C3%B3gico", () => {
      const originalEdges: Edge<number>[] = [
        { from: 1, to: 4 },
        { from: 2, to: 4 },
        { from: 2, to: 5 },
        { from: 3, to: 5 },
        { from: 3, to: 6 },
      ];

      fc.assert(
        fc.property(shuffled(originalEdges), (edges) => {
          const actual = topologicalSort(edges, (v) => v);
          shouldBeTopologicallySorted(edges, actual);
        })
      );
    });

    test("test case from https://de.wikipedia.org/wiki/Topologische_Sortierung", () => {
      const originalEdges: Edge<number>[] = [
        { from: 1, to: 4 },
        { from: 2, to: 3 },
        { from: 4, to: 3 },
        { from: 5, to: 2 },
        { from: 4, to: 7 },
        { from: 6, to: 7 },
      ];

      fc.assert(
        fc.property(shuffled(originalEdges), (edges) => {
          const actual = topologicalSort(edges, (v) => v);
          shouldBeTopologicallySorted(edges, actual);
        })
      );
    });
  });
});
