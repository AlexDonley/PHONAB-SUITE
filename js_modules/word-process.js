// import { omitPunctuation, omitWords, parseColon, numToTexts, genWPStrToArr } from './word-process.js'
import { monocharLangs, charToPin } from './universal-phonics.js'


// arrays for processing numbers (numerals to strings)
const digitsObj = {
    allDigits: [
        [
        'zero', 'one', 'two', 'three', 'four', 
        'five', 'six', 'seven', 'eight', 'nine'
        ],
        [
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 
        'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
        ],
        [
        'zero', 'teen', 'twenty', 'thirty', 'forty', 
        'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
        ]
    ],
    chunkMarkers: ['thousand', 'million', 'billion']
}

// array of words to omit from target language and user input

const wordsToOmit = [
    "ah", "ahh", "aha", "mm", "mmm", 
    "hm", "hmm", "mhm", "uh", "ah", 
    "huh", "eh", "sh", "shh"
]

// Data to fetch

export var engHomophones;

function loadHomophones(){
    fetch('../../data/homo_en.json')
    .then(res => {
        if (res.ok) {
            console.log("Fetched English homophones");
        } else {
            console.log("Couldn't fetch English homophones")
        }
        return res.json()
    })
    .then(data => {
        engHomophones = data;
        return data;
    })
    .catch(error => console.log(error))
}

loadHomophones();

// export function buildHomophoneDict(arrArr) {
//   const dict = {};
//   for (const group of arrArr) {
//     for (const word of group) {
//       // Everything in the group except the word itself
//       dict[word] = group.filter(other => other !== word);
//     }
//   }
//   return dict;
// }

// Functions

export function omitPunctuation(str) {
    const noPunct = str.replace(/[.。…—,，\/#!！$%\^&\*;；{}=_`~()[\]?？]/g,"").replace(/\s+/g, " ");
    return noPunct;
}
    
export function omitWords(arr){
    for (let n=0; n < arr.length; n++){
        if(wordsToOmit.includes(arr[n])){
            arr.splice(n, 1);
        }
    }
    
    return arr;
}

export function compareWords(targStr, utterStr, lang) {
    
    // TO DO: add contractions check

    if (
        targStr == utterStr
        || removeDash(targStr) == removeDash(utterStr)
    ) {
        return true
    } else {

        // Homophone test
        // these are language-specific
        if (monocharLangs.includes(lang)) {

            if (charToPin(targStr) == charToPin(utterStr)) {
                return true
            } else {
                return false
            }

        } else {

            if (engHomophones[targStr] && engHomophones[targStr].includes(utterStr)) {
                return true
            } else {
                return false
            }
        }
    }
}

export function linearCompArr(targArr, utterArr, lang, flexNum) {
    
    let wordMatches = 0

    for (let i = 0; i < utterArr.length; i++) {
            
        if (wordMatches < targArr.length) {

            // the first check is to see if the words match, either identically or as homophones
            if (compareWords(targArr[wordMatches], utterArr[i], lang)) {
                
                wordMatches++;

            // the second check is for compound words
            // for instance, "shoemaker", "shoe-maker", and "shoe maker"
            // should all be considered the same
            } else {

                let newTarCompound = removeDash(targArr[wordMatches]);
                let newUttCompound = removeDash(utterArr[i]);
                
                let tarCompoundArr = [newTarCompound];
                let uttCompoundArr = [newUttCompound];
                
                for (let j = 1; j <= flexNum; j++) {
                    if (targArr[wordMatches + j]) {
                        newTarCompound += targArr[wordMatches + j];
                        tarCompoundArr.push(newTarCompound);
                    }
                    
                    if (utterArr[i + j]) {
                        newUttCompound += utterArr[i + j];
                        uttCompoundArr.push(newUttCompound);
                    }                       

                    //console.log(tarCompoundArr, uttCompoundArr);
                }

                const testTarIdx = tarCompoundArr.indexOf(uttCompoundArr[0]);
                const testUttIdx = uttCompoundArr.indexOf(tarCompoundArr[0]);
                const uttMax = Math.floor((testUttIdx - 1) / flexNum);

                if (testTarIdx > -1 || uttMax > -1) {
                    const newIdx = Math.max(testTarIdx, uttMax);

                    for (let k = 0; k < newIdx + 1; k++) {
                        wordMatches++;
                    }
                }
            }
        }
    }

    return wordMatches
}

export function clusterCompArr(targetArrLocal, utterArrLocal) {

    // TO DO: detect homophones, contractions, and compounds
    let rawScore = 0
    
    let targetOccs = {}
    let utterOccs = {}

    let revisedUtter = []
    let clustersMap = []
    let scoreMap = []
    
    const arrIntersect = targetArrLocal.filter(value => utterArrLocal.includes(value));
    console.log(arrIntersect)

    for (const word of targetArrLocal) {
        targetOccs[word] = targetOccs[word] ? targetOccs[word] + 1 : 1;
    }
    //console.log(targetOccs)

    for (const word of utterArrLocal) {
        if (utterOccs[word]) {
            if (utterOccs[word] < targetOccs[word]){
                utterOccs[word] += 1
                revisedUtter.push(word)
            }
            
        } else {
            if (arrIntersect.includes(word)) {
                utterOccs[word] = 1
                revisedUtter.push(word)
            }
        }
    }
    // console.log(utterOccs, revisedUtter)

    // this code will need some revision but it works for now

    for (const word in targetArrLocal) {
        clustersMap.push(0)
    }

    for (let i = 0; i < targetArrLocal.length; i++) {
        let clusterCount = 1

        if (
                revisedUtter.indexOf(targetArrLocal[i]) >= 0
                && clustersMap[i] == 0
            ) 
        {
            clustersMap[i] = "x"
            const indexOffset = revisedUtter.indexOf(targetArrLocal[i]) - i

            for (let j = 1; i + j < targetArrLocal.length; j++) {
                if (targetArrLocal[i + j] == revisedUtter[indexOffset + i + j]) {
                    clusterCount += 1
                    clustersMap[i + j] = "x"
                }    
            }

            for (let k = 0; k < clustersMap.length; k++) {
                if (clustersMap[k] == "x") {
                    clustersMap[k] = clusterCount
                }
            }
            console.log(clustersMap)
        }
    }

    // construct final  

    // find maximum and minimum in clustersMap
    let maxCluster = Math.max(...clustersMap)
    let minCluster = Math.min(...clustersMap)
    console.log(maxCluster, minCluster)

    clustersMap.forEach(value => {
        let thisIncrement = maxCluster

        if (thisIncrement) {
            thisIncrement = value / maxCluster
        }
        
        rawScore += thisIncrement
        scoreMap.push(thisIncrement)
    })

    // for (let n = 0; n < clustersMap.length; n++) {
    //     if (clustersMap[n] > 0) {
    //         if (clustersMap[n] == maxCluster) {
    //                 //targDisplay.children[n].classList.add("full-point")
    //                 rawScore += 1.0
    //         } else {
    //                 //targDisplay.children[n].classList.add("half-point")
    //                 rawScore += 0.5
    //         }
    //     }
    // }

    const percent = Math.round(100 * rawScore / targetArrLocal.length, 1)

    console.log(scoreMap, rawScore)
    return [scoreMap, rawScore]
}

export function parseColon(str) {
    // this function parses use of : in strings
    // if the : is in a timestamp, it stays
    // if the : is not in a timestamp, it's omitted
  
    const colonIndex = str.indexOf(":")

    if (
        colonIndex >= 0 &&
        (isNaN(str.substring(colonIndex - 1, colonIndex)) ||
        isNaN(str.substring(colonIndex + 1, colonIndex + 2)) ||
        colonIndex - 1 < 0 ||
        colonIndex + 1 >= str.length)
    ) {
        str = str.replace(/[:]/g,"")
    }

    return str
}

export function numToTexts(int, andBool) {
    // convert to string, so the argument 
    // can be a string or integer

    // the incoming argument must have no punctuation
    int = String(int)
    let chunksArr = []
    let newTextsArr = []
    
    const numeralLen = int.length
    const numOfChunks = Math.ceil(numeralLen / 3)
    const frontChunk = numeralLen % 3

    // chunk it
    for (let i = 0; i < numOfChunks; i++) {
        let thisChunk

        if (i == 0) {
            thisChunk = int.substring(0, frontChunk)
        } else {
            thisChunk = int.substring(
                frontChunk + ((i - 1) * 3), 
                frontChunk + 3 + ((i - 1) * 3)
            )
        }

        chunksArr.push(thisChunk)
    }

    // loop through the chunks
    for (let n = 0; n < numOfChunks; n++) {
        
        const chunkSplit = chunksArr[n].split('')
        const isAllZero = chunkSplit.every(item => item == 0)

        if (!isAllZero) {
            const bigOrd = numOfChunks - n
            const thisChunkLength = chunkSplit.length
            let chunkText = []
  
            for (let m = 0; m < chunkSplit.length; m++) {
                const smallOrd = thisChunkLength - m
              
                if (chunkSplit[m] > 0) {
                    if (smallOrd == 1 || smallOrd == 3 ) {

                        if (smallOrd == 1 && !(chunkSplit[m-1] == 1)) {
                            chunkText.push(digitsObj.allDigits[0][chunkSplit[m]])
                        }
                      
                        if (smallOrd == 3) {
                            chunkText.push(digitsObj.allDigits[0][chunkSplit[m]])  
                            chunkText.push('hundred')
                        }
                    } else {
                        if (chunkSplit[m] == 1) {
                            chunkText.push(digitsObj.allDigits[1][chunkSplit[m+1]])
                        } else {
                            chunkText.push(digitsObj.allDigits[2][chunkSplit[m]])
                        }
                    }
                }
            }
  
            newTextsArr = newTextsArr.concat(chunkText)
            if (bigOrd > 1) {
                newTextsArr.push(digitsObj.chunkMarkers[bigOrd - 2])
                if (andBool) {
                    newTextsArr.push('and')
                }
            }
        }
    }
    return newTextsArr;
}

export function genWPStrToArr(str, lang) {
    
    str = str.toLowerCase()
    
    str = omitPunctuation(str)

    let newArr
    
    if (monocharLangs.includes(lang)) {
        newArr = str.split('')
    } else {
        newArr = str.split(' ')
    }

    newArr = omitWords(newArr)

    let n = 0

    newArr.forEach(word => {

        //add a function to account for $, degrees, %, #

        if (!isNaN(word)) {
            newArr.splice(n, 1, ...numToTexts(word))
        }
        
        n++
    })

    return newArr
}

export function queueToArr(arr, lang) {
    
    let newArr = []

    arr.forEach(sentence => {
        newArr.push(genWPStrToArr(sentence, lang))
    })

    return newArr
}

export function removeDash(str) {
    return str.replace(/['-]/g,"");
}

export function checkArrOverlap(targArr, utterArr) {
    let matches = 0
    // let compIdx = 0
    
    for (let i = 0; i < targArr.length; i++) {
        for (let j = matches; j < utterArr.length; j++) {
            if (targArr[i] == utterArr[j]) {
                // compIdx++
                matches++
            }
        }
    }

    if (matches == targArr.length) {
        return true
    } else {
        return false
    }
}





// Claude-generated code

/**
 * utteranceMatcher.js
 *
 * Pipeline:  normalize -> expand target variants (#2) -> align using a
 *            pluggable match predicate (#3) -> score -> rich result (#7)
 * Config is layered: defaults -> fetched dictionary files -> text profile ->
 * per-call overrides (#6), with per-word overrides inside any layer.
 * Default dictionaries are JSON files fetched automatically (see
 * dictionarySources), so a page only needs: import { createComparer }.
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

// Resolved against THIS script's location (not the page's), so the defaults
// work no matter which page imports the module.
const defaultSource = (file) => new URL(`../data/${file}`, import.meta.url).href;

export const DEFAULT_CONFIG = {
  // Dictionary files fetched by createComparer(). Set a key to null to skip it,
  // or point it elsewhere (a profile can add e.g. mercy: "./hungry-mungry.json").
  dictionarySources: {
    contractions: defaultSource("contr_en.json"),
    homophones: defaultSource("homo_en.json"),
    mercy: null,
  },
  fetchOptions: {},           // passed to fetch(), e.g. { cache: "no-cache" } while editing
  dictionaryErrors: "throw",  // "throw" | "warn" (warn = continue without that dictionary)

  // Which equivalence sources are active. Can be overridden per word.
  equivalence: {
    contractions: true,
    compounds: true,
    homophones: true,
    mercy: true,
  },

  // Injectable data, not code. Defaults live in external JSON files; see
  // loadDictionaries.js. Keys/values are matched case-insensitively.
  dictionaries: {
    contractions: {}, // contraction -> expansion(s), e.g. "it's": [["it","is"],["it","has"]]
    homophones: [],   // groups of sound-alikes. Merged additively across layers.
    mercy: {},        // target word -> utterance words/phrases accepted in its place
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
/* Dictionary loading                                                  */
/* ------------------------------------------------------------------ */

const dictionaryCache = new Map(); // url -> Promise<json>, shared by all comparers

/** Forget fetched files (e.g. after editing a JSON file at runtime). */
export const clearDictionaryCache = () => dictionaryCache.clear();

async function getJSON(url, fetchOptions) {
  if (!dictionaryCache.has(url)) {
    const request = (async () => {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
      try {
        return await res.json();
      } catch (err) {
        throw new Error(`Invalid JSON in ${url}: ${err.message}`);
      }
    })();
    dictionaryCache.set(url, request);
    request.catch(() => dictionaryCache.delete(url)); // don't cache failures
  }
  return dictionaryCache.get(url);
}

/** Cheap shape checks so a typo in a JSON file fails loudly, not silently. */
const dictionaryValidators = {
  contractions: (d) =>
    isPlainObject(d) && Object.values(d).every((e) => Array.isArray(e) && e.length > 0),
  homophones: (d) =>
    Array.isArray(d) && d.every((g) => Array.isArray(g) && g.length > 1),
  mercy: (d) => isPlainObject(d) && Object.values(d).every(Array.isArray),
};

/** Fetches every non-null entry of config.dictionarySources into a config layer. */
async function loadDictionaries(config) {
  const { dictionarySources, fetchOptions, dictionaryErrors } = config;
  const dictionaries = {};

  await Promise.all(
    Object.entries(dictionarySources ?? {})
      .filter(([, url]) => url)
      .map(async ([kind, url]) => {
        try {
          if (!dictionaryValidators[kind]) throw new Error(`Unknown dictionary type: ${kind}`);
          const data = await getJSON(url, fetchOptions);
          if (!dictionaryValidators[kind](data)) {
            throw new Error(`${url} doesn't look like a valid ${kind} dictionary`);
          }
          dictionaries[kind] = data;
        } catch (err) {
          if (dictionaryErrors === "warn") console.warn(`[utteranceMatcher] ${err.message}`);
          else throw err;
        }
      })
  );

  return { dictionaries };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * createComparer(...layers) is async: it fetches the dictionary files named
 * in dictionarySources, then layers  defaults < files < your layers.
 *
 *   const cmp = await createComparer(hungryMungryProfile);
 *   const result = cmp.compare(targetWords, utteranceWords);   // compare is sync
 *
 * Load once at startup and reuse cmp. Files are cached across comparers.
 */
export async function createComparer(...layers) {
  const preliminary = resolveConfig(...layers); // just to read dictionarySources
  const fetched = await loadDictionaries(preliminary);
  return createComparerSync(fetched, ...layers);
}

/**
 * Synchronous variant: no fetching. Supply dictionaries inline (or from a
 * bundler's JSON import) via the layers. Handy for tests and offline use.
 */
export function createComparerSync(...layers) {
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