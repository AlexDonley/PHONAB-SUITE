import { oscBeep, startAndIdxOsc, updateOscFreq, stopAndDidxOsc } from '../../js_modules/oscillate.js'

const touchBoard = document.body
const centerMarker = document.querySelector('.center-marker')
var centerNow = findCenter()
var currentOct = -1

function findCenter() {
    // const currentCent = centerMarker.getBoundingClientRect()
    // const coordArr = [currentCent.x, currentCent.y]
    // console.log(coordArr)

    const windowArr = [window.innerWidth/2, window.innerHeight/2]
    // console.log(windowArr)
    return windowArr
}

findCenter()

window.addEventListener("resize", e => {
    findCenter()
})

touchBoard.addEventListener("pointerdown", e => {
    console.log("pointer down")
    const dot = document.createElement('div')
    dot.classList.add('pointer-debug')
    dot.id = e.pointerId
    positionDot(e, dot)
    document.body.append(dot)

    const startAng = calcAngle(centerNow, [e.pageX, e.pageY])
    startAndIdxOsc(e.pointerId, angleToHz(startAng, currentOct))
    //oscBeep(440 + calcAngle(centerNow, [e.pageX, e.pageY]) * 12, 1, 1, 'square')
})

touchBoard.addEventListener("pointermove", e => {
    const thisDot = document.getElementById(e.pointerId)
    if (thisDot == null) return
    positionDot(e, thisDot)
})

touchBoard.addEventListener("pointerup", e => {
    console.log("pointer up")
    const thisDot = document.getElementById(e.pointerId)
    if (thisDot == null) return
    thisDot.remove()
    stopAndDidxOsc(e.pointerId)
})

function positionDot(e, dot) {
    dot.style.width = `${e.width * 10}px`
    dot.style.height = `${e.height * 10}px`
    dot.style.left = `${e.pageX}px`
    dot.style.top = `${e.pageY}px`

    const newAngle = calcAngle(centerNow, [e.pageX, e.pageY])
    updateOscFreq(e.pointerId, angleToHz(newAngle, currentOct))
}

function calcAngle(originCoord, pointerCoord) {
    const deltaX = pointerCoord[0] - originCoord[0]
    const deltaY = pointerCoord[1] - originCoord[1]

    var thetaRadians = Math.atan2(deltaY, deltaX)
    if (thetaRadians < 0) {
        thetaRadians += 2 * Math.PI 
    }

    thetaRadians = Math.abs(thetaRadians - 13 * Math.PI / 4)

    console.log(thetaRadians)
    return thetaRadians
}

function angleToHz(ang, oct) {
    const thisHz = Math.pow(2, ((ang + oct * 12) / 6)) * 440
    console.log(thisHz)

    return thisHz
}