import { shuffle as myShuffle } from '../../js_modules/shuffle.js'
import {
    targetLang, speechRec, 
    setLanguage, startRecLoop, stopRecLoop
} from '../../js_modules/speech-rec.js'
import { 
    genWPStrToArr, 
    compareWords, compareArr,
    queueToArr 
} from '../../js_modules/word-process.js'
import { synthSpeak } from '../../js_modules/speech-synth.js'
import { startRainbow, genCompGrad, genStepConicGrad } from '../../js_modules/gradients.js'
import { timerMode, nextTimerMode, startTimer, stopTimer } from '../../js_modules/timer.js'
import { 
    genBlankCompMap, findInt, 
    checkMapForZero, checkArrForZero,
    checkMapForInt, returnAllIntFromMap,
    mapToAwardArr, trackCompletion,
    mapToFreqs, findPercent 
} from '../../js_modules/completion-map.js'
import { 
    monocharLangs, splitPinyin, pinNumToDiacritic, 
    charToPin, pinToZhu,
    constructPinRT, constructZhuRT 
} from '../../js_modules/ruby-text.js'
import { oscBeep, createChord } from '../../js_modules/oscillate.js'
import { urlConfigs } from '../../js_modules/url-query.js'
import { cycleQRWrap, toggleShowQR, genQRstr, genNewQR } from '../../js_modules/qr.js'

// - - - ELEMENTS - - - //
// ux elements that show user progress through arrow movement, score, timer, and awards

const progBtns        = document.querySelector('#progBtns');
const stopWatch       = document.querySelector('#stopWatch');
const awardDiv        = document.querySelector('#awardDiv');
const scoreMarker     = document.querySelector('#scoreMarker');
const settingsMenu    = document.querySelector('.settings-menu');
const ffLang          = document.querySelector('#ffLang');
const micBtn          = document.querySelector('#micBtn');
const synthSpeed      = document.querySelector('#synthSpeed');
const synthVol        = document.querySelector('#synthVol');
const speedReader     = document.querySelector('#speedReader');
const volReader       = document.querySelector('#volReader');
const greenArrow      = document.querySelector('#greenArrow');
const arrowPerc       = document.querySelector('#arrowPerc');
const arrowOverlay    = document.querySelector('.arrow-overlay')
const viewQR          = document.querySelector('.view-QR');
const qrImg           = document.querySelector('#qrImg');
const showQR          = document.querySelector('.show-QR-btn');
const genQR           = document.querySelector('.gen-QR-btn');
const goOpt           = document.querySelector('#goOpt');

// elements contained in the setting section

const contentBlocks = document.getElementById("contentBlocks");
const startMenu = document.getElementById("startMenu");
const textInput = document.getElementById("textInput");

// buttons and their fuunctions

const presetBtn     = document.querySelector('#preset');
const shuffleBtn    = document.querySelector('#shuffle');
const timerBtn      = document.querySelector('#timer');
const loopBtn       = document.querySelector('#loop');
const goBtn         = document.querySelector('#goBtn');
const leftBtn       = document.querySelector('#leftBtn');
const playBtn       = document.querySelector('#playBtn');
const homeBtn       = document.querySelector('#homeBtn');
const userBtn       = document.querySelector('#userBtn');
const fullscreenBtn = document.querySelector('#fullscreenBtn');
const settingBtn    = document.querySelector('#settingBtn');

const searchTitles      = document.querySelector("#searchTitles");
const titleCards        = document.querySelector("#titleCards");
const partsCards        = document.querySelector("#partsCards");
const pinyinDropdown    = document.querySelector('#pinyinDropdown');

const targetColumn    = document.querySelector(".targetColumn");
const utterTexts      = document.querySelector(".texts");
const userEntry       = document.querySelector('#userEntry');
const availableUsers  = document.querySelector('#availableUsers');
const userName        = document.querySelector('#userName');
const punchBtn        = document.querySelector('.punch-btn');

presetBtn.addEventListener("click", togglePresets);
shuffleBtn.addEventListener("click", toggleShuffle);
loopBtn.addEventListener("click", toggleLoop);
timerBtn.addEventListener("click", changeTimerMode);
goBtn.addEventListener("click", startQueue);
leftBtn.addEventListener("click", tryLeftRound);
playBtn.addEventListener("click", synthSpeakClosure('fullSent', targetLang));
homeBtn.addEventListener("click", endQueue);
userBtn.addEventListener("click", e => {
    shiftContentBlocks('user')
    stopRecLoop()
});
readBtn.addEventListener("click", e => {
    shiftContentBlocks('game')
})
fullscreenBtn.addEventListener("click", toggleFullscreen);
settingBtn.addEventListener("click", toggleSettings);
pinyinDropdown.addEventListener("change", togglePinyinRT);
synthSpeed.addEventListener("pointermove", updateSpeed);
synthVol.addEventListener("pointermove", updateVol);
viewQR.addEventListener("click", cycleQRWrap);
showQR.addEventListener("click", toggleShowQR);
genQR.addEventListener("click", QRgenWrap);
punchBtn.addEventListener("click", checkAndClear);

// - - - VARIABLES - - - //

// arrays for sentences and subdivisions

let freeformIndex = 0
let bookIndex = 0 
let targIterations = 0

let complObjs = {}
let globCurrents = {
    'book': null,
    'chunk': null,
    'sent': 0,
    'iter': 0
}

function setGlobalCurrents(chunkStr, sentN, iterN) {
    if (chunkStr) {
        globCurrents['chunk'] = chunkStr
    }
    if (sentN || sentN === 0) {
        globCurrents['sent'] = sentN
    }
    if (iterN || iterN === 0) {
        globCurrents['iter'] = iterN
    }
}

// settings booleans

let presetBool      = false // false means freeform, true means preset
let shuffleBool     = false // false means chronological targets, true means shuffled targets
let loopBool        = false // false means finishes after 1 iteration, true means continues iterating until the user stops
let fullscreenBool  = false // false means the application is not fullscreen, true means it is fullscreen
let isLeftRound     = false // false means the speaker is practicing a normal speech chunk, true means they've returned to skipped words
let isRecog         = false // false means speech recognition is not activated, true means it is activated

// setting for P5 sawtooth frequency

let defaultFreq = 100

// variables to fill with JSON data using fetch

let bookList;
let utteredWords = [];

const defaultFfText = {
    'en': "Hello! How are you?\nI'm fine thank you.\nIt's 3:00.",
    'cmn-Hant': "你好！你吃飯了嗎?\n我很好,謝謝!",
    'fil-PH': "Kumusta ka?\nMabuti ako, salamat po."
}

function QRgenWrap() {
    const newURL = genQRstr(QRdictFromElem());
    genNewQR(newURL, qrImg);
}

function QRdictFromElem() {
    let thisDict = {};

    const chunkIdx = document.querySelectorAll('.preset-check:checked')
    if (presetBool && chunkIdx.length > 0) {
        let thisIdx = bookIndex + "_";

        for (let n = 0; n < chunkIdx.length; n++){
            thisIdx += chunkIdx[n].id.substring(4);

            if(n < chunkIdx.length - 1) {
                thisIdx += "-"
            }
        }

        thisDict.psidx = thisIdx;
    }

    if (goOpt.checked) {
        thisDict.go = true;
    }

    console.log(thisDict);
    return thisDict;
}

function togglePinyinRT() {
    console.log('change')
    const pinRT = Array.from(document.querySelectorAll('.pin-text'));

    pinRT.forEach(element => {
        if (pinyinDropdown.value == 'pinyin') {
            element.classList.remove('hide')
        } else {
            element.classList.add('hide')
        }
    })
}

searchTitles.addEventListener("input", e => {
    const value = e.target.value.toLowerCase()

    let searchList = filterBooks(bookList, 'title', value)

    populatePresets(searchList);
})

// elements contained in the action section
// reading section contains two columns, one for target words and the other for user input

const booksDataPath = "../../data/speak_up_books.json"

function loadBooks(){
    fetch(booksDataPath)
    .then(res => {
        if (res.ok) {
            console.log('Fetched books');
        } else {
            console.log('Couldnt fetch books')
        }
        return res.json()
    })
    .then(data => {
        bookList = data;

        swapLang('en')
        processQueries();
    })
    .catch(error => console.log(error))
}

loadBooks();

function filterBooks(dataset, attr, cond) {
    let indArr = []

    // TO DO: modify to accomodate multiple filter conditions
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i][attr].toLowerCase().includes(cond.toLowerCase())) {
            indArr.push(i)
        }
    }

    return indArr
}

// sound effects

let next            = new Audio("../../sfx/chaching.webm")
let perfectWow      = new Audio("../../sfx/wow.mp3")
perfectWow.volume = 0.2

// variables for scoring and progress

let score = 0
scoreMarker.innerText = score

//const safariBool = window.navigator.userAgent.includes('Safari');
const safariBool = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));
console.log(safariBool)

speechRec.addEventListener("result", (e) => {
  
    const text = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

    utteredWords = genWPStrToArr(text, targetLang)

    populateUtterances(utteredWords, utterTexts)

    if (e.results[0].isFinal) {
        checkAnswer()
    }
})

function checkAnswer() {

    if (!isLeftRound) {

        const thisCompletionObj = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']]
        //console.log(thisCompletionObj.completionMap[0][globCurrents['sent']])

        const uttToScore = trackCompletion(
            thisCompletionObj.text[globCurrents['sent']], 
            utteredWords, 
            'linear', 
            targetLang, 
            thisCompletionObj.completionMap[0][globCurrents['sent']]
        )

        updateScore(uttToScore[1])
        
        
        complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][globCurrents['sent']] = uttToScore[0]
        console.log(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0], uttToScore[0])
        
        globCurrents['word'] = uttToScore[1]
      
        // to determine whether the utterance gets a perfect score,
        // it must be fully complete (its completion map is all 1s)
        // and it must be the same length as the target utterance
        if (uttToScore[1] == thisCompletionObj.text[globCurrents['sent']].length) {
            
            // play an animation to reward the perfect performance
            perfectAnim()
        }

        logProgress()
        evalArr(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][globCurrents['sent']])

    } else {

        const thisChunk = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']]
        const coord = returnAllIntFromMap(thisChunk.completionMap[0], -1)
        const targWordElemArr = Array.from(targetColumn.children)
        
        let newCompArr = []
        const leftArr = grabLeftovers(coord)
        console.log(leftArr)

        const uttToScore = compareArr(
            leftArr, 
            utteredWords, 
            targetLang, 
            3
        )

        for (let h = 0; h < targWordElemArr.length - leftArr.length; h++) {
            newCompArr.push(1)
        }
        for (let i = 0; i < uttToScore; i++) {
            thisChunk.completionMap[0][coord[i][0]][coord[i][1]] = 1
            newCompArr.push(1)
        }
        while (newCompArr.length < targWordElemArr.length) {
            newCompArr.push(0)
        }

        console.log(newCompArr, checkArrForZero(newCompArr))
        logProgress(newCompArr)

        if (!checkArrForZero(newCompArr)) {

            setTimeout(() => {
                nextSentence()
                isLeftRound = false
                leftBtn.classList.remove('active')
            }, 50 * uttToScore + 500)
        }
    }
}

function checkAndClear() {
    checkAnswer();
    utterTexts.innerHTML = '';
    utteredWords = [];
}

function tryLeftRound() {

    const coord = returnAllIntFromMap(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0], -1)
    console.log(coord)

    if (coord.length > 0) {

        isLeftRound = true

        const leftArr = grabLeftovers(coord)
        console.log(leftArr)

        loadLeftovers(leftArr)

    } else {

        isLeftRound = false
        return false
    }
}

function logProgress(customArr) {

    const thisMap = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0]
    let sentIdx = globCurrents['sent']
    let arr = thisMap[sentIdx]    

    // update award buttons
    const grabAward = document.getElementById(globCurrents['chunk'] + "*" + globCurrents['iter'])

    const progArr = mapToAwardArr(thisMap)
    const conGradient = genStepConicGrad(['gray', 'yellow', 'green'], progArr)

    grabAward.style.background = conGradient

    if (!isLeftRound) {
        // update one navigation progress bar
        const grabProgBar = document.getElementById(globCurrents['chunk'] + "*" + globCurrents['iter'] + "." + sentIdx)

        const horizGradient = genCompGrad(arr)
        grabProgBar.style.background = horizGradient

        // update target words to turn green
        updateTargVisual(arr, 50)

    } else {
        // update all navigation progress bars
        const allProgBars = Array.from(document.querySelectorAll('.prog'))

        for (let i = 0; i < allProgBars.length; i++) {
            const updatedGrad = genCompGrad(thisMap[i])
            allProgBars[i].style.background = updatedGrad
        }
        
        // update leftover words to turn green
        updateTargVisual(customArr, 50)
    }

    // update arrow size
    updateArrow(thisMap)
}

function perfectAnim() {
    startRainbow(120, 1, arrowOverlay, 90)

    perfectWow.currentTime = 0
    perfectWow.play()
}

function populateUtterances(arr, elem) {
    elem.innerHTML = ""

    let n = 0
    arr.forEach((word) => {
        let inputWord = document.createElement('span')
        inputWord.classList = 'one-word'
        inputWord.id = 'input' + n

        if (monocharLangs.includes(targetLang)) {
            const thisPin = charToPin(word)
            let pinWithTone = ''

            if (thisPin) {
                pinWithTone = pinNumToDiacritic(thisPin)
            }

            const newContent = constructPinRT(
                word, pinWithTone, 'under'
            )

            if ( ! (pinyinDropdown.value == 'pinyin') ) {
                newContent.children[0].children[0].classList.add('hide')
            }

            inputWord.append(newContent)
        } else {
            inputWord.innerText = word
        }

        const wrapElem = document.createElement('div')
        wrapElem.classList = 'word-wrap'
        wrapElem.append(inputWord)
        elem.appendChild(wrapElem)
        n++;
    })
}

function evalArr(arr) {
    if (!arr.includes(0)) {
        const delayNext = setTimeout(() => {
            nextSentence()
        }, 50 * arr.length + 500)

        return true
    } else {
        return false
    }
}

ffLang.addEventListener('change', e => {
    swapLang(ffLang.value)
})

function swapLang(lang) {
    // set the target language for speech recognition
    setLanguage(lang)

    // swap freeform text
    textInput.value = defaultFfText[lang]

    // filter different preset options
    const langPresets = filterBooks(bookList, "lang", lang)
    populatePresets(langPresets)
}

function startQueue() {
    
    // disable language change
    ffLang.disabled = true

    // clear chunks queue and sentence queue
    let chunksQueue = []

    // reset oscillator frequency to low frequency
    // TO DO: change this so that it resets on each load to a random value
    defaultFreq = 100

    // start timer countdown if mode dictates it
    if (!timerMode == 0) {
        startTimer(stopWatch)
    }
  
    // check if the sentence queue will be preset or freeform
    if (presetBool) {

        // PRESET INPUT
        // set the target language

        if (bookList[bookIndex].lang != undefined) {
            setLanguage(bookList[bookIndex].lang)
        } else {
            setLanguage('en')
        }
        
        // clear the index array
        let bookIdxArr = [];
        
        // see which boxes are checked
        const checkboxes = document.querySelectorAll('.preset-check')

        for (let n = 0; n < checkboxes.length; n++){
            if (checkboxes[n].checked) {
                bookIdxArr.push(n);
                chunksQueue.push(bookIndex + "_" + n)
            }
        }

        globCurrents['iter'] = targIterations

        bookIdxArr.forEach((num) => {
            
            // TO DO: focus on and refactor this section
            // create a completion object for each index number
            const newID = bookIndex + "_" + num + "*" + targIterations
            complObjs[newID] = genPresetObj(bookIndex, num)

            const newAward = awardProgElem(newID, bookList[bookIndex].parts[num].award)
            awardDiv.prepend(newAward)

            targIterations++
        })

        globCurrents['chunk'] = chunksQueue[0]
        loadChunk(globCurrents['chunk'] + "*" + globCurrents['iter'])

    } else {

        // FREEFORM INPUT
        // The following grabs the text entered by the user and eliminates blank lines

        // remove excess spaces
        const freeformText = textInput.value.replace(/^\s*\n/gm, "");
        // split text by line break
        const freeformArr = freeformText.split(/\r?\n|\r|\n/g)
        const thisTextID = 'freef*' + targIterations

        complObjs[thisTextID] = genFreefObj(freeformArr)
        globCurrents['chunk'] = thisTextID

        console.log(complObjs[thisTextID])
        globCurrents['iter'] = targIterations
        targIterations++

        awardDiv.prepend(awardProgElem(thisTextID, '👍'))
        loadChunk(thisTextID)
    }

    toggRecogAndElem(true)

    shiftContentBlocks('game')
}

// FUNCTIONS FOR CREATING COMPLETION OBJECTS

function genCompletionObj(textArrs) {
    
    // fetch the text arrays and generate a new 
    const newCompletionMap = genBlankCompMap(textArrs)

    let newObj = {
        'status': 'incomplete',
        'startTime': 0,
        'endTime': 0,
        'mode': 'linear',
        'text': textArrs,
        'completionMap': newCompletionMap
    }

    return newObj
}

function genPresetObj(bookIdx, chunkIdx) {
    
    const textArrs = queueToArr(bookList[bookIdx].parts[chunkIdx].text, targetLang)

    return genCompletionObj(textArrs)
}

function genFreefObj(arr) {
    
    const textArrs = queueToArr(arr, targetLang)

    return genCompletionObj(textArrs)
}

export function toggRecogAndElem(bool) {
    
    let recogSet = isRecog

    if(bool === true || bool === false) {
        recogSet = !bool
    }

    if (!recogSet) {

        isRecog = true
        //document.body.classList.add('active-mic')
        micBtn.classList.add('active')
        startRecLoop(1, 1, 0, targetLang)

    } else {

        isRecog = false
        //document.body.classList.remove('active-mic')
        micBtn.classList.remove('active')
        stopRecLoop()

    }
}

micBtn.addEventListener('click', toggRecogAndElem)

function nextSentence() {
  
    // check for the next incomplete word,
    // then check for the previous incomplete word
    const nextIncomp = checkMapForZero(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0], globCurrents['sent'])
    const prevIncomp = checkMapForZero(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0], 0)

    if (nextIncomp) {

        loadSentence(nextIncomp[0])

    } else if (prevIncomp) {

        loadSentence(prevIncomp[0])

    } else {

        tryLeftRound()
    }
}

function endQueue() {
    
    // enable language dropdown
    ffLang.disabled = false

    // set leftover round boolean to false
    isLeftRound = false

    // stop speech recognition
    toggRecogAndElem(false)

    // stop the timer
    stopTimer()

    // return view to the menu
    shiftContentBlocks('menu')

    // uncheck all checkboxes for story parts
    const checkboxes = partsCards.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(box => {
      box.checked = false
    })

    // clear all target and utterance elements after small delay
    setTimeout(() => {
        targetColumn.innerHTML = ''
        utterTexts.innerHTML = ''
        progBtns.innerHTML = ''
    }, 275)

    // TO DO: log user progress in local storage
    // eventually transition to using backend database
}

function loadSentence(sentN){
    
    const thisSentMap = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][sentN]
    setGlobalCurrents(null, sentN, null)
    const arr = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].text[sentN]
    
    targetColumn.innerHTML = ''

    for (let n = 0; n < arr.length; n++){

        const targWrap = document.createElement('div')
        targWrap.classList.add('word-wrap')

        const newSpan = document.createElement('span')
        newSpan.id = 'target' + n
        newSpan.classList = 'one-word target'

        const leftButton = document.createElement('div')
        leftButton.classList.add('skip-btn')
        leftButton.id = "skip" + n

        const miniTri = document.createElement('div')
        miniTri.classList.add('mini-tri')

        leftButton.append(miniTri)

        if (thisSentMap[n] == 1) {

            targWrap.classList.add('correct')

        } else {

            leftButton.addEventListener('click', toggleLeftover, true)

            if (thisSentMap[n] == -1) {
                targWrap.classList.add('grayed-out')
            }
        }
    
        targWrap.appendChild(leftButton)         
        
        const text = arr[n]
        let newContent

        if (monocharLangs.includes(targetLang)) {

            const thisPin = charToPin(text)
            let pinWithTone = ''

            if (thisPin) {
                pinWithTone = pinNumToDiacritic(thisPin)
            }

            newContent = constructPinRT(
                text, pinWithTone, 'under'
            )

            if ( ! (pinyinDropdown.value == 'pinyin') ) {
                newContent.children[0].children[0].classList.add('hide')
            }

        } else {
            newContent = document.createTextNode(text)
        }
        
        newSpan.append(newContent)
        newSpan.addEventListener('click', synthSpeakClosure(
            text, targetLang
        ))

        targWrap.append(newSpan)
        targetColumn.appendChild(targWrap)
    }
}

function loadLeftovers(arr) {
    
    console.log("Leftover system in progress")
    targetColumn.innerHTML = ''

    for (let n = 0; n < arr.length; n++){

        const targWrap = document.createElement('div')
        targWrap.classList.add('word-wrap')

        const newSpan = document.createElement('span')
        newSpan.id = 'target' + n
        newSpan.classList = 'one-word target'

        // const leftButton = document.createElement('div')
        // leftButton.classList.add('skip-btn')
        // leftButton.id = "skip" + n

        // const miniTri = document.createElement('div')
        // miniTri.classList.add('mini-tri')

        // leftButton.append(miniTri)
    
        // targWrap.appendChild(leftButton)         
        
        const text = arr[n]
        let newContent

        if (monocharLangs.includes(targetLang)) {

            const thisPin = charToPin(text)
            let pinWithTone = ''

            if (thisPin) {
                pinWithTone = pinNumToDiacritic(thisPin)
            }

            newContent = constructPinRT(
                text, pinWithTone, 'under'
            )

            if (!(pinyinDropdown.value == 'pinyin') ) {
                newContent.children[0].children[0].classList.add('hide')
            }

        } else {
            newContent = document.createTextNode(text)
        }
        
        newSpan.append(newContent)
        newSpan.addEventListener('click', synthSpeakClosure(
            text, targetLang
        ))

        targWrap.append(newSpan)
        targetColumn.appendChild(targWrap)
    }
}

function loadChunk(idStr) {

    // for now, the ID string will be bookIdx_chunkIdx
    // in the future, it will be a UUID
    
    const idArr = idStr.split('*')
    globCurrents['chunk'] = idArr[0]
    globCurrents['sent'] = 0
    globCurrents['iter'] = idArr[1]

    const thisCompletionObj = complObjs[idStr]
    let thisSentArr = thisCompletionObj.text

    if (shuffleBool) {
        thisSentArr = myShuffle(thisSentArr)
    }

    const thisCompData = thisCompletionObj.completionMap

    populateProgressParts(thisCompData)
    updateArrow(thisCompData[0])

    loadSentence(globCurrents['sent'])
    nextSentence()
}

function updateTargVisual(arr, delay) {
        
    // highlight correct words
    const allTargs = Array.from(targetColumn.children)

    for (let i = 0; i < arr.length; i++) {

        if (arr[i] == 1 && !isLeftRound) {
            const skipBtn = document.querySelector('#skip' + i)
            skipBtn.removeEventListener('click', toggleLeftover, true)
        }

        setTimeout(() => {

            if (arr[i] == 0) {

                allTargs[i].classList = 'word-wrap'

            } else {

                if (arr[i] == -1) {
                    
                    allTargs[i].classList.add('grayed-out')

                } else if (arr[i] == 1) {

                    if (!allTargs[i].classList.contains('correct')) {
                        allTargs[i].classList.add('correct')

                        // TO DO: chordify oscillator beeps
                        oscBeep(200 + Math.floor(Math.random() * 300), 0.01, 0.3, 'square')
                        //inchUpSound(30)
                    }
                }
            }
        }, delay * i)
    }
}

function updateArrow(map) {

    const freqsNow = mapToFreqs(map)
    const percentNow = findPercent(freqsNow[0][1], freqsNow[1])
    const heightStr = 
        "calc(" + 
        (percentNow) +
        "% + " + 
        (.6 * (100 - percentNow)) +
        "px)"

    greenArrow.style.height = heightStr

    arrowPerc.innerText = Math.round(percentNow, 1) + "%"
}

function grabLeftovers(leftoversIdx) {

    const thisChunk = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].text
    let leftoversList = []
    
    for (let n = 0; n < leftoversIdx.length; n++) {
        const sentN = leftoversIdx[n][0]
        const wordN = leftoversIdx[n][1]
        
        leftoversList.push(thisChunk[sentN][wordN])
    }

    return leftoversList
}

function updateScore(n) {
    score += n
    scoreMarker.innerText = score

    if(!(currentUserIndex == null)) {
        userInfo[currentUserIndex].user_score = score
        saveUserDataLocally()
    }
}

function awardProgElem(awardID, awardEmote) {
    
    // create surrounding circle progress marker
    const gradCirc = document.createElement('div')
    gradCirc.classList.add('award-circle')
    gradCirc.style.background = genStepConicGrad(['gray'])
    gradCirc.id = awardID

    // a click navigates to partially-completed round
    gradCirc.addEventListener('click', e => {
        loadChunk(gradCirc.id)
    })


    // add the emoticon award inside
    gradCirc.innerText = awardEmote

    return gradCirc
}

function togglePresets(str) {

    if (str == 'preset') {
        presetBool = false
    } else if (str == 'freeform') {
        presetBool = true
    }

    if (presetBool) {

        presetBtn.innerHTML = 'Preset'
        presetBool = false;
        textInput.classList.remove('disappear');

    } else {
    
        presetBtn.innerHTML = 'Freeform'
        presetBool = true;
        textInput.classList.add('disappear');

    }
}

function toggleShuffle() {
  if (shuffleBool) {
    shuffleBool = false;
    shuffleBtn.classList.remove('flip');
  } else {
    shuffleBool = true
    shuffleBtn.classList.add('flip');
  }
}

function toggleLoop() {
  if (loopBool) {
    loopBool = false;
    loopBtn.classList.remove('flip');
  } else {
    loopBool = true
    loopBtn.classList.add('flip');
  }
}

function changeTimerMode() {
  
    nextTimerMode()

    if (timerMode == 0) {

        timerBtn.classList.remove('flip')
      
        timerBtn.children[0].style.clipPath = 
        "polygon(0% 0%, 33% 0%, 50% 20%, 66% 0%, 100% 0%, 100% 33%, 80% 50%, 100% 66%, 100% 100%, 66% 100%, 50% 80%, 33% 100%, 0% 100%, 0% 66%, 20% 50%, 0% 33%)"

    } else {
        timerBtn.classList.add('flip')

        if (timerMode == 1) {
            timerBtn.children[0].style.clipPath = 
            "polygon(0% 33%, 50% 0%, 100% 33%, 80% 33%, 80% 100%, 20% 100%, 20% 33%)"
        } else {
            timerBtn.children[0].style.clipPath = 
            "polygon(20% 0%, 20% 66%, 0% 66%, 50% 100%, 100% 66%, 80% 66%, 80% 0%)"
        }
    }
}

function toggleFullscreen(bool) {
    if (bool) {
        fullscreenBool != bool
    }
    
    if (fullscreenBool) {
        document.exitFullscreen()
        fullscreenBool = false
    } else {
        document.documentElement.requestFullscreen()
        fullscreenBool = true
    }
}

function populatePresets(arr) {
    titleCards.innerHTML = ""

    arr.forEach((idx) => {
        const newTitle = document.createElement('div')
        newTitle.innerText = bookList[idx]['title']

        newTitle.classList.add('preset-line')
        newTitle.classList.add('one-title')

        newTitle.addEventListener('click', (e) => {
            bookIndex = idx
            populateChunks(idx, e.target)
        })
        titleCards.appendChild(newTitle)
    });
}

function toggleLeftover(event) {
    
    const n = event.currentTarget.id.replace("skip", "")
    const checkWordComp = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][globCurrents['sent']][n]

    console.log(event.target.id, n)

    const targElem = document.querySelector('#target' + n).parentNode

    if (checkWordComp == 0) {
        // ASSIGN THIS WORD TO LEFTOVERS
        
        complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][globCurrents['sent']][n] = -1
        
        targElem.classList.add('grayed-out')
        leftBtn.classList.add('active')

    } else {
        // BRING THIS WORD BACK FROM LEFTOVERS

        complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][globCurrents['sent']][n] = 0

        targElem.classList.remove('grayed-out')
        leftBtn.classList.remove('active')

    }

    logProgress()

    if (findInt(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][globCurrents['sent']], 0) < 0) {
        nextSentence()
    }
}

function synthSpeakClosure(str, lang) {
    
    return function executeOnEvent(event) {
        
        let thisSent = str
        
        if (str == 'fullSent') {
            const currArr = complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].text[globCurrents['sent']]
            thisSent = currArr.join(' ')
        } 
        
        synthSpeak(thisSent, synthSpeed.value, synthVol.value, lang, micBtn, isRecog)
        
        toggRecogAndElem(false)
    }
}

function populateChunks(n, clickedElem) {
      
    const clearHighlight = document.querySelector('.title-highlight')

    if(clearHighlight) {
        clearHighlight.classList.remove('title-highlight')
    }

    clickedElem.classList.add('title-highlight')

    partsCards.innerHTML = "";

    let m = 0;

    bookList[n].parts.forEach(chunk =>{
        constructPresetCheckbox(chunk, m)
        m++
    })
}

function populateProgressParts([arr, total]) {

    let rowTempStr = ''
    progBtns.innerHTML = ''

    for (let i = 0; i < arr.length; i++) {
        const progPart = document.createElement('div')
        progPart.classList.add('prog')
        progPart.id = globCurrents['chunk'] + "*" + globCurrents['iter'] + "." + i
        
        progPart.style.background = genCompGrad(complObjs[globCurrents['chunk'] + "*" + globCurrents['iter']].completionMap[0][i])
        progPart.addEventListener('pointerdown', e => {
            
            // on click, switch to the selected chunk
            // first get an array from the part's id
            const idArr = e.target.id.split('.')
            const objId = idArr[0]
            const sentId = idArr[1]

            const pickedSent = complObjs[objId].text[sentId]
            console.log(pickedSent)
            loadSentence(sentId)

        })
        progBtns.append(progPart)

        rowTempStr += 100 * arr[i].length / total + "fr "
    }

    progBtns.style.gridTemplateColumns = rowTempStr
}

function constructPresetCheckbox(arr, n) {

    const currentID = 'part' + n;
    const preview = (n + 1) + " - " + arr.text[0]

    let preset = document.createElement('input')
    preset.classList.add('preset-check')
    preset.type = 'checkbox'
    preset.id = currentID

    let preLabel = document.createElement('label')
    preLabel.classList.add('preset-label')
    preLabel.htmlFor = currentID
    preLabel.innerText = arr.award + preview

    let divWrap = document.createElement('div')
    divWrap.appendChild(preset)
    divWrap.appendChild(preLabel)

    divWrap.classList.add('one-part')
    divWrap.classList.add('preset-line')

    partsCards.appendChild(divWrap)
}

function updateSpeed() {
  speedReader.innerText = synthSpeed.value
}

function updateVol() {
  volReader.innerText = synthVol.value
}

// function populateVoices(arr) {
//   for (let n = 0; n < arr.length; n++) {
//     const newOpt = document.createElement('option')
//     newOpt.value = n
//     newOpt.innerText = arr[n].name

//     voiceSelect.append(newOpt)
//   }
// }

function showUserPage() {
    shiftContentBlocks('user');
    stopRecLoop();
}

function shiftContentBlocks(str) {
    playBtn.disabled = true;
    micBtn.disabled = true;
    
    if (str == 'user') {
        contentBlocks.style.left = "0%"
    } else if (str == 'game') {
        contentBlocks.style.left = "-200%"
        playBtn.disabled = false;
        micBtn.disabled = false;
    } else if (str == 'menu') {
        contentBlocks.style.left = "-100%"
    }
}

let currentUser = null
let currentUserIndex = null
let userInfo = []
if (localStorage.getItem("user_info")) {
    userInfo = JSON.parse(localStorage.getItem("user_info"))
}
populateUserButtons()

function createUser() {
    inputName = userEntry.value

    // check variable to see if entered name already exists

    overwriteCheck = true
    userInfo.forEach(entry => {
        if (entry.user_name == inputName) {
            overwriteCheck = confirm("This name already exists. Would you like to overwrite? Doing so will erase all existing information on the user")
        }
    })

    // append new user info
    // this code is bad, come back and fix it
    if (overwriteCheck) {
        userInfo.push({
            "user_name": inputName, 
            "user_score": 0, 
            "user_awards": [], 
            "user_completions": []
        })

        saveUserDataLocally()
        populateUserButtons()
    }
}

function saveUserDataLocally() {
    userDataString = JSON.stringify(userInfo)
    localStorage.setItem("user_info", userDataString)
}

function populateUserButtons() {
    availableUsers.innerHTML = ''

    userInfo.forEach(entry => {
        const newButton = document.createElement('button')
        newButton.innerText = entry.user_name
        newButton.classList.add('name-btn')
        newButton.setAttribute('onclick', 'setUser("' + entry.user_name + '")')
      
        availableUsers.append(newButton)
    })
}

function setUser(str) {
    currentUser = str
    userName.innerText = str
    userName.classList.add('show')

    currentUserIndex = userInfo.findIndex(entry => entry.user_name == str)
    console.log(currentUserIndex)

    score = 0

    reloadAwards(currentUserIndex)
}

function reloadAwards(index) {
    console.log('reconstruct Awards functions')

    //checkLength = userInfo[index].user_awards.length
}

function toggleSettings() {

    createChord(null, 1, 30)
    if (settingsMenu.classList.contains('show')) {
        settingsMenu.classList.remove('show')
    } else {
        settingsMenu.classList.add('show')
    }
}

function inchUpSound(n) {
    oscBeep(defaultFreq, 0.01, 0.3, 'square')
    defaultFreq += n
}

console.log(urlConfigs)

function processQueries(data) {
    const fullWordlist = data

    if (urlConfigs) {
        if (urlConfigs.fs == 'true') {
            createFSInteractor()
        }
        
        if (urlConfigs.psidx) {
            const splitOne = urlConfigs.psidx.split('_');
            const bookIdx = splitOne[0];
            const splitTwo = splitOne[1].split('-');
            
            togglePresets('preset')

            bookIndex = bookIdx;
            populateChunks(bookIdx);
            const allChecks = partsCards.querySelectorAll('input[type="checkbox"]');

            splitTwo.forEach(val => {
                if (allChecks[val]) {
                    allChecks[val].checked = true;
                }
            })
        }
    
        if (urlConfigs.go == 'true') {
            startQueue()
        }
    }
}

function createFSInteractor() {
    const FSdiv = document.createElement('div');
    FSdiv.classList.add('fullscreen-interaction');
    FSdiv.innerText = 'click to continue';
    FSdiv.addEventListener('click', FSwrapper(true))

    document.body.append(FSdiv);
}

function FSwrapper(bool) {
    return function executeOnEvent(e) {
        toggleFullscreen(bool);
        e.target.remove()
    }
}
