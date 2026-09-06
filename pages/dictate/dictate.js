import {
    targetLang, speechRec, 
    setLanguage, startRecLoop, stopRecLoop
} from '../../js_modules/speech-rec.js'

const recBtn = document.querySelector('.rec-btn')
const engCurr = document.querySelector('.eng-curr')
const engLog = document.querySelector('.eng-log')
const zhCurr = document.querySelector('.zh-curr')
const zhLog = document.querySelector('.zh-log')
var isRecog = false

recBtn.addEventListener('click', toggRecogAndElem)

speechRec.addEventListener("result", (e) => {
  
    const text = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

    engCurr.innerText = text

    if (e.results[0].isFinal) {
        const newLog = document.createElement('div')
        newLog.innerText = text
        engLog.prepend(newLog)
        engCurr.innerText = ''
    }
})

export function toggRecogAndElem(bool) {
    
    let recogSet = isRecog

    if(bool === true || bool === false) {
        recogSet = !bool
    }

    if (!recogSet) {

        isRecog = true
        recBtn.classList.add('active')
        startRecLoop(1, 1, 0, targetLang)

    } else {

        isRecog = false
        recBtn.classList.remove('active')
        stopRecLoop()

    }
}