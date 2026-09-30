const inputText = document.getElementById('inputText');
const displayBox = document.getElementById('displayBox');


// general mode can be "display" or "game"
var mode = "game";

// game mode can be "match" or "battle"
var gameMode = "match";

// SINGLES can match:
// lowercase to uppercase AND vice-cersa
// picture to letter AND vice versa (NOT case-sensitive)
// audio to letter (NOT case-sensitive)
// audio to picture

// MULTIS can match:
// word to picture AND vice versa (NOT case-sensitive)

// input mode can be "single" or "multi"
var inputMode = "single";

// trigger mode can be "auto", "manual", or "timed"
var triggerMode = "auto";

var timeoutId;

var firstCorrect;
var matchQueue = [];
var teamScores = {
    "red": 0,
    "blue": 0
}


const lettersPath = "../../data/abc_let.json"
const imgsPath = "../../data/abc_img.json"
var abcLets
var abcImgs

function loadData(path){
    fetch(path)
    .then(res => {
        if (res.ok) {
            console.log('Fetched data from ' + path);
        } else {
            console.log('Couldnt fetch data from ' + path)
        }
        return res.json()
    })
    .then(data => {
        if (data.a) {
            abcLets = data;
        } else if (data.apple) {
            abcImgs = data;
        }
        
        return data
    })
    .catch(error => console.log(error))
}

loadData(lettersPath);
loadData(imgsPath);


function processInput(str) {
    var dataDict = {
        "team" : null,
        "value" : null,
        "action" : null,
        "media" : null
    }

    // add further effects in the future

    var dataArr = str.split("_");

    console.log(dataArr);
    dataArr.forEach((item) => {
        if(item.startsWith("#")){
            dataDict.team = item.split("#")[1];
        } else if(item.startsWith("~")){
            dataDict.media = item.split("~")[1];
        } else if(item.startsWith("!")){
            dataDict.action = item.split("!")[1];
        } else {
            dataDict.value = item;
        }
    });

    return dataDict;
}

inputText.addEventListener('input', (event) => {

    clearTimeout(timeoutId);

    // Set a new timer for 100ms (0.1 seconds)
    timeoutId = setTimeout(() => {
            const inputValue = event.target.value.split("\n").filter(line => line.trim() !== "").pop();
            const processedData = processInput(inputValue);
            
            // clear the input field after processing
            inputText.value = "";

            if (mode === "display") {

                if (processedData.action === "clear") { 
                    displayBox.innerHTML = "";
                } else if (processedData.action === "backspace") {
                    displayBox.lastElementChild?.remove();
                } else {
                    var newSpan = document.createElement('span');
                    newSpan.classList.add(processedData.team);
                    newSpan.textContent = processedData.value;
                    displayBox.appendChild(newSpan);
                }
            } else if (mode === "game") { 

                if (gameMode === "match") {
                    if (matchQueue.length === 0) {
                        matchQueue = createMatchQueue(["A", "B", "C", "T"], 10);
                        console.log("New match queue created: ", matchQueue);

                        imgToDisplay(matchQueue[0].toLowerCase());
                    }

                    if(processedData.value.toLowerCase() === matchQueue[0].toLowerCase()) {
                        console.log("Correct match for: ", processedData.value);

                        teamScores[processedData.team] += 1;
                        document.getElementById(`score${processedData.team === "red" ? 1 : 2}`).textContent = teamScores[processedData.team];
                        
                        matchQueue.shift();
                        if (matchQueue.length > 0) {
                            imgToDisplay(matchQueue[0].toLowerCase());
                        }
                    }

                }
            }
    }, 10);

});

function createMatchQueue(charArr, len) {
    var baseArr = [...charArr];
    var newArr = [];

    for (var i = 0; i < len; i++) {
        var randomIndex = Math.floor(Math.random() * baseArr.length);
        newArr.push(baseArr[randomIndex]);
        baseArr.splice(randomIndex, 1);

        if (baseArr.length === 0) {
            baseArr = [...charArr];
        }
    }

    return newArr;
}

function iconPriority(dict) {
    if (dict.svg_col) {
        return dict.svg_col;
    } else if (dict.svg_bw) {
        return dict.svg_bw;
    } else if (dict.icon_bw) {
        return dict.icon_bw;
    } else if (dict.icon_col) {
        return dict.icon_col;
    }
}

console.log(createMatchQueue(["A", "B", "C", "T"], 10));

function imgToDisplay(char) {
    displayBox.innerHTML = "";
    var newImg = document.createElement('img');
    newImg.src = iconPriority(abcImgs[abcLets[char].Action]);
    displayBox.appendChild(newImg);
}