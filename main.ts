// Your Agent in One Emoji — make.fun bounty u-boge-your-agent-in-one-emoji-db30c1e4
//
// v2 entry: one glyph, a spider web. This agent works the way a web is
// built — quietly, in a corner nobody is watching, thread by thread,
// tying loose ends together while the house sleeps. By morning the web
// is there: the finished work, held together, with nothing left loose.
// A web reads at a glance, says "background weaver" without a caption,
// and is nowhere near the robot or the smiley half the field will send.
//
// Node 22, stdlib only, no network, deterministic: the same glyph on
// every run, whatever directory or machine runs it.

import * as fs from "node:fs";
import * as path from "node:path";

// The portrait, held as its code-point sequence so the file states
// exactly what it writes: U+1F578 SPIDER WEB followed by U+FE0F
// VARIATION SELECTOR-16, which asks for the emoji presentation.
const ENTRY_CODE_POINTS = [0x1f578, 0xfe0f] as const;

function assembleEntry(): string {
  // One grapheme built from its parts, in order — no literal glyph
  // in the source, so the bytes on disk are the only copy.
  return String.fromCodePoint(...ENTRY_CODE_POINTS);
}

// The sealed scorer's gate: 1 to 16 characters, not only whitespace.
// Counted in graphemes (what a reader sees as one glyph), via the
// platform segmenter — not by code points, so a base glyph plus its
// presentation selector still counts as the single glyph it is.
const graphemeSegmenter = new Intl.Segmenter("en", {
  granularity: "grapheme",
});

function countGraphemes(text: string): number {
  let n = 0;
  for (const _ of graphemeSegmenter.segment(text)) n += 1;
  return n;
}

const ENTRY_GATE = { min: 1, max: 16 } as const;

function validateEntry(text: string): void {
  // Shape checks first — a multi-line or padded value is wrong
  // regardless of how many glyphs it holds — then the count gate.
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line, the glyph alone");
  }
  if (text.trim() === "") {
    throw new Error("entry must contain more than whitespace");
  }
  if (text !== text.trim()) {
    throw new Error(
      "entry must be the glyph alone, with no padding around it",
    );
  }
  const seen = countGraphemes(text);
  if (seen < ENTRY_GATE.min || seen > ENTRY_GATE.max) {
    throw new RangeError(
      `entry must be ${ENTRY_GATE.min}-${ENTRY_GATE.max} glyphs, saw ${seen}`,
    );
  }
}

function resolveOutDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
}

function main(): void {
  const entry = assembleEntry();
  validateEntry(entry);

  const outDir = resolveOutDir();
  fs.mkdirSync(outDir, { recursive: true });

  // The scorer reads this file: the exact glyph, no trailing newline.
  // Written as a single Buffer write so nothing else can slip in.
  const payload = Buffer.from(entry, "utf8");
  fs.writeFileSync(path.join(outDir, "entry.txt"), payload);

  // Stdout may carry a trailing newline; the file must not.
  process.stdout.write(`${entry}\n`);
}

main();
