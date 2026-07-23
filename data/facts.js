/* ============================================================
   facts.js — every claim this explainer animates, in one place.
   The console orders below are NOT asserted from memory:
   test/facts.test.js executes each demo's code verbatim in a
   real Node child process and requires the captured output to
   equal `order` exactly, line for line. The same tests assert
   that index.html displays these exact orders and this exact
   code — the page can never drift from the proven facts.

   App-level figures (snippetCount, verifiedNode, verifiedDate)
   are sourced from the looptrace README / corpus:
   https://sreenivas-sadhu-prabhakara.github.io/looptrace/
   ============================================================ */

const FACTS = {
  app: {
    name: "looptrace",
    url: "https://sreenivas-sadhu-prabhakara.github.io/looptrace/",
    snippetCount: 36,
    verifiedNode: "v25.4.0",
    verifiedDate: "2026-07-23"
  },
  demos: [
    {
      id: "classic-interleave",
      title: "The classic interview interleave",
      code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');",
      order: ["A", "D", "C", "B"],
      naiveGuess: ["A", "B", "C", "D"]
    },
    {
      id: "await-suspends",
      title: "await suspends — it does not block",
      code: "async function f() {\n  console.log('1');\n  await null;\n  console.log('2');\n}\nf();\nconsole.log('3');",
      order: ["1", "3", "2"],
      naiveGuess: ["1", "2", "3"]
    },
    {
      id: "microtasks-drain-fully",
      title: "Microtasks drain fully — even nested ones",
      code: "setTimeout(() => console.log('t1'), 0);\nsetTimeout(() => console.log('t2'), 0);\nPromise.resolve().then(() => {\n  console.log('p1');\n  Promise.resolve().then(() => console.log('p2'));\n});",
      order: ["p1", "p2", "t1", "t2"],
      naiveGuess: ["t1", "t2", "p1", "p2"]
    }
  ]
};

if (typeof module !== "undefined") module.exports = { FACTS };
