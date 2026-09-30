const inputText = document.getElementById('inputText');
const displayBox = document.getElementById('displayBox');


// general mode can be "display" or "game"
var mode = "display";

// game mode can be "match" or "battle"
var gameMode = null;

// SINGLES can match:
// lowercase to uppercase AND vice-cersa
// picture to letter AND vice versa (NOT case-sensitive)
// audio to letter (NOT case-sensitive)
// audio to picture

// MULTIS can match:
// word to picture AND vice versa (NOT case-sensitive)

// input mode can be "single" or "multi"
var inputMode = null;


var timeoutId;

var firstCorrect;
var matchQueue = [];
var teamScores = {
    "red": 0,
    "blue": 0
}


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

console.log(createMatchQueue(["A", "B", "C", "T"], 10));