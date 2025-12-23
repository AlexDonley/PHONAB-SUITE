// import { splitPinyin, pinNumToDiacritic, charToPin, constructPinRT, charToZhu, constructZhuRT } from './ruby-text.js'

export function constructPinRT(char, str, pos) {

    const fullWrap = document.createElement('span')
    fullWrap.style.writingMode = 'horizontal-lr'
    fullWrap.style.textOrientation = 'upright'

    const pinRuby = document.createElement('ruby')
    const pinRT = document.createElement('rt')

    pinRuby.style.rubyPosition = pos
    pinRuby.classList.add('pin-wrap')
    pinRT.classList.add('pin-text')
    pinRT.innerText = str

    pinRuby.append(char)
    pinRuby.append(pinRT)

    fullWrap.append(pinRuby)

    return fullWrap
}

export function constructZhuRT(char, [letterStr, toneNum], hideBool) {

    const fullWrap = document.createElement('span')
    fullWrap.style.writingMode = 'vertical-rl'
    fullWrap.style.textOrientation = 'upright'

    const outerRuby = document.createElement('ruby')
    const innerRuby = document.createElement('ruby')
    const zhuRT = document.createElement('rt')
    const toneRT = document.createElement('rt')

    if (hideBool) {
        zhuRT.classList.add('hide')
        toneRT.classList.add('hide')
    }
    
    outerRuby.classList.add('zhu-wrap')
    zhuRT.classList.add('zhu-text')
    toneRT.classList.add('tone-text')

    zhuRT.innerText = letterStr

    if (toneNum > 1) {
        const zhuDia = zhuyinDiacritics[toneNum - 2]

        if (toneNum == 5) {
            zhuRT.innerText = zhuDia + zhuRT.innerText
        } else {
            toneRT.innerText = zhuDia

            innerRuby.append(toneRT)
        }
    }

    innerRuby.append(char)
    innerRuby.append(zhuRT)

    outerRuby.append(innerRuby)
    outerRuby.append(toneRT)

    fullWrap.append(outerRuby)

    return fullWrap
}

export function changeRubyPos(pinOrZhu, str) {
    
    if (pinOrZhu == "pinyin") {
        rubyElements = Array.from(document.getElementsByClassName('pin-wrap'))
    } else if (pinOrZhu == "zhuyin") {
        rubyElements = Array.from(document.getElementsByClassName('zhu-wrap'))
    }

    rubyElements.forEach(element => {
        if (element.classList.length > 1) {
            element.classList.remove(element.classList[1])
        }
        element.classList.add("ruby-" + str)
    })
}

export function createHorRT(main, cap) {
    const fullWrap = document.createElement('span')
    fullWrap.style.writingMode = 'horizontal-lr'
    fullWrap.style.textOrientation = 'upright'

    const pinRuby = document.createElement('ruby')
    const pinRT = document.createElement('rt')

    pinRuby.classList.add('pin-wrap')
    pinRT.classList.add('pin-text')
    pinRT.innerText = cap;


    pinRuby.append(main)
    pinRuby.append(pinRT)

    fullWrap.append(pinRuby)

    return fullWrap
}

export function toggleRTHide(hideBool, specificClass) {
    let selectedElems

    if (specificClass) {
        selectedElems = Array.from(document.querySelectorAll('.' + specificClass))
    } else {
        selectedElems = Array.from(document.querySelectorAll('rt'))
    }

    selectedElems.forEach(elem => {
        if (!hideBool) {
            elem.classList.add('hide')
        } else {
            elem.classList.remove('hide')
        }
    })
}