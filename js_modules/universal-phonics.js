// import { monocharLangs, parseAndCaption } from './js/universal-phonics.js'


// CONSTANTS FOR ENGLISH & IPA

// check these consonants for combinations with the /i/ vowel
const consCheck = ['dʒ', 'tʃ', 'ʃ'];
// check these vowels for combinations with word-final 
// /n/ or /ŋ/ sounds
const vowCheck = ['ʌ', 'ɛ', 'i', 'ɪ', 'ɔ']


// CONSTANTS FOR CHINESE

export const monocharLangs = [
    'zh', 'cmn', 'cmn-Hans', 'cmn-Hant', 
    'zh-TW', 'yue-Hant-HK', 'zh-CN', 
    'cmn-Hans-CN', 'cmn-Hant-TW'
]

const umlaut = 'u' + '\u0308'
const vowelHierarchy = ['a', 'o', 'e', 'i', 'u', 'v']
const pinyinDiacritics = ['\u0304', '\u0301', '\u030C', '\u0300']
const zhuyinDiacritics = ['⸍','∨','⸌','∙']
const zhuyinDiacritics2 = ['ˊ','ˇ','ˋ','∙']
const zhuyinDiacritics3 = ['╱⸝','ˇ','╲⸜','•']

const pinyinCons = [
    'b', 'p', 'm', 'f', 
    'd', 't', 'n', 'l', 
    'g', 'k', 'h',
    'j', 'q', 'x',
    'z', 'c', 's', 'r'
]



// const userText = document.querySelector('.user-text');
// const transText = document.querySelector('.trans-text');


// FETCH DATA

let engIpa = [];
let ipaToZhu = [];

function fetchEngIPA() {
    fetch("../../data/syll_ipa.json")
    .then(res => res.json())
    .then(data => {
        console.log('Successfully fetched English IPA syllables.');
        engIpa = data;
        console.log(engToIPAArr("it's"))
        fetchIPAtoZhu();
    })
}

function fetchIPAtoZhu() {
    fetch("../../data/ipa_to_zhu.json")
    .then(res => res.json())
    .then(data => {
        console.log('Successfully fetched IPA to zhuyin dict.');
        ipaToZhu = data;

        // test successful fetching and functions with the example "friday"
        const testArr = engToIPAArr('friday');
        const revArr = reviseIpaArr(testArr);
        console.log(ipaToZY(revArr));
    })
}

export let pinyinKeys
let zhuyinDict

function getZhChars() {
    fetch('../../data/py_trad_monochars.json')
    .then(res => {
        if (res.ok) {
            console.log("Fetched chars to Pinyin.")
        } else {
            console.log("Couldn't fetch chars to Pinyin.")
        }
        return res.json()
    })
    .then(data => {
        pinyinKeys = data;
    })
    .catch(error => console.log(error))
}

function getPinZhuDict() {
    fetch('../../data/py_to_zy.json')
    .then(res => {
        if (res.ok) {
            console.log("Fetched Pinyin to Zhuyin.")
        } else {
            console.log("Couldn't fetch Pinyin to Zhuyin.")
        }
        return res.json()
    })
    .then(data => {
        zhuyinDict = data;
    })
    .catch(error => console.log(error))
}

fetchEngIPA()
getPinZhuDict()
getZhChars()

// END OF FETCH DATA

export function parseAndCaption(word, caption, lang, elem) {
    
    if (elem) {
        elem.classList = ''
    }
    
    if (!(caption == 'false')) {
        switch (lang){
            case 'en':
                switch (caption) {
                    case 'IPA':
                        return engToIPAStr(word)
                    case 'Zhuyin':
                        return engToZhuyin(word)
                }
                break;

            case 'cmn-Hant':
                switch (caption) {
                    case 'Pinyin':
                        return pinNumToDiacritic(charToPin(word))
                    case 'Zhuyin':
                        return charToZhu(word)
                    case 'Tai-lo':
                        break;
                }
                break;

            case 'fil-PH':
                switch (caption) {
                    case 'Baybayin':
                        elem.classList.add('baybayin')
                        return romanToBBY93(word, true)
                }
                break;
        }
    } else {
        return ""
    }
}

export function engToIPAArr(str) {

    const thisIpa = engIpa[str]
    if (thisIpa) {
        return thisIpa;
    } else {
        return null
    }
        
}

function engToIPAStr(str) {

    const IpaWSyll = engToIPAArr(str)

    if (IpaWSyll) {
        let buildStr = ''

        IpaWSyll.forEach(syll => {
            buildStr += syll.join('')
        })

        return buildStr
    } else {
        return null
    }
}

function reviseIpaArr(arr) {
    let newArr = [...arr];
    
    newArr.forEach(syll => {
        for (let i = 0; i < syll.length; i++){
            if (consCheck.includes(syll[i]) && ['i', 'ɪ'].includes(syll[i+1])) {
                const combined = syll[i] + syll[i + 1];
                console.log(combined)
                syll.splice(i, 1, combined);
            }
    
            if (['n', 'ŋ'].includes(syll[i]) && vowCheck.includes(syll[i-1])) {
                const combined = syll[i - 1] + syll[i];
                syll.splice(i - 1, 2, combined);
            }
        }
    })

    console.log(newArr);
    return newArr
}

function ipaToZY(arr) {
    let newArr = [];
    
    arr.forEach(syll => {
        syll.forEach(letter => {
            newArr.push(ipaToZhu[0][letter]);
        })
    });

    return newArr;
}

export function engToZhuyin(str) {
    let zhuStr = '';

    const thisIpa = engToIPAArr(str);

    if (thisIpa) {
        const revIpa = reviseIpaArr(thisIpa);
        const thisZY = ipaToZY(revIpa);

        thisZY.forEach(zhu => {
            zhuStr = zhuStr.concat(zhu);
        })

        console.log(zhuStr)
        return zhuStr
    } else {
        return ""
    }

}


// FUNCTIONS ON CHINESE, PINYIN, & ZHUYIN

export function splitPinyin(str) {
    const letterStr = str.substring(0, str.length - 1)
    const toneNum = str.substring(str.length - 1)

    return [letterStr, toneNum]
}

export function charToPin(char) {
    const pinIndex = pinyinKeys.findIndex(({ trad }) => trad === char)
    
    if (pinIndex >= 0) {
        return pinyinKeys[pinIndex].pin1[0]
    } else {
        return false
    }
}

export function charToZhu(char) {
    const pinyin = charToPin(char)
    const zhuyin = pinToZhu(pinyin)

    return zhuyin
}

export function pinToZhu(pin) {
    
    // console.log(pin)
    const pinSplit = splitPinyin(pin)
    const syll = pinSplit[0]
    const tone = pinSplit[1]
    
    let divideIndex = 0
    let zhuOnset = ''
    let zhuCoda = ''

    if (syll.substring(1, 2) == 'h') {
        divideIndex = 2
    } else if (pinyinCons.includes(syll.substring(0, 1))) {
        divideIndex = 1
    }

    const pinOnset = syll.slice(0, divideIndex)
    const pinCoda = syll.slice(divideIndex)

    if (pinOnset.length > 0) {
        zhuOnset = zhuyinDict[0][pinOnset]
    }

    // the pinyin syllables 'zhi', 'chi', 'shi', and 'ri' do not use a vowel in zhuyin
    // they must be written without a coda
    if (['zh', 'ch', 'sh', 'r'].includes(pinOnset) && pinCoda == 'i') {
        zhuCoda = ''

    // the pinyin codas 'u', 'un', and 'uan' translate to different zhuyin vowels depending on context
    // if they come after 'j', 'q', or 'x', then they will begin with the vowel ㄩ
    // otherwise, they will being with the vowel ㄨ
    } else if (['u', 'un', 'uan'].includes(pinCoda)) {
        if (['j', 'q', 'x'].includes(pinOnset)) {
            zhuCoda = zhuyinDict[1][pinCoda][1]
        } else {
            zhuCoda = zhuyinDict[1][pinCoda][0]
        }
    
    // if the pinyin doesn't fall into one of these exceptions, the coda may be translated normally
    } else {
        zhuCoda = zhuyinDict[1][pinCoda]
    }

    const fullZhuyin = zhuOnset + zhuCoda

    return [fullZhuyin, tone]
}

export function pinNumToDiacritic(char) {

    const charArr = splitPinyin(char)
    const toneNum = charArr[1]

    let thisDiacritic = ''
    let newStr = charArr[0]
    
    if (toneNum < 5) {
        thisDiacritic = pinyinDiacritics[toneNum - 1]

        const letterArr = newStr.split('')

        let i = 0

        while (!(letterArr.includes(vowelHierarchy[i]))){
            i++
        }

        const diaIndex = letterArr.indexOf(vowelHierarchy[i]) + 1

        if (letterArr.includes('v')) {
            newStr = newStr.slice(0, diaIndex - 1) 
                    + umlaut 
                    + thisDiacritic 
                    + newStr.slice(diaIndex, newStr.length)
        } else {
            newStr = newStr.slice(0, diaIndex) 
                    + thisDiacritic 
                    + newStr.slice(diaIndex, newStr.length)
        }
    }

    return newStr
}

function diacriticToPinNum(str){
    if (str.includes('ˊ')) {
        return 2;
    } else if (str.includes('ˇ')) {
        return 3;
    } else if (str.includes('ˋ')) {
        return 4;
    } else if (str.includes('˙')) {
        return 5;
    } else {
        return 1;
    }
}

const filCons = ['b', 'c', 'k', 'd', 'g', 'h', 'l', 'm', 'n', 'N', 'p', 'r', 's', 't', 'w', 'y']
const filVows = ['a', 'e', 'i', 'o', 'u']
const filNonStandard = {
    'c': 'k',
    'f': 'p', 
    'j': 'dy',
    'q': 'kw', 
    'v': '', 
    'x': 'eks', 
    'z': ''
}

function romanToBBY93(str, diacriticBool) {
    const initArr = str.split('')
    let finalArr = [];    

    for (let i = 0; i < initArr.length; i++) {
        switch (initArr[i]) {
            // TO DO: change to address all non-standard cases
            case 'c':
                finalArr.push('k')
                break;
            case 'n':
                if (initArr[i + 1] == 'g') {
                    finalArr.push('N')
                    i++
                } else {
                    finalArr.push(initArr[i])
                }
                break;
            case 'a':
                if (!filCons.includes(initArr[i - 1])) {
                    finalArr.push('a')
                }
                break;
            case 'i':
            case 'e':
                if (!filCons.includes(initArr[i - 1])) {
                    finalArr.push('I')
                } else if (diacriticBool) {
                    finalArr.push(initArr[i])
                }
                break;
            case 'o':
            case 'u':
                if (!filCons.includes(initArr[i - 1])) {
                    finalArr.push('O')
                } else if (diacriticBool) {
                    finalArr.push(initArr[i])
                }
                break;
            case ' ':
                if (!filVows.includes(initArr[i - 1]) && diacriticBool) {
                    finalArr.push('+')
                }
                break;
            default:
                finalArr.push(initArr[i])
        }
    }

    const bbyStr = finalArr.join('');

    return bbyStr
}