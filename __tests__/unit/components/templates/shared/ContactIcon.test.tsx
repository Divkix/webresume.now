import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getContactIcon } from "@/components/templates/shared/ContactIcon";

describe("getContactIcon", () => {
  it("returns a non-null icon for a standard type", () => {
    const node = getContactIcon("email", { className: "w-4 h-4" });
    expect(node).not.toBeNull();
  });

  it("returns null for types with no standard icon", () => {
    expect(getContactIcon("behance")).toBeNull();
    expect(getContactIcon("dribbble")).toBeNull();
  });

  it("forwards className to the icon", () => {
    const node = getContactIcon("email", { className: "w-5 h-5 text-red-500" });
    const { container } = render(<>{node}</>);
    const el = container.firstElementChild;
    expect(el?.getAttribute("class")).toContain("w-5");
    expect(el?.getAttribute("class")).toContain("h-5");
  });

  it("forwards size to the icon", () => {
    const node = getContactIcon("email", { size: 18 });
    const { container } = render(<>{node}</>);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });
});
