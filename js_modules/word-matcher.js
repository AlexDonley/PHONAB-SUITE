/**
 * utteranceMatcher.js
 *
 * Pipeline:  normalize -> expand target variants (#2) -> align using a
 *            pluggable match predicate (#3) -> score -> rich result (#7)
 * Config is layered: defaults -> text profile -> per-call overrides (#6),
 * with per-word overrides inside any layer.
 *
 * "Equivalence" (what counts as the same) lives in variants + matchers.
 * "Alignment" (how matches are arranged) lives in alignInOrder / placeOutOfOrder.
 * "Scoring policy" (how much penalties matter) lives in buildResult.
 */

/* ------------------------------------------------------------------ */
/* Matchers (#3): (targetToken, utteranceToken, ctx) => label | false  */
/* ------------------------------------------------------------------ */

export const exactMatcher = (a, b) => (a === b ? "exact" : false);

/** Optional fallback tier. Length guard keeps "cat"/"hat" from matching. */
export function makeFuzzyMatcher({ maxDistance = 1, minLength = 5 } = {}) {
  return (a, b) =>
    a.length >= minLength &&
    b.length >= minLength &&
    levenshtein(a, b) <= maxDistance
      ? "fuzzy"
      : false;
}

function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/* ------------------------------------------------------------------ */
/* Config (#6)                                                         */
/* ------------------------------------------------------------------ */

export const DEFAULT_CONFIG = {
  // Which equivalence sources are active. Can be overridden per word.
  equivalence: {
    contractions: true,
    compounds: true,
    homophones: true,
    mercy: true,
  },

  // Injectable data, not code. Keys/values are matched case-insensitively.
  dictionaries: {
    // contraction -> expansion(s). Use an array of arrays for ambiguous ones.
    contractions: {
      "i'm": ["i", "am"],
      "you're": ["you", "are"],
      "we're": ["we", "are"],
      "they're": ["they", "are"],
      "it's": [["it", "is"], ["it", "has"]],
      "he's": [["he", "is"], ["he", "has"]],
      "she's": [["she", "is"], ["she", "has"]],
      "that's": ["that", "is"],
      "don't": ["do", "not"],
      "can't": ["can", "not"],
      "won't": ["will", "not"],
      "i'll": ["i", "will"],
      "i've": ["i", "have"],
      "would've": ["would", "have"],
    },
    // Groups of words that sound alike. Merged additively across layers.
    homophones: [
      ["their", "there"],
      ["to", "too", "two"],
      ["for", "four"],
      ["no", "know"],
      ["write", "right"],
      ["sea", "see"],
    ],
    // target word -> utterance words/phrases accepted in its place.
    mercy: {},
  },

  // Per-word overrides, keyed by lowercase target word, e.g.
  //   mungry: { mercy: ["hungry"] }
  //   read:   { equivalence: { homophones: false } }
  wordOverrides: {},

  // Predicate tiers, tried in order for each token pair.
  matchers: [exactMatcher],

  outOfOrder: {
    mode: "flat",     // "none" | "flat" | "proportional"
    flatValue: 0.5,   // used by "flat"
    max: 0.9,         // "proportional": credit at zero displacement
    min: 0.25,        // "proportional": floor credit
  },

  // Affects ONLY the accuracy score, never the per-word completion data.
  accuracy: {
    outOfOrderCredit: 0.5,  // fraction of a word an out-of-order word is worth (1 = no penalty)
    extraneousWeight: 0.5,  // each extraneous word adds this much to the denominator (0 = no penalty)
  },
};

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

function merge(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra ?? {})) {
    out[k] = isPlainObject(v) && isPlainObject(base[k]) ? merge(base[k], v) : v;
  }
  return out;
}

/** defaults -> ...layers (e.g. text profile, per-call overrides). */
export function resolveConfig(...layers) {
  return layers.reduce((cfg, layer) => {
    const merged = merge(cfg, layer);
    // Homophone groups add up instead of replacing each other.
    merged.dictionaries = {
      ...merged.dictionaries,
      homophones: [
        ...cfg.dictionaries.homophones,
        ...(layer?.dictionaries?.homophones ?? []),
      ],
    };
    return merged;
  }, DEFAULT_CONFIG);
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

function normalizeWord(w) {
  return String(w)
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'\-\s]/gu, "")
    .trim()
    .replace(/^['-]+|['-]+$/g, "");
}

/** Utterance: lowercase, strip punctuation, split on whitespace AND dashes. */
function normalizeUtterance(words) {
  return words
    .flatMap((w) =>
      String(w)
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .split(/[\s\-\u2013\u2014]+/)
    )
    .map(normalizeWord)
    .filter(Boolean);
}

const asExpansions = (e) => (Array.isArray(e[0]) ? e : [e]);

/* ------------------------------------------------------------------ */
/* Lookups built once per config                                       */
/* ------------------------------------------------------------------ */

function buildLookups(config) {
  const { contractions, homophones, mercy } = config.dictionaries;

  const forward = {}; // "i'm" -> [["i","am"]]
  const reverse = {}; // "i am" -> ["i'm"]
  for (const [c, exp] of Object.entries(contractions)) {
    const key = normalizeWord(c);
    const list = asExpansions(exp).map((t) => t.map(normalizeWord));
    forward[key] = list;
    for (const e of list) (reverse[e.join(" ")] ??= []).push(key);
  }

  const homophoneOf = {}; // word -> Set of sound-alikes
  for (const group of homophones) {
    const g = group.map(normalizeWord);
    for (const w of g) {
      const set = (homophoneOf[w] ??= new Set());
      for (const x of g) if (x !== w) set.add(x);
    }
  }

  const mercyOf = {};
  for (const [k, list] of Object.entries(mercy)) {
    mercyOf[normalizeWord(k)] = list.map(normalizeWord);
  }

  const overrides = {};
  for (const [k, v] of Object.entries(config.wordOverrides ?? {})) {
    overrides[normalizeWord(k)] = v;
  }

  return { forward, reverse, homophoneOf, mercyOf, overrides };
}

/* ------------------------------------------------------------------ */
/* #2: Target-side variant expansion                                   */
/* A variant = { tokens, span, type }                                  */
/*   tokens: utterance tokens that satisfy it                          */
/*   span:   how many TARGET words it covers (2 for "i","am" -> "i'm") */
/* ------------------------------------------------------------------ */

function variantsFor(i, words, config, L) {
  const out = [];
  const seen = new Set();
  const add = (tokens, span, type) => {
    const key = `${tokens.join(" ")}|${span}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ tokens, span, type });
    }
  };

  const w = words[i];
  const override = L.overrides[w] ?? {};
  const eq = { ...config.equivalence, ...(override.equivalence ?? {}) };

  // Every acceptable single-word form: itself, sound-alikes, mercy words.
  const forms = [{ form: w, type: "exact" }];
  if (eq.homophones)
    for (const h of L.homophoneOf[w] ?? []) forms.push({ form: h, type: "homophone" });
  if (eq.mercy)
    for (const m of [...(L.mercyOf[w] ?? []), ...(override.mercy ?? []).map(normalizeWord)])
      forms.push({ form: m, type: "mercy" });

  for (const { form, type } of forms) {
    // The utterance is dash-split, so a hyphenated form must be split too.
    add(form.split(/[\s-]+/).filter(Boolean), 1, type);
    if (eq.compounds && /[\s-]/.test(form)) add([form.replace(/[\s-]+/g, "")], 1, "compound");
    if (eq.contractions)
      for (const exp of L.forward[form] ?? []) add(exp, 1, "contraction");
  }

  // Multi-word spans: ["i","am"] <-> "i'm", ["every","body"] <-> "everybody".
  for (let len = 2; len <= 3 && i + len <= words.length; len++) {
    const slice = words.slice(i, i + len);
    if (eq.contractions)
      for (const c of L.reverse[slice.join(" ")] ?? []) add([c], len, "contraction");
    if (eq.compounds && len === 2)
      add([slice.join("").replace(/-/g, "")], 2, "compound");
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* #3: Pluggable predicate over spans                                  */
/* ------------------------------------------------------------------ */

/** Returns a label ("exact", "fuzzy", ...) if the span matches at utt[j], else null. */
function matchSpan(tokens, utt, j, matchers, ctx) {
  if (j + tokens.length > utt.length) return null;
  let label = "exact";
  for (let k = 0; k < tokens.length; k++) {
    let hit = false;
    for (const matcher of matchers) {
      const r = matcher(tokens[k], utt[j + k], ctx);
      if (r) {
        hit = r === true ? matcher.name || "custom" : r;
        break;
      }
    }
    if (!hit) return null;
    if (hit !== "exact") label = hit;
  }
  return label;
}

/* ------------------------------------------------------------------ */
/* Alignment                                                           */
/* ------------------------------------------------------------------ */

/**
 * Pass 1: LCS-style DP that maximizes the number of target words matched
 * in order. Unlike a plain LCS, a match step can consume several tokens on
 * either side (that's what makes contractions/compounds work).
 */
function alignInOrder(variants, utt, matchers, ctx) {
  const n = variants.length;
  const m = utt.length;
  const best = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  const choice = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m; j >= 0; j--) {
      let bestVal = best[i + 1][j]; // default: skip this target word
      let bestChoice = null;

      if (j < m && best[i][j + 1] > bestVal) {
        bestVal = best[i][j + 1]; // skip this utterance token
        bestChoice = "skipUtt";
      }

      let matchVal = -1;
      let matchChoice = null;
      for (const v of variants[i]) {
        const label = matchSpan(v.tokens, utt, j, matchers, ctx);
        if (!label) continue;
        const val = v.span + best[i + v.span][j + v.tokens.length];
        if (val > matchVal) {
          matchVal = val;
          matchChoice = { variant: v, label };
        }
      }
      // Ties go to matching (and to the earliest, i.e. most exact, variant).
      if (matchChoice && matchVal >= bestVal) {
        bestVal = matchVal;
        bestChoice = matchChoice;
      }

      best[i][j] = bestVal;
      choice[i][j] = bestChoice;
    }
  }

  // Backtrack.
  const placements = new Array(n).fill(null);
  const used = new Array(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n) {
    const c = choice[i][j];
    if (c === null) i++;
    else if (c === "skipUtt") j++;
    else {
      const { variant, label } = c;
      for (let k = 0; k < variant.span; k++) {
        placements[i + k] = {
          label: label === "exact" ? variant.type : label,
          start: j,
          len: variant.tokens.length,
          inOrder: true,
        };
      }
      for (let k = 0; k < variant.tokens.length; k++) used[j + k] = true;
      i += variant.span;
      j += variant.tokens.length;
    }
  }
  return { placements, used };
}

function outOfOrderCredit(displacement, n, m, cfg) {
  if (cfg.mode === "flat") return cfg.flatValue;
  const scale = Math.max(n, m, 1);
  return Math.max(cfg.min, cfg.max * (1 - displacement / scale));
}

/** Pass 2: leftover target words look for leftover utterance tokens anywhere. */
function placeOutOfOrder(variants, utt, placements, used, config, ctx) {
  const { mode } = config.outOfOrder;
  if (mode === "none") return;
  const n = variants.length;

  for (let i = 0; i < n; i++) {
    if (placements[i]) continue;
    let found = null;

    for (const v of variants[i]) {
      if (v.span > 1 && placements.slice(i, i + v.span).some(Boolean)) continue;
      for (let j = 0; j + v.tokens.length <= utt.length; j++) {
        if (used.slice(j, j + v.tokens.length).some(Boolean)) continue;
        const label = matchSpan(v.tokens, utt, j, config.matchers, ctx);
        if (!label) continue;
        const displacement = Math.abs(j - i);
        if (!found || displacement < found.displacement) {
          found = { v, label, j, displacement };
        }
      }
    }

    if (found) {
      const { v, label, j, displacement } = found;
      const score = outOfOrderCredit(displacement, n, utt.length, config.outOfOrder);
      for (let k = 0; k < v.span; k++) {
        placements[i + k] = {
          label: label === "exact" ? v.type : label,
          start: j,
          len: v.tokens.length,
          inOrder: false,
          score,
        };
      }
      for (let k = 0; k < v.tokens.length; k++) used[j + k] = true;
    }
  }
}

/* ------------------------------------------------------------------ */
/* #7: Rich result + scoring policy                                    */
/* ------------------------------------------------------------------ */

function buildResult(targetWords, utt, placements, used, config) {
  const words = targetWords.map((word, index) => {
    const p = placements[index];
    if (!p) {
      return { word, index, score: 0, matchType: null, matchedAs: null, inOrder: null, utteranceIndex: null };
    }
    return {
      word,
      index,
      score: p.inOrder ? 1 : p.score,
      matchType: p.label,
      matchedAs: utt.slice(p.start, p.start + p.len).join(" "),
      inOrder: p.inOrder,
      utteranceIndex: p.start,
    };
  });

  const extraneous = utt
    .map((token, index) => ({ token, index }))
    .filter(({ index }) => !used[index]);

  const n = words.length;
  const completion = n ? words.reduce((s, w) => s + w.score, 0) / n : 0;

  // Accuracy is where the penalties live.
  const { outOfOrderCredit: ooo, extraneousWeight } = config.accuracy;
  const credit = words.reduce(
    (s, w) => s + (w.inOrder === true ? 1 : w.inOrder === false ? ooo : 0),
    0
  );
  const accuracy = n ? Math.min(1, credit / (n + extraneous.length * extraneousWeight)) : 0;

  return { words, extraneous, completion, accuracy };
}

/** Backward-compatible [1, 1, 0.5] array. */
export const toScoreArray = (result) => result.words.map((w) => w.score);

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * createComparer(profile, overrides?) resolves config and builds lookups once.
 *   const cmp = createComparer(hungryMungryProfile);
 *   const prepared = cmp.prepare(targetWords);       // optional, cache per text
 *   const result = cmp.compare(prepared, utteranceWords);
 */
export function createComparer(...layers) {
  const config = resolveConfig(...layers);
  const L = buildLookups(config);
  const ctx = { config };

  function prepare(targetWords) {
    const words = targetWords.map(normalizeWord);
    return {
      original: targetWords,
      variants: words.map((_, i) => variantsFor(i, words, config, L)),
    };
  }

  function compare(target, utteranceWords) {
    const prepared = Array.isArray(target) ? prepare(target) : target;
    const utt = normalizeUtterance(utteranceWords);
    const { placements, used } = alignInOrder(prepared.variants, utt, config.matchers, ctx);
    placeOutOfOrder(prepared.variants, utt, placements, used, config, ctx);
    return buildResult(prepared.original, utt, placements, used, config);
  }

  return { config, prepare, compare };
}