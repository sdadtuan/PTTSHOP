// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { pickInitialModalFocus } from "@/lib/modal-focus";

describe("pickInitialModalFocus", () => {
  it("focuses text input instead of the header close button", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `
      <button type="button" aria-label="Đóng">X</button>
      <form>
        <input type="text" name="name" />
      </form>
    `;
    const target = pickInitialModalFocus(panel);
    expect(target?.tagName).toBe("INPUT");
    expect(target?.getAttribute("name")).toBe("name");
  });
});