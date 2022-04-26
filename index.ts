import { evaluate } from "./eval";
import { VertonGarage, activateWebComponents } from "./lib";

activateWebComponents();

const garage = document.getElementsByTagName(
  "verton-garage"
)[0] as VertonGarage;

const stageElem = document.getElementById("js-stage")!;
const showWhenEdit = document.getElementsByClassName(
  "js-showWhenEdit"
)[0] as HTMLElement;
const showWhenPlay = document.getElementsByClassName(
  "js-showWhenPlay"
)[0] as HTMLElement;

function invalidArgument(argument?: string): never {
  throw new Error(`Invalid argument: ${argument}`);
}

const COLORS = {
  intermediate: { window: "#00D198" },
  object: { window: "#FF7A26" },
};

let cleanup: undefined | ReturnType<typeof evaluate>;
document
  .getElementsByClassName("js-menuBars")[0]!
  .addEventListener("click", (e) => {
    const menuItem = e.target as HTMLElement;
    if (!menuItem.dataset.handler) {
      return;
    }

    switch (menuItem.dataset.handler) {
      case "addClickInstruction":
        garage.addVertex({
          header: "クリック",
          kind: "click",
          plugs: [{ plugId: "clicked" }],
          config: {},
        });
        break;
      case "addCursorInstruction":
        garage.addVertex({
          header: "マウスの移動",
          kind: "cursor",
          plugs: [
            { label: "X方向", plugId: "x" },
            { label: "Y方向", plugId: "y" },
          ],
          config: {
            send: {
              chosen: "whilePointerDown",
              candidates: {
                whilePointerDown: "ボタンを押している間だけ",
                lastPosition: "ボタンを押していなくても",
              },
            },
          },
        });
        break;
      case "addConstInstruction":
        garage.addVertex({
          header: "定数",
          kind: "constant",
          plugs: [{ label: "値", plugId: "value" }],
          config: { value: 0 },
        });
        break;
      case "addTickInstruction":
        garage.addVertex({
          header: "時間の経過",
          kind: "tick",
          plugs: [{ label: "値", plugId: "value" }],
        });
        break;
      case "addArithmeticInstruction":
        const operator =
          menuItem.dataset.argument ||
          invalidArgument(menuItem.dataset.argument);
        garage.addVertex({
          header: "けいさん",
          kind: "calculate",
          jacks: [{ jackId: "left" }, { label: operator }, { jackId: "right" }],
          plugs: [{ label: "=" }, { plugId: "result" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addComparisonInstruction":
        const comparator =
          menuItem.dataset.argument ||
          invalidArgument(menuItem.dataset.argument);
        garage.addVertex({
          header: "くらべる",
          kind: "compare",
          jacks: [
            { jackId: "left" },
            { label: comparator },
            { jackId: "right" },
          ],
          plugs: [{ label: "結果" }, { plugId: "result" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addCounterInstruction":
        garage.addVertex({
          header: "カウンター",
          kind: "counter",
          jacks: [
            { jackId: "increment", label: "増やす" },
            { jackId: "decrement", label: "減らす" },
            { jackId: "reset", label: "リセット" },
          ],
          plugs: [{ label: "カウント" }, { plugId: "count" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addNotInstruction":
        garage.addVertex({
          header: "NOT",
          kind: "not",
          jacks: [{ jackId: "input", label: "入力" }],
          plugs: [{ plugId: "output", label: "出力" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addAndInstruction":
        garage.addVertex({
          header: "AND",
          kind: "and",
          jacks: [
            { jackId: "left", label: "入力1" },
            { jackId: "right", label: "入力1" },
          ],
          plugs: [{ plugId: "output", label: "出力" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addObjectInstruction":
        const object =
          menuItem.dataset.argument ||
          invalidArgument(menuItem.dataset.argument);
        garage.addVertex({
          header: object,
          kind: "object",
          jacks: [
            { label: "X方向への移動" },
            { jackId: "x" },
            { label: "Y方向への移動" },
            { jackId: "y" },
          ],
          colors: COLORS.object,
        });
        break;
      case "save":
        // Ref. (In Japanese) https://qiita.com/kerupani129/items/99fd7a768538fcd33420
        const jsonUri = encodeURIComponent(JSON.stringify(garage.toJsObject()));
        const a = document.createElement("a");
        a.href = `data:application/json;charset=utf-8,${jsonUri}`;
        a.download = "vertons.json";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        break;
      case "load":
        if (!garage.isEmpty()) {
          const loadAnyway = confirm(
            "保存したファイルから再開すると、今あるノードは削除されていまいます。それでも再開しますか？"
          );
          if (!loadAnyway) {
            return;
          }
        }

        // Ref. (In Japanese) https://qiita.com/kerupani129/items/99fd7a768538fcd33420
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.onchange = () => {
          const reader = new FileReader();
          reader.readAsText(fileInput.files![0]);
          reader.onload = () => {
            garage.loadJsObject(JSON.parse(reader.result as string));
          };
        };
        fileInput.click();
        break;
      case "play":
        stageElem.style.display = "block";
        showWhenPlay.style.display = "block";
        showWhenEdit.style.display = "none";
        cleanup = evaluate(garage.toJsObject(), stageElem);
        break;
      case "replay":
        cleanup?.();
        cleanup = evaluate(garage.toJsObject(), stageElem);
        break;
      case "reedit":
        stageElem.style.display = "none";
        showWhenPlay.style.display = "none";
        showWhenEdit.style.display = "block";
        cleanup?.();
        cleanup = undefined;
        break;
      default:
        throw new Error(`Unknown handler: ${menuItem.dataset.handler}`);
    }
  });
