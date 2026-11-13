// Τεστ με node: node tools/test-game.js
// Ελέγχει σύνταξη, μεταγλώττιση όλων των παραδειγμάτων (el/en), μηνύματα λαθών, εκφράσεις με πίνακες.
const fs = require("fs"), path = require("path");
const h = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const js = h.split("<script>")[1].split("</script>")[0];
new Function(js.replace(/^\s*\(\(\) => \{/, "return;(() => {")); // syntax check only
console.log("SYNTAX_OK");
const body = js.slice(js.indexOf("const norm"), js.indexOf("/* ======================= Σκηνή"));
const f = new Function("const $=()=>null;const esc=s=>s;const RT={cells:new Map(),line:0};" + body +
  ";return {EXAMPLES,compile,ev,RT,E,firstSteps,instantiate,setLang:l=>{LANG=l}};");
const { EXAMPLES, compile, ev, RT, E, firstSteps, instantiate, setLang } = f();
const desc = c => c.raw + ":" + c.type + (c.isArr ? "[" + c.dims.join("x") + "]" : "") + (c.isConst ? "=" + c.value : "") + (c.isParam ? "(p)" : "") + (c.isResult ? "(ret)" : "");
for (const lang of ["el", "en"]) {
  setLang(lang);
  for (const ex of EXAMPLES) {
    try {
      const p = compile(ex[lang].src);
      const subs = [...p.subs.values()].map(u => `${u.kind} ${u.raw}(${u.params.map(x => x.raw)})${u.rtype ? ":" + u.rtype : ""} {${[...u.tcells.values()].map(desc)}}`).join(" ; ");
      console.log("OK ", lang, ex[lang].name, "->", [...p.cells.values()].map(desc).join(", "), subs ? "|| " + subs : "");
    } catch (e) { console.log("ERR", lang, ex[lang].name, e.line, e.message); }
  }
}
const P0 = "ΠΡΟΓΡΑΜΜΑ Χ\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: α, Β[3]\nΑΡΧΗ\n";
const SUBP = "\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ\nΔΙΑΔΙΚΑΣΙΑ Δ(χ)\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: χ\nΑΡΧΗ\n χ <- 1\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ\nΣΥΝΑΡΤΗΣΗ Σ(κ): ΑΚΕΡΑΙΑ\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: κ\nΑΡΧΗ\n Σ <- κ\nΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ";
const bad = [
  P0 + " ΚΑΛΕΣΕ Ζ(α)" + SUBP,
  P0 + " ΚΑΛΕΣΕ Σ(α)" + SUBP,
  P0 + " α <- Δ(α)" + SUBP,
  P0 + " ΚΑΛΕΣΕ Δ(α, α)" + SUBP,
  P0 + " ΚΑΛΕΣΕ Δ(Β)" + SUBP,
  P0 + " Δ(α)" + SUBP,
  P0 + " α <- 1\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ\nΔΙΑΔΙΚΑΣΙΑ Δ(χ)\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: ψ\nΑΡΧΗ\n ψ <- 1\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ",
  P0 + " α <- 1\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ\nΣΥΝΑΡΤΗΣΗ Σ(κ)\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: κ\nΑΡΧΗ\n Σ <- κ\nΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ",
  P0 + " α <- 1\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ\nΔΙΑΔΙΚΑΣΙΑ Δ(χ)\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: χ\nΑΡΧΗ\n α <- χ\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ",
  P0 + " α <- 1\nΔΙΑΔΙΚΑΣΙΑ Δ(χ)\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ",
];
setLang("el");
for (const b of bad) { try { compile(b); console.log("NO ERROR?!"); } catch (e) { console.log("err line", e.line, ":", e.message); } }
setLang("en");
try { compile(bad[1]); } catch (e) { console.log("en:", e.message); }
// εκφράσεις με πίνακες (όπως πριν)
setLang("el");
const H = "ΠΡΟΓΡΑΜΜΑ Χ\nΜΕΤΑΒΛΗΤΕΣ\n ΑΚΕΡΑΙΕΣ: Α[5], Π[2,3], ι\nΑΡΧΗ\n";
const p = compile(H + " Α[ι + 1] <- Α[ι] + Π[2, ι]\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ");
RT.cells = instantiate(p.main);
const A = RT.cells.get("Α"), PP = RT.cells.get("Π"), I = RT.cells.get("Ι");
I.value = 2; A.vals[1] = 10; PP.vals[1 * 3 + 1] = 7;
console.log("Α[ι] + Π[2, ι] =", ev(p.main.body[0].e), "(expected 17); steps =", firstSteps(p.main.body[0]), "(expected 8)");
// ταμπέλα με αναφορά: η χ δείχνει στο α
const q = compile(P0 + " α <- 1" + SUBP);
const mainCells = instantiate(q.main); mainCells.get("Α").value = 42;   // απλή μεταβλητή α (κανονικοποιημένο όνομα «Α»)
const sub = q.subs.get("Δ"), subCells = instantiate(sub);
const target = mainCells.get("Α");
subCells.set("Χ", {isAlias:true, raw:"χ", n:"Χ", type:"ΑΚΕΡΑΙΑ", slot:{c:target, flat:-1, name:"α"}});
RT.cells = subCells;
console.log("alias read χ →", ev({t:"var", n:"Χ", raw:"χ"}), "(expected 42)");
