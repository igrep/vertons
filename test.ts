import * as fc from "fast-check";

import { Edge } from "./lib";

describe("Edge.calcEdgeDef", () => {
  test("The returned value should always be positive", () => {
    fc.assert(
      fc.property(
        fc.nat(),
        fc.nat(),
        fc.nat(),
        fc.nat(),
        (top_, left_, clientY, clientX) => {
          const { top, left, width, height, x1, y1, x2, y2 } = Edge.calcEdgeDef(
            { y: top_, x: left_ },
            { y: clientY, x: clientX }
          );
          expect(top).toBeGreaterThanOrEqual(0);
          expect(left).toBeGreaterThanOrEqual(0);
          expect(width).toBeGreaterThan(0);
          expect(height).toBeGreaterThan(0);
          expect(x1).toBeGreaterThanOrEqual(0);
          expect(y1).toBeGreaterThanOrEqual(0);
          expect(x2).toBeGreaterThanOrEqual(0);
          expect(y2).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  describe("iff centerOfPlug /= clientXY", () => {
    test("x1, y1, x2, and y2 should be either 0 or abs(centerOfPlug.{top/left}, client[XY])", () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          (top_, left_, clientY_, clientX_) => {
            const top = top_ + 1;
            const left = left_ + 1;
            const clientY = top === clientY_ ? clientY_ + 1 : clientY_;
            const clientX = left === clientX_ ? clientX_ + 1 : clientX_;
            const { x1, y1, x2, y2 } = Edge.calcEdgeDef(
              { y: top, x: left },
              { y: clientY, x: clientX }
            );
            const dx = Math.abs(clientX - left);
            const dy = Math.abs(clientY - top);
            if (!(x1 === 0 || x1 === dx)) {
              throw new Error(`x1 is neither 0 nor ${dx}, but ${x1} actually`);
            }
            if (!(y1 === 0 || y1 === dy)) {
              throw new Error(`y1 is neither 0 nor ${dy}, but ${y1} actually`);
            }
            if (!(x2 === 0 || x2 === dx)) {
              throw new Error(`x2 is neither 0 nor ${dx}, but ${x2} actually`);
            }
            if (!(y2 === 0 || y2 === dy)) {
              throw new Error(`y2 is neither 0 nor ${dy}, but ${y2} actually`);
            }
          }
        )
      );
    });
    test("top and left should be centerOfPlug.{top/left} or client[XY]", () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          (top0, left0, clientY_, clientX_) => {
            const top_ = top0 + 1;
            const left_ = left0 + 1;
            const clientY = top_ === clientY_ ? clientY_ + 1 : clientY_;
            const clientX = left_ === clientX_ ? clientX_ + 1 : clientX_;
            const centerOfPlug = { y: top_, x: left_ };

            const { top, left } = Edge.calcEdgeDef(centerOfPlug, {
              y: clientY,
              x: clientX,
            });
            if (!(top === centerOfPlug.y || top === clientY)) {
              throw new Error(
                `top is neither ${centerOfPlug.y} nor ${clientY}, but ${top} actually`
              );
            }
            if (!(left === centerOfPlug.x || left === clientX)) {
              throw new Error(
                `left is neither ${centerOfPlug.x} nor ${clientX}, but ${left} actually`
              );
            }
          }
        )
      );
    });
    test("height and width should be abs(centerOfPlug.{top/left}, client[XY])", () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          (top0, left0, clientY_, clientX_) => {
            const top = top0 + 1;
            const left = left0 + 1;
            const clientY = top === clientY_ ? clientY_ + 1 : clientY_;
            const clientX = left === clientX_ ? clientX_ + 1 : clientX_;

            const { height, width } = Edge.calcEdgeDef(
              { y: top, x: left },
              { y: clientY, x: clientX }
            );
            expect(height).toBe(Math.abs(clientY - top));
            expect(width).toBe(Math.abs(clientX - left));
          }
        )
      );
    });
  });
});
