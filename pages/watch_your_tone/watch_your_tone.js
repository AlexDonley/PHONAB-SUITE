import { charToZhu } from "../../js_modules/ruby-text.js"

const ZHchar        = document.getElementById('ZHchar')
const letterFreq    = document.getElementById('letterFreq')
const errorsWrap    = document.getElementById('errorsWrap')
const errors        = document.getElementById('errors')

const triangles     = Array.from(document.getElementsByClassName('tri'))
const onloads       = Array.from(document.getElementsByClassName('onload'))
const buttons       = Array.from(document.getElementsByTagName('button'))
const chartWrap     = document.getElementById('chartWrap')
const userText      = document.getElementById('userText')
const menu          = document.getElementById('menu')

for (let i = 0; i < triangles.length; i++) {
    triangles[i].addEventListener('click', checkToneWrap(i+1))
}
ZHchar.addEventListener('click', checkToneWrap(triangles.length + 1))

var toneErrors = {};
var typeErrors = {};
var logErrors = true;
var shuffleBool = false;
var speechBool = false;
var mode = 1;

let queueCount
let limit
let targetLength

const bpmfChar = [
    'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 
    'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 
    'ㄍ', 'ㄎ', 'ㄏ', 
    'ㄐ', 'ㄑ', 'ㄒ', 
    'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 
    'ㄗ', 'ㄘ', 'ㄙ', 
    '一', 'ㄨ', 'ㄩ', 
    'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 
    'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 
    'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 
    'ㄦ'
]

const lordsPrayer = "我們在天上的父,願人都尊祢的名為聖,願祢的國降臨,願祢的旨意行在地上,如同行在天上.我們日用的飲食,今日賜給我們,免我們的債,如同我們免了人的債,不叫我們遇見試探,救我們脫離兇惡,因為國度,權柄,榮耀,全是祢的,直到永遠.阿們"
const LP1 = "我們在天上的父願人都尊祢的名為聖"
const memeText = "世界八大不可相信英國研究中國製造台灣報導南韓起源北韓宣布美國力挺菲國道歉大馬選舉"

const bpmfData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]

Chart.defaults.font.size = 24;
Chart.defaults.font.weight = "bold";
Chart.defaults.color = "black";
Chart.defaults.scaleShowLables = false;

let chartSet = new Chart(letterFreq, {
        type: 'bar',
        data: {
          labels: bpmfChar,
          datasets: [{
            label: '# of',
            data: bpmfData,
            backgroundColor: "#0000ff",
            // borderWidth: 2,
            borderRadius: 4,
          }]
        },
        options: {
            plugins:{
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    },
                    grid: {
                        beginAtZero: true,
                        // display: false
                    },
                },
            },
          maintainAspectRatio: false,
        }
});

let chartErrors = new Chart(errors, {
    type: 'doughnut',
    data: {
        labels: ['re-learn', 'needs practice', 'brain fart', 'perfect'],
        datasets: [{
            label: '# of',
            data: [0, 0, 0, 1],
            backgroundColor: ['red', 'orange', 'yellow', 'limegreen'],
            borderWidth: 0,
            // borderRadius: 4,
            cutout: '80%',
        }]
        },
    options: {
        plugins:{
            legend: {
                display: false
            }
        },
    }
})

function UpdateChart(dat) {
    let newData = dat;
    
    //Changing bar chart object data
    chartSet.data.datasets[0].data = newData;
    
    //Updating the chart
    chartSet.update();
}

function updateDonut(arr) {
    
    //Changing donut chart object data
    chartErrors.data.datasets[0].data = returnErrorsArray(arr);
    
    //Updating the chart
    chartErrors.update();
}

let typingLength;
let nextType = 0

const ZHkeyBindings = {
    '1': 'ㄅ',
    'q': 'ㄆ',
    'a': 'ㄇ',
    'z': 'ㄈ',
    '2': 'ㄉ',
    'w': 'ㄊ',
    's': 'ㄋ',
    'x': 'ㄌ',
    '3': 'ˇ',
    'e': 'ㄍ',
    'd': 'ㄎ',
    'c': 'ㄏ',
    '4': 'ˋ',
    'r': 'ㄐ',
    'f': 'ㄑ',
    'v': 'ㄒ',
    '5': 'ㄓ',
    't': 'ㄔ',
    'g': 'ㄕ',
    'b': 'ㄖ',
    '6': 'ˊ',
    'y': 'ㄗ',
    'h': 'ㄘ',
    'n': 'ㄙ',
    '7': '˙',
    'u': '一',
    'j': 'ㄨ',
    'm': 'ㄩ',
    '8': 'ㄚ',
    'i': 'ㄛ',
    'k': 'ㄜ',
    ',': 'ㄝ',
    '9': 'ㄞ',
    'o': 'ㄟ',
    'l': 'ㄠ',
    '.': 'ㄡ',
    '0': 'ㄢ',
    'p': 'ㄣ',
    ';': 'ㄤ',
    '/': 'ㄥ',
    '-': 'ㄦ',
    ' ': ' '
}

let currentChar;
let currentZY;
let currentTone;
let charQueue = [];

// let success = new Audio("sfx/ding3.wav");
// let correct = new Audio("sfx/click2.wav")
// let failure = new Audio("sfx/ohno.wav");

let calibrate = false;
let calibrateCount = 1;

function go(){
    
    ZHchar.style.fontWeight = 'bold';

    errorsWrap.classList.remove('disappear');
    buttons[1].classList.add('flip');

    const userInput = userText.value;
    console.log(userInput)
    createQueue(userInput);

    toneErrors = {};
    updateDonut(1);
    
    userText.classList.add('disappear');
    nextChar();
}

function nextChar(){
    
    if(mode == 1){
        addTriangles()
    }

    if (queueCount < limit){

        currentChar = charQueue[queueCount]

    } else {

        var N = Math.floor(Math.random() * 100) + 100
        currentChar = "我"

    }
    
    currentZY = charToZhu(currentChar)
    currentTone = currentZY[1]
    console.log(currentZY, currentTone)

    console.log(currentChar + " " + currentZY + " " + currentTone)

    ZHchar.innerHTML = currentChar;

    queueCount++

    if (speechBool === true) {
        speakWords(currentChar);
    }
}

function checkToneWrap(int) {
    return function executeOnEvent(e) {
        checkTone(int)
    }
}

function checkTone(input){
    if (ZHchar.innerText == 'G') {
        
        ZHchar.classList.remove('offset');
        go();

    } else if (ZHchar.innerText == 'F') {
        showTextArea();
    } else {
        if(calibrate === false) {
            if (calibrateCount == input) {
                
                onloads[input - 1].classList.add('disappear');
                onloads[input - 1].classList.remove('onload');

                // let chord = new Audio("sfx/" + input + ".webm");
                // chord.play();

                calibrateCount++;
            } 
            if (calibrateCount > 5) {
                
                calibrate = true;
                menu.classList.remove('disappear');
                showTextArea();
            }

        } else {
            if (input == currentTone){
                if(queueCount < targetLength) {
                    nextChar();
                
                    updateDonut(queueCount - 1)
                } else {
                    closeRound();
                }

                // success.currentTime = 0;
                // success.play();

            } else {
                
                // failure.currentTime = 0;
                // failure.play();

                if (input < 5) {
                    triangles[input - 1].classList.add('disappear');
                }

                if (logErrors === true){
                    
                    let inputArray = [input]

                    if (Object.keys(toneErrors).includes(currentChar)){
                        inputArray = toneErrors[currentChar];
                        if (!inputArray.includes(input)){
                            inputArray.push(input);
                        }
                        
                        //console.log(inputArray);
                    } 

                    toneErrors[currentChar] = inputArray;
                    
                }

                updateDonut(queueCount)
            }
        }
    }
}

window.addEventListener('keydown', (ev) =>{
    
    const input = ev.key.toLowerCase();
    const ZHinput = ZHkeyBindings[input]

    if (ev.key == 'ArrowUp' || ev.key == 'PageUp'){
        checkTone(1);
    } else if (ev.key == 'ArrowDown'|| ev.key == 'PageDown'){
        checkTone(3);
    } else if (ev.key == 'ArrowLeft'){
        checkTone(4);
    } else if (ev.key == 'ArrowRight'){
        checkTone(2);
    } else if (ev.key == 'Enter') {
        checkTone(5);
    } else {
        if(mode == 2){
            updateTyping(ev.key)
        }
    }
})

function updateTyping(inp) {
    
    if (currentTone == 1 && nextType == typingLength - 1) {
        specificLetter = ' '        
    } else {
        letterSpan = document.getElementById('span' + nextType);
        specificLetter = letterSpan.innerText;
    }
    
    if (ZHkeyBindings[inp] == specificLetter) {
        
        letterSpan.classList.add('complete')
        // correct.currentTime = 0;
        // correct.play();

        if(bpmfChar.includes(ZHkeyBindings[inp])){
            charIndex = bpmfChar.indexOf(ZHkeyBindings[inp]);
            currentCount = bpmfData[charIndex]

            currentCount++

            bpmfData.splice(charIndex, 1, currentCount)

            UpdateChart(bpmfData);
        }

        if (nextType < typingLength - 1) {
            nextType ++;
        } else {
            
            nextType = 0;

            waitForNext = setTimeout(nextChar(), 500);
        }
    }
}

function createQueue(str) {
    queueCount = 0;
    limit = str.length;
    
    charQueue = str.split('');

    // filter out any characters not found in the dataset

    // for (var n = 0; n < charQueue.length; n++){
    //     if (!chineseChars.includes(charQueue[n])){
    //         charQueue.splice(n, 1);
    //         n--
    //     }
    // }

    if (shuffleBool) {
        charQueue = shuffle(charQueue);
    }

    targetLength = charQueue.length;
}

function cycleMode(){
    if (mode == 1){
        removeTriangles();
        chartWrap.classList.remove('disappear');
        mode = 2;
    } else if (mode == 2) {
        chartWrap.classList.add('disappear');
        recognition.start();
        mode = 3;
    } else if (mode == 3) {
        addTriangles();
        recognition.abort();
        mode = 1;
    }
    buttons[0].innerText = mode;
}

function addTriangles() {
    triangles.forEach(tri =>{
        tri.classList.remove('disappear')
    })
}

function removeTriangles() {
    triangles.forEach(tri =>{
        tri.classList.add('disappear')
    })
}

function toggleErrors(){
    if (errorsWrap.classList.contains('disappear')) {
        errorsWrap.classList.remove('disappear');
        buttons[1].classList.add('flip');
    } else {
        errorsWrap.classList.add('disappear');
        buttons[1].classList.remove('flip');
    }
    
    // logErrors = !logErrors;
    // console.log(logErrors)
}

function toggleHint(){
    console.log("TO DO: replace zhuyin hint system")
    
    // if (true) {

    // } else {

    // }
}

function toggleShuffle(){
    if (!buttons[3].classList.contains('flip')) {
        shuffleBool = true;
        buttons[3].classList.add('flip');
    } else {
        shuffleBool = false;
        buttons[3].classList.remove('flip');
    }
}

function toggleSpeech(){
    if (!buttons[4].classList.contains('flip')) {
        speechBool = true;
        buttons[4].classList.add('flip');
    } else {
        speechBool = false;
        buttons[4].classList.remove('flip');
    }
}

function returnErrorsArray(total){
    let brainFart = [];
    let practiceMore = [];
    let reLearn = [];
    

    //index = Object.keys(toneErrors);

    for (const key in toneErrors) {
        const numberOfErrors = toneErrors[key].length;
        console.log(numberOfErrors)

        if (numberOfErrors < 2) {
            brainFart.push(key);
        } else if (numberOfErrors == 2) {
            practiceMore.push(key);
        } else {
            reLearn.push(key);
        }
    }
    console.log(reLearn, practiceMore, brainFart);

    const bfTally = brainFart.length;
    const pmTally = practiceMore.length;
    const rlTally = reLearn.length;

    const totalErrors = bfTally + pmTally + rlTally;
    const correctTally = total - totalErrors;
    const finalTally = [rlTally, pmTally, bfTally, correctTally];

    console.log(finalTally)
    return finalTally;
}

function closeRound() {
    ZHchar.innerText = 'F'
    updateDonut(queueCount);
}

function showTextArea() {
    userText.classList.remove('disappear');
    ZHchar.innerText = 'G';
    ZHchar.classList.add('offset')
    
    triangles.forEach(tri =>{
        tri.classList.add('disappear')
    })
}

async function speakWords(str){
    speechSetup = window.speechSynthesis;

    speechSetup.cancel();
    
    utterance = new SpeechSynthesisUtterance(str);
    utterance.lang = "zh"
    utterance.rate = .8;
    
    speechSetup.speak(utterance);
}

function shuffle(arr){
    let unshuffled = arr;
    let shuffled = [];

    unshuffled.forEach(word =>{
        randomPos = Math.floor(Math.random() * shuffled.length);

        shuffled.splice(randomPos, 0, word);
    })
    
    //console.log(shuffled);
    return shuffled;
}

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.lang = 'zh';

recognition.addEventListener("result", (e) => {
  const text = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("");

  if (e.results[0].isFinal) {
    array = text.split(''),
    
    array.forEach((element)=>{
        if (isNaN(element)){
            
            if (charToZhu(element) == currentZY){
                nextChar();
            }

        } else {
            console.log(element);
        }

    })   
  }
});

recognition.addEventListener("end", () => {
  if(mode == 3){
    recognition.start();
  }
});

//recognition.start();