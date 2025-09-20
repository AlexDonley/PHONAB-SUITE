// import { oscBeep } from './js/oscillate.js'

const context = new AudioContext()

const majorChord = [261.62, 329.62, 391.99, 523.33]
const minorChord = [261.62, 311.12, 391.99, 523.33]

export const defaultSteps = {
    'majorChordSteps': [0, 4, 7, 12],
    'minorChordSteps': [0, 3, 7, 12],
    'majorScaleSteps': [0, 2, 4, 5, 7, 9, 11, 12],
    'minorScaleSteps': [0, 2, 3, 5, 7, 8, 10, 12]
}

var oscArr = {}

export function startAndIdxOsc(n, freq) {
    const newOsc = context.createOscillator()

    newOsc.type = 'triangle'
    newOsc.frequency.value = freq

    const newGain = context.createGain()
    newGain.gain.setValueAtTime(0.25, context.currentTime)

    newOsc.connect(newGain)
    newGain.connect(context.destination)

    if (oscArr[n] == undefined) {
        oscArr[n] = newOsc
        console.log(oscArr)
        newOsc.start()
    }
}

export function updateOscFreq(n, freq) {
    if (oscArr[n] == undefined) return
    oscArr[n].frequency.value = freq
}

export function stopAndDidxOsc(n) {
    const thisOsc = oscArr[n]

    thisOsc.stop()
    oscArr[n] = undefined
    console.log(oscArr)
}

export function oscBeep(freq, vol, length, type) {
    const oscillator = context.createOscillator()

    // type can be triangle, sine, square, or sawtooth
    oscillator.type = type
    oscillator.frequency.value = freq
    
    const gainNode = context.createGain()
    gainNode.gain.setValueAtTime(vol, context.currentTime)
    //gainNode.gain.linearRampToValueAtTime(0, context.currentTime + length)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + length)
    
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    oscillator.start()
}

export function createChord(arr, length, delay, dir) {
    
    let thisChord = defaultSteps['majorChordSteps']

    if (arr) {
        thisChord = arr
    }

    for (let n = 0; n < thisChord.length; n++) {
        
        let defaultDelay = n 
        if (dir == 'down') {
            defaultDelay = thisChord.length - n
        }
        setTimeout(() => {
            oscBeep(halfStepToHz(thisChord[n], -1), 0.02, length, 'sawtooth')
        }, defaultDelay * delay)
    }
}

export function halfStepToHz(halfStep, oct) {
    const thisHz = Math.pow(2, ((halfStep + oct * 12) / 12)) * 440

    return thisHz
}

export function extendSteps(progressionArr, lengthN) {
    
    let newArr = []
    const progSnip = progressionArr.slice(0, progressionArr.length - 1)

    const fullIterations = Math.floor(lengthN / progSnip.length)
    const partIteration = lengthN % progSnip.length

    for (let i = 0; i < fullIterations; i++) {
        const adjustedArr = progSnip.map(value => value + (12 * i))

        newArr = newArr.concat(adjustedArr)
    }
    for (let j = 0; j < partIteration; j++) {
        newArr.push(progSnip[j] + (12 * fullIterations))
    }

    return newArr
}