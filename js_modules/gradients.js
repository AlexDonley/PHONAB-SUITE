// import { startRainbow, genRBWGrad, genCompGrad } from './rbw-grad.js'

// ANIMATED RAINBOW GRADIENT

const rainbowValues = [
    "hsla(0, 100%, 50%, ",
    "hsla(30, 100%, 50%, ",
    "hsla(60, 100%, 50%, ",
    "hsla(90, 100%, 50%, ",
    "hsla(120, 100%, 50%, ",
    "hsla(150, 100%, 50%, ",
    "hsla(180, 100%, 50%, ",
    "hsla(210, 100%, 50%, ",
    "hsla(240, 100%, 50%, ",
    "hsla(270, 100%, 50%, ",
    "hsla(300, 100%, 50%, ",
    "hsla(330, 100%, 50%, "
]

let movingRainbow = rainbowValues
let direction = 90
let opacity = 1

// Code for rainbow effect on arrow

export function startRainbow(len, speed, elem, startDir){
    opacity = 1;
    if (startDir || startDir === 0) {
        direction = startDir
    } else {
        direction = Math.floor(Math.random() * 180)
    }

    let timesRun = 0;
    const rainbowCycle = setInterval(function() {
        timesRun += 1;
  
        if(timesRun > len){
            clearInterval(rainbowCycle);
        }
    
        cycleArray(movingRainbow);

        elem.style.background = genRBWGrad(movingRainbow, (1 / len), speed)
        //return genRBWGrad(movingRainbow);
    
    }, 20);
}

function genRBWGrad(arr, fract, step){
    direction += step
    opacity -= fract

    let rainbowStr = "linear-gradient(" + direction + "deg, "

    arr.forEach((element) =>{
        rainbowStr += (element + opacity + "), ")
    })
    rainbowStr = rainbowStr.substring(0, rainbowStr.length - 2);
    rainbowStr += ")";

    return rainbowStr;
}

function cycleArray(arr) {
    arr.push(arr[0]);
    arr.shift();

    return arr;
}


// ALTERNATING COLOR STRIPE GRADIENT

export function genStripeGrad(reps, color1, color2) {

    const segment = 100 / reps
    let gradStr = "linear-gradient(0deg, "

    for (let i=0; i<reps; i++) {
        let addStr
        
        if (i%2) {
            addStr = color1
        } else {
            addStr = color2
        }

        if (i == 0) {
            addStr = addStr.concat(" " + segment + "%, ")
        } else if (i == reps - 1) {
            addStr = addStr.concat(" " + (segment * i) + "%)")
        } else {
            addStr = addStr + " " + (segment * i) + "%, " + addStr + " " + (segment * (i + 1)) + "%, "
        }

        gradStr = gradStr.concat(addStr)
    }

    //console.log(gradStr)
    return gradStr
}


// SPEAK UP COMPLETION GRADIENT

export function genCompGrad(arr) {

    const segment = 100 / arr.length

    let gradStr = "linear-gradient(90deg, "
    
    for (let i=0; i<arr.length; i++) {
        let addStr
        
        if (arr[i] == -1) {
            addStr = 'yellow'
        } else if (arr[i] == 0) {
            addStr = 'gray'
        } else if (arr[i] == 1) {
            addStr = 'green'
        }

        if (i == 0) {
            addStr = addStr.concat(" " + segment + "%, ")
        } else if (i == arr.length - 1) {
            addStr = addStr.concat(" " + (segment * i) + "%)")
        } else {
            addStr = addStr + " " + (segment * i) + "%, " + addStr + " " + (segment * (i + 1)) + "%, "
        }

        gradStr = gradStr.concat(addStr)
    }

    //console.log(gradStr)
    return gradStr
}


// STEPPED CONIC GRADIENT

export function genStepConicGrad(colorsArr, propArr) {

    // determine the number of colors entered in the argument
    const colorCount = colorsArr.length

    // set a default slice value so all slices would have an equal number of degrees
    let oneSlice = 360 / colorCount

    // by default, proportions will be equal for all slices
    let equalProp = true
    let propSum = 0
    let degIncrement = 0

    // if there is a proportions array that matches the number of colors,
    // turn off equal proportions and find the sum of the values in the proportions array
    if (propArr && propArr.length == colorsArr.length) {
        equalProp = false
        propSum = propArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
    }

    // calculate the degree values that will go in the final gradient string
    let degreeArr = []
    for (let i = 0; i < colorCount; i++) {

        // equal proportions make the calcuation simple, all degree values are the same
        if (equalProp) {
            degreeArr.push(oneSlice * (i + 1))

        // for unequal proportions, find the slice of 360 degrees
        // that equals the proportion over the sum
        } else {
            degIncrement += 360 * propArr[i] / propSum
            degreeArr.push(degIncrement)
        }
    }

    // start and then concatenate the final gradient string
    let gradientStr = "conic-gradient("

    // iterate through each color in the color array
    for (let i = 0; i < colorCount; i++) {
        gradientStr += colorsArr[i] + " " 

        // all values except the first need a starting degree value
        if (i > 0) {
            gradientStr += degreeArr[i - 1] + "deg "
        }

        // all values, including the first, need the ending degree value
        gradientStr += degreeArr[i] + "deg"

        if (i < colorCount - 1) {

            // not final value, extend with comma
            gradientStr += ", "

        } else {
            
            // final value, closing parenthesis
            gradientStr += ")"
        }
    }

    // console.log(degreeArr, gradientStr)
    return gradientStr
}