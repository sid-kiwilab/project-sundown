const mockNodeEol = [
  {
    cycle: "14",
    eol: "2023-04-30",
    lts: "fermium",
  },
  {
    cycle: "22",
    eol: "2027-04-30",
    lts: false,
  },
];

const mockLeftPadNpm = {
  name: "left-pad",
  versions: {
    "1.0.0": {
      version: "1.0.0",
      deprecated: "use String.prototype.padStart()",
    },
  },
  "dist-tags": { latest: "1.0.0" },
};

export function createMockFetch(): typeof fetch {
  return async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url.includes("endoflife.date/api/nodejs.json")) {
      return new Response(JSON.stringify(mockNodeEol), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("endoflife.date/api/python.json")) {
      return new Response(
        JSON.stringify([{ cycle: "3.12", eol: false }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("registry.npmjs.org/left-pad")) {
      return new Response(JSON.stringify(mockLeftPadNpm), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const npmMatch = url.match(/registry\.npmjs\.org\/([^/?]+)/);
    if (npmMatch) {
      const name = decodeURIComponent(npmMatch[1]!);
      const ver = url.includes("/lodash")
        ? "4.17.21"
        : url.includes("/next")
          ? "16.0.0"
          : url.includes("/react")
            ? "19.0.0"
            : "1.0.0";
      return new Response(
        JSON.stringify({
          name,
          versions: {
            [ver]: { version: ver },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  };
}