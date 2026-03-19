import { describe, it, expect } from "vitest";
import { transformCode } from "./executionEngine.js";

// Helper: transform without step() insertions for cleaner assertions
const transform = (code) => transformCode(code, false);

// Helper: transform with step() insertions (full pipeline)
const transformFull = (code) => transformCode(code, true);

describe("transformCode", () => {
  describe("Phase 2: await insertion before API calls", () => {
    it("adds await before a standalone API call", () => {
      const result = transform("produceResourceA()");
      expect(result).toContain("await produceResourceA()");
    });

    it("adds await before log()", () => {
      const result = transform("log('hello')");
      expect(result).toContain("await log('hello')");
    });

    it("does not double-add await if already present", () => {
      const result = transform("await produceResourceA()");
      expect(result).toBe("await produceResourceA()");
      expect(result).not.toContain("await await");
    });

    it("adds await to nested API calls: log(getResourceCount('A'))", () => {
      const result = transform("log(getResourceCount('A'))");
      expect(result).toContain("await log(");
      expect(result).toContain("await getResourceCount(");
      expect(result).toBe("await log(await getResourceCount('A'))");
    });

    it("adds await after = in assignment: let a = getResourceCount('A')", () => {
      const result = transform("let a = getResourceCount('A')");
      expect(result).toContain("await getResourceCount(");
      expect(result).toBe("let a = await getResourceCount('A')");
    });

    it("adds await after = without space: let a=getResourceCount('A')", () => {
      const result = transform("let a=getResourceCount('A')");
      expect(result).toContain("await getResourceCount(");
    });

    it("adds await after = with const: const x = produceResourceA()", () => {
      const result = transform("const x = produceResourceA()");
      expect(result).toBe("const x = await produceResourceA()");
    });

    it("adds await in compound assignment: count += produceResourceA()", () => {
      const result = transform("count += produceResourceA()");
      expect(result).toContain("await produceResourceA()");
    });

    it("adds await after == comparison: if (a == getResourceCount('A'))", () => {
      const result = transform("if (a == getResourceCount('A'))");
      expect(result).toContain("await getResourceCount(");
    });

    it("adds await for multiple API calls on one line", () => {
      const result = transform(
        "let a = getResourceCount('A'); let b = getResourceCount('B')"
      );
      // Both should have await
      const awaitCount = (result.match(/await getResourceCount/g) || []).length;
      expect(awaitCount).toBe(2);
    });
  });

  describe("Phase 1: step() insertion", () => {
    it("inserts step() after a simple statement", () => {
      const result = transformFull("produceResourceA()");
      expect(result).toContain("await step(1)");
    });

    it("skips step() for empty lines", () => {
      const result = transformFull("\n\nproduceResourceA()");
      const lines = result.split("\n");
      expect(lines[0]).toBe("");
      expect(lines[1]).toBe("");
      expect(lines[2]).toContain("await step(3)");
    });

    it("skips step() for comments", () => {
      const result = transformFull("// this is a comment");
      expect(result).not.toContain("step(");
    });

    it("inserts step() inside loop headers without API calls", () => {
      const result = transformFull("while (true) {");
      expect(result).toContain("await step(1)");
    });
  });

  describe("Phase 3: auto-async detection", () => {
    it("auto-adds async to user functions that contain API calls", () => {
      const code = `function harvest() {
  produceResourceA()
}`;
      const result = transform(code);
      expect(result).toContain("async function harvest()");
    });

    it("adds await before calls to user async functions", () => {
      const code = `function harvest() {
  produceResourceA()
}
harvest()`;
      const result = transform(code);
      expect(result).toContain("async function harvest()");
      expect(result).toContain("await harvest()");
    });

    it("does not add async to functions without API calls", () => {
      const code = `function add(a, b) {
  return a + b
}`;
      const result = transform(code);
      expect(result).not.toContain("async function add");
    });
  });

  describe("full pipeline integration", () => {
    it("transforms log(getResourceCount('A')) with steps", () => {
      const result = transformFull("log(getResourceCount('A'))");
      expect(result).toContain("await log(await getResourceCount('A'))");
      expect(result).toContain("await step(1)");
    });

    it("transforms variable assignment + usage across lines", () => {
      const code = `let a = getResourceCount('A')
log(a)`;
      const result = transformFull(code);
      expect(result).toContain("await getResourceCount('A')");
      expect(result).toContain("await log(a)");
    });

    it("transforms a while loop with API calls", () => {
      const code = `while (true) {
  produceResourceA()
}`;
      const result = transformFull(code);
      expect(result).toContain("await produceResourceA()");
    });

    it("transforms if statement with API call in condition", () => {
      const code = `if (getResourceCount('A') >= 2) {
  convertAToB()
}`;
      const result = transformFull(code);
      expect(result).toContain("await getResourceCount(");
      expect(result).toContain("await convertAToB()");
    });
  });
});
