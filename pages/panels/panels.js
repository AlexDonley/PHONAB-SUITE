import { shuffle } from '../../js_modules/shuffle.js'
import {
    targetLang, speechRec, 
    setLanguage, startRecLoop, stopRecLoop
} from '../../js_modules/speech-rec.js'
import { 
    urlConfigs, writeConfigValues 
} from '../../js_modules/url-query.js'
import { genWPStrToArr, checkArrOverlap } from '../../js_modules/word-process.js'

const gameBoard     = document.querySelector('#gameBoard')
const speechLog     = document.querySelector('#speechLog')
const speechNow     = document.querySelector('#speechNow')
const goBtn         = document.querySelector('#goBtn')
const micButton     = document.querySelector('#micButton')
const micIcon       = document.querySelector('#micIcon')
const teamBar       = document.querySelector('#teamBar')
const scoreKeep     = document.querySelector('#scoreKeep')
const suggestBox    = document.querySelector('#suggestBox')
const vocabQueue    = document.querySelector('#vocabQueue')
const userPickTeams = document.querySelector('#userPickTeams')
const userPickGrid  = document.querySelector('#userPickGrid')
const userPickList  = document.querySelector('#userPickList')
const optionsMenu   = document.querySelector('#optionsMenu')

goBtn.addEventListener('click', startRound)
micButton.addEventListener('click', toggleRec)
suggestBox.addEventListener('click', nextSentence)

const smallWin = new Audio("../../sfx/success.mp3")
const bigWin = new Audio("../../sfx/copyability.mp3")
const boardWin = new Audio("../../sfx/yo2.mp3")

smallWin.volume = 0.45
bigWin.volume = 0.45
boardWin.volume = 0.4

let wordlist = []
let boardQueue = []
let unspoken = []

let listIndeces = []
let suggestedSentences = []
let sentencePicker = 0

const teamColors = ['red', 'blue', 'yellow', 'green']
let teamSquares = []
let scoreArr = [0, 0, 0, 0]

let teamCount = 2
let turn = 1

let boardWidth  = 4
let boardHeight = 4
let totalTiles

let listenBool = false

let fullWordlist


function populateGameBoard(arr) {
    const spacing = "1fr "
    
    gameBoard.innerHTML = ''
    boardQueue = []

    arr.forEach(word => {
        unspoken.push(word.toLowerCase())
    })
    teamSquares = []
    
    gameBoard.style.gridTemplateRows = spacing.repeat(boardHeight)
    gameBoard.style.gridTemplateColumns = spacing.repeat(boardWidth)

    totalTiles = boardWidth * boardHeight

    let iterations = Math.ceil(totalTiles / arr.length)
    console.log(iterations)

    for (let n=0; n < iterations; n++) {
        const shuffledArr = shuffle(arr)
        boardQueue = boardQueue.concat(shuffledArr)
    }

    for (let n = 0; n < totalTiles; n++) {
        
        const newWord = document.createElement('div')
        newWord.classList += 'one-word shiny'

        const wordWrap = document.createElement('div')
        wordWrap.innerText = boardQueue[n]
        wordWrap.classList += 'word-wrap'
        wordWrap.setAttribute('id', n + '_word')
        newWord.append(wordWrap)

        gameBoard.append(newWord)

        teamSquares.push(null)
    }
}

function populateWordOptions() {
       
    userPickList.innerHTML = ''

    for (let i=0; i<fullWordlist.length; i++) {
        let newOption = document.createElement('option')
        newOption.innerText = fullWordlist[i].title
        newOption.value = i

        userPickList.append(newOption)
    }

    userPickList.addEventListener("change", clickQueue())
}

function clickQueue() {

    return function executeOnEvent(e) {
        
        var n = e.target.value
        queueOption(n)
    }
}

function queueOption(n) {
    if (!listIndeces.includes(n)) {
        listIndeces.push(n)
        
        const wrapDiv = document.createElement('div')
        wrapDiv.classList.add('queue-item')
        wrapDiv.id = n + "_queued"
        
        const newDiv = document.createElement('div')
        newDiv.innerText = fullWordlist[n].title
        newDiv.value = n
    
        const deleteBtn = document.createElement('button')
        deleteBtn.id = "delete_" + n
        deleteBtn.innerText = "X"
        deleteBtn.addEventListener("click", dequeueOption())
    
        wrapDiv.append(newDiv)
        wrapDiv.append(deleteBtn)
        vocabQueue.append(wrapDiv)
    }
}

function dequeueOption() {

    return function executeOnEvent(e) {
        const n = e.target.id.substring(7);

        const thisOption = document.getElementById(n + "_queued")
        thisOption.remove()
    
        if (listIndeces.includes(String(n))) {
            const thisIndex = listIndeces.indexOf(String(n))
    
            listIndeces.splice(thisIndex, 1)
            console.log(thisIndex, listIndeces)
        }
    }
}

// Speech rec section

setLanguage('en')

function toggleRec() {
    if (listenBool) {
        listenBool = false
        micIcon.innerText = "radio_button_unchecked"
        micButton.classList.remove('on')
        stopRecLoop()
    } else {
        listenBool = true
        micIcon.innerText = "radio_button_checked"
        micButton.classList.add('on')
        startRecLoop(1, 1, 0, targetLang)
    }
}

speechRec.addEventListener("result", (e) => {
  
    const text = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

    //const speaklist = text.split(' ')

    speechNow.innerHTML = ""
    speechNow.innerText = text

    //const utteredWords = genWPStrToArr(text, targetLang)

    if (e.results[0].isFinal) {
        console.log('Comparing sentences...')

        const logDiv = document.createElement('div')
        logDiv.classList.add("one-log")
        logDiv.classList.add("text-" + teamColors[turn - 1])
        logDiv.innerText = text

        speechNow.innerHTML = ""

        speechLog.prepend(logDiv)
        
        checkBoard(text, turn)
        nextTeam()
    }
})

function checkBoard(str, team){
    console.log('checking words');
    let multiplier = 1;
    let markWord = null

    if (str.toLowerCase().includes(suggestedSentences[sentencePicker].toLowerCase())) {
        multiplier = 2
    }

    for (let i = 0; i < totalTiles; i++) {
        
        const lowerTarg = boardQueue[i].toLowerCase();

        const thisTarg = genWPStrToArr(lowerTarg);
        const thisUtter = genWPStrToArr(str);
        
        if (
            //str.toLowerCase().includes(lowerTarg) 
            checkArrOverlap(thisTarg, thisUtter)
            && unspoken.includes(lowerTarg)
        ) {
            gameBoard.childNodes[i].classList.add(teamColors[team - 1])
            teamSquares[i] = team
            
            scoreArr[team - 1] += 100 * multiplier;
            scoreKeep.children[team - 1].innerText = scoreArr[team - 1]

            markWord = boardQueue[i]
        }
    }

    const index = unspoken.indexOf(markWord);
    console.log(index)
    
    if (index >= 0) {
        unspoken.splice(index, 1);
    }

    if (markWord) {
        nextSentence()
    }

    checkForLineup(teamSquares, boardWidth, boardHeight, Math.min(boardWidth, boardHeight), team, markWord)
}

function nextTeam() {

    if (turn < teamCount) {
        turn++
    } else {
        turn = 1
    }

    teamBar.children[0].style.fill = teamColors[turn - 1]

    console.log("next team")
}

function populateTeams(numOfTeams) {

    for (let n=0; n<numOfTeams; n++) {
        
        let teamScoreBar = document.createElement('div')
        teamScoreBar.innerText = scoreArr[n]
        teamScoreBar.setAttribute('id', "team" + n + "score")
        teamScoreBar.classList += teamColors[n] + " shiny"

        scoreKeep.append(teamScoreBar)
    }
}

function nextSentence() {
    if (sentencePicker < suggestedSentences.length - 1) {
        sentencePicker ++
    } else {
        sentencePicker = 0
    }
    setSuggestedSentence(sentencePicker)
}

function setSuggestedSentence(n) {

    const sentWrap = document.createElement('div')
    sentWrap.classList.add('sentence-center')
    sentWrap.innerText = suggestedSentences[n] + "..."

    suggestBox.innerHTML = ''
    suggestBox.append(sentWrap)
}

function checkForLineup(arr, w, h, n, team, correctBool) {
    
    let winningLines = []

    // Check rows for a win
    for (let row = 0; row < h; row++) {
        let rowStart = row * n;
        let isRowWin = true;
        for (let col = 1; col < w; col++) {
            if (arr[rowStart] === null || arr[rowStart] !== arr[rowStart + col]) {
                isRowWin = false;
                break;
            }
        }
        if (isRowWin) {
            for (let col = 0; col < w; col++) {
                winningLines.push((row * w) + col)
            }
        } 
    }

    // Check columns for a win
    for (let col = 0; col < w; col++) {
        let isColWin = true;
        for (let row = 1; row < h; row++) {
            if (arr[col] === null || arr[col] !== arr[col + row * n]) {
                isColWin = false;
                break;
            }
        }
        if (isColWin) {
            for (let row = 0; row < h; row += 1) {
                console.log(col + (row * w))
                if (!winningLines.includes(col + (row * w))) {
                    winningLines.push(col + (row * w))
                }
            }
        }
    }

    // Check top-left to bottom-right diagonal for a win
    let isDiag1Win = true;
    for (let i = 1; i < n; i++) {
        if (arr[0] === null || arr[0] !== arr[i * (n + 1)]) {
            isDiag1Win = false;
            break;
        }
    }
    if (isDiag1Win) {
        console.log('diagonal right')
        for (let col = 0; col < w; col++) {
            if (!winningLines.includes(col + (col*w))) {
                winningLines.push(col + (col*w))
            }
        }
    }

    // Check top-right to bottom-left diagonal for a win
    let isDiag2Win = true;
    for (let i = 1; i < (n+1); i++) {
        if (arr[n - 1] === null || arr[n - 1] !== arr[i * (n - 1)]) {
            isDiag2Win = false;
            break;
        }
    }
    if (isDiag2Win) {
        console.log('diagonal left')
        for (let col = 0; col < w; col++) {
            if (!winningLines.includes(col + (w * (w - 1 - col)))) {
                winningLines.push(col + (w * (w - 1 - col)))
            }
        }
    }; 

    if (winningLines.length > 0) {
        scoreArr[team - 1] += 100 * winningLines.length
        scoreKeep.children[team - 1].innerText = scoreArr[team - 1]

        bigWin.play()
        
        if (unspoken.length > 0) {
            renewSquares(winningLines)
        } else {
            // reset the board and arrays            
            boardWin.play()
            
            wordlist = [...fullWordlist[userPickList.value].words]
            populateGameBoard(wordlist)
        }
    } else if (correctBool) {
        smallWin.play()
    }

    if (!teamSquares.includes(null)) {
        boardWin.play()
        
        let fullArr = []

        for (let i=0; i<teamSquares.length; i++) {
            fullArr.push(i)
        }

        renewSquares(fullArr)
    }
    
    // console.log(winningLines)
    // If no winner, return null
    return null;
}

function renewSquares(arr) {
    arr.forEach(value => {
        
        const replacementWord = unspoken[Math.floor(Math.random() * unspoken.length)]
        boardQueue[value] = replacementWord

        const tileText = document.getElementById(value + "_word")
        tileText.innerText = replacementWord

        for (let i=0; i<teamCount; i++) {
            tileText.parentElement.classList.remove(teamColors[i])
        }

        teamSquares[value] = null

    })
}

function startRound() {
    if (listIndeces.length > 0) {
        wordlist = []
        suggestedSentences = []
        
        listIndeces.forEach(index => {
            wordlist = wordlist.concat(fullWordlist[index].words)
            suggestedSentences = suggestedSentences.concat(fullWordlist[index].sentences)
        })
    
        teamCount = userPickTeams.value
        boardWidth = userPickGrid.value
        boardHeight = userPickGrid.value
    
        console.log(teamCount, boardWidth, boardHeight)
    
        populateGameBoard(wordlist)
    
        populateTeams(teamCount)
        nextTeam()
    
        setSuggestedSentence(0)
    
        optionsMenu.style.display = "none"
    }
}

writeConfigValues(userPickTeams, userPickGrid)

async function loadJSON(filename){
    try {
        let response = await fetch('../../data/' + filename + '.json');
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        let data = await response.json();
        processWordlist(data)
        console.log("Data:", data);
    } catch (error) {
        console.error("Error:", error);
    }
}

function processWordlist(data) {
    fullWordlist = data
    populateWordOptions()
    if (urlConfigs) {
        if (urlConfigs.vocabs) {
            urlConfigs.vocabs.split('_').forEach(val => {
                console.log(fullWordlist[val].title)
                queueOption(val)
            })
        }
    
        if (urlConfigs.gonow == 'true') {
            startRound()
        }
    }
}

loadJSON('panels_words')
