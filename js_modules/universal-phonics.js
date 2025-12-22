// import { wordToIpaArr } from './js/universal-phonics.js'

// const userText = document.querySelector('.user-text');
const transText = document.querySelector('.trans-text');

let engIpa = [];
let ipaToZhu = [];

// check these consonants for combinations with the /i/ vowel
const consCheck = ['dʒ', 'tʃ', 'ʃ'];
// check these vowels for combinations with word-final 
// /n/ or /ŋ/ sounds
const vowCheck = ['ʌ', 'ɛ', 'i', 'ɪ', 'ɔ']

// userText.addEventListener('keyup', translateText);

fetchEngIPA()

function fetchEngIPA() {
    fetch("../../data/syll_ipa.json")
    .then(res => res.json())
    .then(data => {
        console.log('Successfully fetched English IPA syllables.');
        engIpa = data;
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
        const testArr = wordToIpaArr('friday');
        const revArr = reviseIpaArr(testArr);
        console.log(ipaToZY(revArr));
    })
}

export function wordToIpaArr(str) {

    const thisIpa = engIpa[str]
    if (thisIpa) {
        return thisIpa;
    } else {
        return null
    }
        
}

export function wordToIpaStr(str) {

    const IpaWSyll = wordToIpaArr(str)

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

export function reviseIpaArr(arr) {
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

function translateText() {
    const textArr = userText.value.toLowerCase().split(' ');

    let zhuStr = '';

    textArr.forEach(word => {
        const thisIpa = wordToIpaArr(word);
        const revIpa = reviseIpaArr(thisIpa);
        const thisZY = ipaToZY(thisIpa);

        thisZY.forEach(zhu => {
            zhuStr = zhuStr.concat(zhu);
        })
    })

    transText.innerText = zhuStr
}

export function wordToZhu(str) {
    let zhuStr = '';

    const thisIpa = wordToIpaArr(str);
    const revIpa = reviseIpaArr(thisIpa);
    const thisZY = ipaToZY(revIpa);

    thisZY.forEach(zhu => {
        zhuStr = zhuStr.concat(zhu);
    })

    console.log(zhuStr)
    return zhuStr
}



// obsolete functions used to condense and download the IPA dictionary

// function arraysToDict(arrArr) {
//     let newDict = {}

//     arrArr.forEach(entry => {
//         newDict[entry[0]] = entry[1]
//     })

//     return newDict
// }

// function prepDownload(content, fileName, contentType) {
//     var a = document.createElement("a");
//     var file = new Blob([content], {type: contentType});
//     a.href = URL.createObjectURL(file);
//     a.download = fileName;
//     a.click();
// }