const bigWheel          = document.getElementById('bigWheel')
const targDisplay       = document.getElementById('targDisplay')
const speechDisplay     = document.getElementById('speechDisplay')
const spinBtn           = document.querySelector('.spinBtn')
const wheelSpokes       = document.querySelector('.wheelSpokes')
const allTeams          = document.querySelector('.all-teams')
const percentScore      = document.getElementById('percentScore')
const rawScore          = document.getElementById('rawScore')

let percent = 0
let raw = 0

const teamColors = ["red", "blue", "yellow", "green", "purple", "orange"]
let teamScores = [0]
let teamPick = 0
let spinMode = "SHUFFLE"

let rotateValue = 0
let slicesNum = 0
let oneSlice = 0
let randHue = 0
let thisSlice = null

let indexQueue = []
let shuffledQueue = []
let prevIndex = 0
let nowIndex = 0

let listenBool = true

let targetArr = []
let utterArr = []

const story3A = [
    "Look at the store. It's clean!",
    "Wow! There are new toys on the table. ",
    "Oh! There's a lamp on the table.",
    "Hmm... there's a hole in the window.",
    "Shh!"
]
const story3B = [
    "Hi Tom! Do you know what today is?",
    "Hmm... is it a holiday?",
    "Yes! It's the Dragon Boat Festival!",
    "Wow! What do people do on this day?",
    "Many people watch dragon boat races and eat zongzi.",
    "I've heard of zongzi. Are they sticky rice dumplings wrapped in leaves?",
    "Yes! They usually have ingredients inside like peanuts, shrimp, and pork."
]
const story4A = [
    "They're so yummy!",
    "That sounds delicious! Why do people race boats?",
    "It's to remember a great man named QuYuan.",
    "Oh! I know QuYuan. Was he a famous poet?",
    "That's right, people race to honor him.",
    "That's very interesting. I want to see a dragon boat race!",
    "Me, too. We can go to the river to watch them.",
    "Yes! And let's eat zongzi too."
]

const combinedStory = story3B.concat(story4A)

function populateWheel(arr) {
    slicesNum = arr.length
    
    if (slicesNum < 4) {
        
        window.alert("Wheel must have at least 4 options")

    } else {
        bigWheel.innerHTML = ''
        randHue = Math.ceil(Math.random()*360)

        for (let i = 0; i < arr.length; i++) {
            oneSlice = (360 / slicesNum)
            
            const newDiv = document.createElement('span')
            newDiv.setAttribute("style", "--i:" + (i + 1))
            newDiv.classList.add('slice')
            newDiv.id = i + "_slice"
            newDiv.style.transform = "rotate(calc(" + oneSlice +"deg * var(--i)))"
            newDiv.style.background = "hsl(" + (randHue) + " 100% " + (40 - Math.ceil(Math.random()*20)) + "%)"

            const percentProp = 100 * oneSlice / 90
            const deduct = (100 - percentProp) / 2 + 3
            newDiv.style.clipPath = "polygon(" + deduct + "% 0%, 50% 100%, " + (100 - deduct) + "% 0%)"

            const newSpan = document.createElement('span')
            newSpan.style.color = 'white'
            newSpan.innerText = arr[i]
            newSpan.classList.add("slice-text")

            newDiv.append(newSpan)
            bigWheel.append(newDiv)
        }
    }
}

function populateIndexQueue(arr) {
    indexQueue = []
    
    for (let i = 0; i < arr.length; i++) {
        indexQueue.push(i)
    }

    shuffledQueue = shuffle(indexQueue)
}

populateWheel(combinedStory)
populateIndexQueue(combinedStory)

function spinTheWheel() {
    if (thisSlice) {
        thisSlice.style.background = "hsl(" + (randHue) + " 100% " + (40 - Math.ceil(Math.random()*20)) + "%)"
        thisSlice.children[0].style.color = 'white'
    }
    
    if (spinMode == "RANDOM") {
        rotateValue += Math.ceil(Math.random()*slicesNum) * oneSlice + 360;
    } else if (spinMode == "SHUFFLE") {
        if (shuffledQueue.length > 0) {
            prevIndex = nowIndex

            nowIndex = shuffledQueue[0]
            shuffledQueue.shift()

            console.log(prevIndex, nowIndex)
            
            rotateValue += (nowIndex - prevIndex) * oneSlice + 360;
        }
    } else if (spinMode == "INCREMENT") {
        rotateValue += oneSlice + 360;
    }
    
    bigWheel.style.transform = "rotate(" + rotateValue + "deg)"

    pickedIndex = (slicesNum - (((rotateValue + 120) / oneSlice) % slicesNum)) % slicesNum
    
    setTimeout(() => {
        
        targDisplay.innerHTML = ''

        targetArr = omitPunctuation(combinedStory[pickedIndex]).toLowerCase().split(" ")
        console.log(targetArr)
        targDisplayArr = combinedStory[pickedIndex].split(" ")
        targDisplayArr.forEach(word => {
            const wordSpan = document.createElement('span')
            wordSpan.classList.add("one-word")
            wordSpan.innerText = word

            targDisplay.append(wordSpan)
        })
        
        thisSlice = document.getElementById(pickedIndex + "_slice")
        //thisSlice.classList.add('highlight')
        thisSlice.style.background = 'white'
        thisSlice.children[0].style.color = 'black'

    }, 1000)
    
    nextTeam()

    return pickedIndex
}


function assignSliceToTeam(n) {
    if (thisSlice) {
        thisSlice.style.background = teamColors[n]
        thisSlice.children[0].style.color = 'white'
    
        teamScores[n] += raw
        allTeams.children[n].innerText = teamScores[n]

        thisSlice = null
    }
}

function addTeam() {
    let totalTeams = allTeams.children.length
    
    if (totalTeams < teamColors.length) {
        newBtn = document.createElement('button')
        newBtn.classList += "team-button darken " + teamColors[totalTeams]
        newBtn.setAttribute("onclick", "assignSliceToTeam(" + totalTeams + ")")
        
        if (teamScores[totalTeams] == undefined) {
            teamScores[totalTeams] = 0
        }
        
        newBtn.innerText = teamScores[totalTeams - 1]
        newBtn.disabled = true

        allTeams.append(newBtn)
    }
}

function subtractTeam(){
    let totalTeams = allTeams.children.length
    
    if (teamPick == totalTeams - 1) {
        prevTeam()
    }

    if (totalTeams > 1) {
        allTeams.children[totalTeams - 1].remove()
    }
}

function nextTeam() {
    allTeams.children[teamPick].disabled = true
    allTeams.children[teamPick].classList.add("darken")
    
    if (teamPick < allTeams.children.length - 1) {
        teamPick++
    } else {
        teamPick = 0
    }    

    allTeams.children[teamPick].disabled = false
    allTeams.children[teamPick].classList.remove("darken")
}

function prevTeam() {
    allTeams.children[teamPick].disabled = true
    allTeams.children[teamPick].classList.add("darken")
    
    if (teamPick > 0) {
        teamPick--
    } else {
        teamPick = allTeams.children.length - 1
    }    

    allTeams.children[teamPick].disabled = false
    allTeams.children[teamPick].classList.remove("darken")
}

// shuffle array function

function shuffle(arr){
    let unshuffled = arr;
    let shuffled = [];
  
    unshuffled.forEach(word =>{
        const randomPos = Math.round(Math.random() * shuffled.length);
  
        shuffled.splice(randomPos, 0, word);
    })
    
    // console.log(shuffled);
    return shuffled;
}


// controls for USB remote
// remote includes up, down, b, and enter

window.addEventListener('keydown', (e) =>{
    switch(e.key){
        case 'ArrowDown':
            nextTeam()
            break
        case 'ArrowUp':
            assignSliceToTeam()
            break
        case 'Enter':
            spinTheWheel()
            break
    }
})

// - - - SPEECH RECOGNITION SNIPPET - - - //

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true;

function setLanguage(str) {
  const targetLang = str
  recognition.lang = targetLang
  //langDisplay.innerText = str
}

setLanguage('en');

recognition.addEventListener("result", (e) => {
  
  const text = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("")

  // wordlist = processStrToArr(text)
  utterArr = omitPunctuation(text).toLowerCase().split(' ')
  wordlist = text.split(' ')

  speechDisplay.innerHTML = ""
  n = 0

  wordlist.forEach((element) => {
    const wordSpan = document.createElement('span')
    wordSpan.setAttribute('id', ('utter' + n))
    wordSpan.innerText = element + " "

    speechDisplay.appendChild(wordSpan)
    n++
  })

  if (e.results[0].isFinal) {
    console.log(utterArr)
    compareArrays(targetArr, utterArr, "PERCENTAGE");
    // compareArrays(utterArr, targetArr, "PERCENTAGE");
  }
})

recognition.addEventListener("end", () => {
  if(listenBool){
    recognition.start();
  }
})

// - - - END OF SPEECH RECOGNITION SNIPPET - - - //

// - - - STRING PARSING SNIPPING - - - //

function omitPunctuation(str) {
    noPunct = str.replace(/[.。…—,，\/#!$%\^&\*;；{}=_`~()[\]?]/g,"")
                .replace(/\s+/g, " ");
    return noPunct;
}

// - - - END OF STRING PARSING SNIPPING - - - //

function compareArrays(targetArrLocal, utterArrLocal, mode) {
    if (mode == "PERCENTAGE") {
        percent = 0
        raw = 0
        
        let targetOccs = {}
        let utterOccs = {}

        let revisedUtter = []
        let clustersMap = []
        
        const arrIntersect = targetArrLocal.filter(value => utterArrLocal.includes(value));
        console.log(arrIntersect)

        for (const word of targetArrLocal) {
            targetOccs[word] = targetOccs[word] ? targetOccs[word] + 1 : 1;
        }
        console.log(targetOccs)

        for (const word of utterArrLocal) {
            if (utterOccs[word]) {
                if (utterOccs[word] < targetOccs[word]){
                    utterOccs[word] += 1
                    revisedUtter.push(word)
                }
                
            } else {
                if (arrIntersect.includes(word)) {
                    utterOccs[word] = 1
                    revisedUtter.push(word)
                }
            }
        }
        console.log(utterOccs, revisedUtter)

        // this code will need some revision but it works for now

        for (const word in targetArrLocal) {
            clustersMap.push(null)
        }

        for (let i = 0; i < targetArrLocal.length; i++) {
            let clusterCount = 1

            if (
                    revisedUtter.indexOf(targetArrLocal[i]) >= 0
                    && clustersMap[i] == null
                ) 
            {
                clustersMap[i] = "x"
                indexOffset = revisedUtter.indexOf(targetArrLocal[i]) - i

                for (let j = 1; i + j < targetArrLocal.length; j++) {
                    if (targetArrLocal[i + j] == revisedUtter[indexOffset + i + j]) {
                        clusterCount += 1
                        clustersMap[i + j] = "x"
                    }    
                }
    
                for (let k = 0; k < clustersMap.length; k++) {
                    if (clustersMap[k] == "x") {
                        clustersMap[k] = clusterCount
                    }
                }
                console.log(clustersMap)
            }
        }
        

        // clear visual entirely
            
        Array.from(targDisplay.children).forEach(element => {
            element.classList = "one-word"
        })


        // find maximum in clustersMap

        let maxCluster = Math.max(...clustersMap)

        if (!(maxCluster == null)) {
            
            let minCluster = Math.min(...clustersMap)
            console.log(maxCluster, minCluster)

            if (maxCluster < clustersMap.length && minCluster == maxCluster) {
                Array.from(targDisplay.children).forEach(element => {
                    element.classList.add("right-word")
                })
            } else {
                for (let n = 0; n < clustersMap.length; n++) {
                    if (clustersMap[n] > 0) {
                        if (clustersMap[n] == maxCluster) {
                            targDisplay.children[n].classList.add("full-point")
                            raw += 1.0
                        } else {
                            targDisplay.children[n].classList.add("half-point")
                            raw += 0.5
                        }
                    }
                }
            }
        }

        percent = Math.round(100 * raw / targetArrLocal.length, 1)
        updateScores(percent, raw)


        return arrIntersect
    }
}

function updateScores(perc, points) {
    percentScore.innerText = perc
    rawScore.innerText = points
}

// function secondSmallestElement(arr) {
//     let smallest = Infinity;
//     let secondSmallest = Infinity;
    
//     for (let i = 0; i < arr.length; i++) {
//         if (arr[i] < smallest) {
//             secondSmallest = smallest;
//             smallest = arr[i];
//         } else if (arr[i] < secondSmallest && arr[i] !== smallest) {
//             secondSmallest = arr[i];
//         }
//     }
    
//     return secondSmallest;
// }
