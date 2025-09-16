// import { 
//      genBlankCompMap, findInt, 
//      checkMapForZero, indexIntsFromMap, 
//      trackCompletion
// } from './js/completion-map.js'

import { compareArr, removeDash } from './word-process.js'

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

export function returnAllIntFromMap(map, int) {
    
    let intIdx = []

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] == int) {
                intIdx.push([i, j])
            }
        }
    }

    return intIdx
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

        wordMatches = compareArr(targetZeros, utterArr, lang, 3)

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