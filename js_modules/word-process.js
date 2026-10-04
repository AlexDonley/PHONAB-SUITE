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
    //console.log(arrIntersect)

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




import { createComparer, toScoreArray, makeFuzzyMatcher } from "../../js_modules/word-matcher.js";

const words = (s) => s.split(" ");
const show = (label, result) =>
  console.log(
    label.padEnd(34),
    JSON.stringify(toScoreArray(result)),
    `completion=${result.completion.toFixed(2)}`,
    `accuracy=${result.accuracy.toFixed(2)}`,
    result.extraneous.length ? `extra=[${result.extraneous.map((e) => e.token)}]` : ""
  );

// Your original cases, default config
const base = createComparer();
const target = words("I am Sam");
show("Sam I am", base.compare(target, words("Sam I am")));          // [1,1,0.5]
show("I am Dave", base.compare(target, words("I am Dave")));        // [1,1,0]
show("I am not Sam", base.compare(target, words("I am not Sam")));  // [1,1,1], accuracy < 1

// Contractions, both directions
show("target I'm / said I am", base.compare(words("I'm Sam"), words("I am Sam")));
show("target I am / said I'm", base.compare(words("I am Sam"), words("I'm Sam")));

// Homophones and compounds
show("their/there", base.compare(words("their dog"), words("there dog")));
show("well-known / well known", base.compare(words("a well-known author"), words("a well known author")));
show("well-known / wellknown", base.compare(words("a well-known author"), words("a wellknown author")));
show("every body / everybody", base.compare(words("every body"), words("everybody")));

// Text profile with mercy words
const hungryMungry = {
  dictionaries: { mercy: { mungry: ["hungry"] } },
  wordOverrides: { read: { equivalence: { homophones: false } } }, // "read" must be "read"
};
const hm = createComparer(hungryMungry);
show("Hungry Mungry w/ mercy", hm.compare(words("Hungry Mungry"), words("hungry hungry")));
show("Hungry Mungry no mercy", base.compare(words("Hungry Mungry"), words("hungry hungry")));

// Per-call strictness: out-of-order not recognized at all
const strict = createComparer({ outOfOrder: { mode: "none" } });
show("strict: Sam I am", strict.compare(target, words("Sam I am")));

// Proportional out-of-order credit + fuzzy fallback tier
const loose = createComparer({
  outOfOrder: { mode: "proportional" },
  matchers: [(a, b) => (a === b ? "exact" : false), makeFuzzyMatcher({ maxDistance: 1 })],
});
show("proportional: Sam I am", loose.compare(target, words("Sam I am")));
show("fuzzy: hungary", loose.compare(words("the hungry cat"), words("the hungary cat")));

// Rich result for UI use
console.log(JSON.stringify(hm.compare(words("Hungry Mungry sat at supper"), words("hungry hungry sat super")).words, null, 1));