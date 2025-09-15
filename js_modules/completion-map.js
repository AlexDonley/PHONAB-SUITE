// import { 
//      genBlankCompMap, findInt, 
//      checkMapForZero, indexIntsFromMap, 
//      trackCompletion
// } from './js/completion-map.js'

import { compareWords, removeDash } from './word-process.js'

// compound flexibility
const compFlex = 2

export function genBlankCompMap(arrOfArrs) {
    let compMap = []
    let wordCount = 0
    
    arrOfArrs.forEach(innerArr => {

        let sentMap =[]

        innerArr.forEach(word => {
            sentMap.push(0)
            wordCount++
        })

        compMap.push(sentMap)
    })

    console.log(compMap, wordCount)
    return [compMap, wordCount]
}

export function findInt(arr, int) {
    return arr.indexOf(int)
}

export function checkMapForZero(map, startN) {
    
    for (let n = startN; n < map.length; n++) {
        const check = findInt(map[n], 0)
        
        if (check > -1) {
            return [n, check]
        }
    }

    return false
}

export function checkArrForZero(arr) {
    let checkZero = arr.indexOf(0)

    if (checkZero > -1) {
        return checkZero
    } else {
        return false
    }
}

export function checkMapForInt(map, int) {
    for (let n = 0; n < map.length; n++) {
        const check = findInt(map[n], int)
        
        if (check > -1) {
            return [n, check]
        }
    }

    return false
}

export function indexIntsFromMap(map, int) {
    let indeces = []

    for (let n = 0; n < map.length; n++) {
        
        for (let m = 0; m < map[n].length; m++) {
            if (map[n][m] == int) {
                indeces.push([n, m])
            }
        }
    }

    return indeces
}

export function trackCompletion(targetArr, utterArr, mode, lang, compArrNow) {
    
    let compArrNew = compArrNow
    let wordMatches = 0

    if (mode == 'linear') {

        // reconstruct array of target words based on completion map
        // all target words that have a value of 0 may be added

        let targetZeros = []
        for (let h = 0; h < compArrNow.length; h++) {
            if (compArrNow[h] == 0) {
                targetZeros.push(targetArr[h])
            }
        }

        console.log(targetZeros)

        for (let i = 0; i < utterArr.length; i++) {
            
            if (wordMatches < targetZeros.length) {

                // the first check is to see if the words are identical
                if (compareWords(targetZeros[wordMatches], utterArr[i], lang)) {
                    
                    wordMatches++;

                // the second check is for compound words
                // for instance, "shoemaker", "shoe-maker", and "shoe maker"
                // should all be considered the same
                } else {

                    let newTarCompound = removeDash(targetZeros[wordMatches]);
                    let newUttCompound = removeDash(utterArr[i]);
                    
                    let tarCompoundArr = [newTarCompound];
                    let uttCompoundArr = [newUttCompound];
                    
                    for (let j = 1; j <= compFlex; j++) {
                        if (targetZeros[wordMatches + j]) {
                            newTarCompound += targetArr[wordMatches + j];
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
                    const uttMax = Math.floor((testUttIdx - 1) / compFlex);

                    if (testTarIdx > -1 || uttMax > -1) {
                        const newIdx = Math.max(testTarIdx, uttMax);

                        for (let k = 0; k < newIdx + 1; k++) {
                            wordMatches++;
                        }
                    }
                }
            }
        }

        for (let j = 0; j < wordMatches; j++) {
            let replaceIdx = checkArrForZero(compArrNew)
            compArrNew[replaceIdx] = 1
        }

    }

    return [compArrNew, wordMatches]
}

export function mapToFreqs(map) {
    
    let total = 0
    let freqs = {}

    for (const arr of map) {
        total += arr.length
        
        for (const val of arr) {
            freqs[val] = freqs[val] ? freqs[val] + 1 : 1;
        }
    }
    
    return [freqs, total]
}

export function findPercent(frac, total) {
    
    let percentNum = 0
    
    if (!isNaN(frac)) {
        percentNum = 100 * frac / total
    }

    return percentNum
}

export function mapToAwardArr(mapArrs) {
    
    // this function constructs an array that counts the number of each value
    // the first value is for 0s (gray)
    // the second value is for -1s (yellow)
    // the third value is for 1s (green)
    let arrValues = [0, 0, 0]

    mapArrs.forEach(arr => {
        arr.forEach(val => {
            switch(val){
                case 0:
                    arrValues[0] += 1
                    break;
                case -1:
                    arrValues[1] += 1
                    break;
                case 1:
                    arrValues[2] += 1
                    break;
            }
        })
    })

    return arrValues
}