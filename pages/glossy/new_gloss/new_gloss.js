const newLineTemplate = document.querySelector("[line-entry-template]")
const gridColumn = document.getElementById('gridColumn')
const userTitle = document.getElementById('userTitle')

const regex = /[A-Za-z0-9]/

var lineCount = 0
var totalLines = 0

function addNewLine() {
    const newLine = newLineTemplate.content.cloneNode(true)
    for (var i = 0; i < newLine.children.length; i++) {
        var child = newLine.children[i]
        child.classList.add('line' + lineCount)

        if (i == 1) {
            
            command = "deleteLine("+ lineCount +")"
            
            child.setAttribute('onclick', command)
        }
        if (i == 2) {
            
            child.addEventListener("keydown", checkColumnOne)
        }
    }
    
    gridColumn.append(newLine)
    lineCount++
    totalLines++
}

function deleteLine(n) {
    
    if (totalLines > 1) {
        lineElements = document.getElementsByClassName('line' + n);
        console.log(lineElements)
    
        while(lineElements[0]) {
            lineElements[0].parentNode.removeChild(lineElements[0]);
        }

        totalLines--
    }
}

function generateJSON() {
    const allEnglishElements = document.querySelectorAll('.grid1:not(.top)');
    const allChineseElements = document.querySelectorAll('.grid2:not(.top)');
    const allPOSElements = document.querySelectorAll('.grid3:not(.top)');

    var allEnglishWords = [];
    var allChineseWords = [];
    var allPOS = [];
    var fullData = [];

    Array.from(allEnglishElements).forEach(element => {
        allEnglishWords.push(element.value)
    })
    Array.from(allChineseElements).forEach(element => {
        allChineseWords.push(element.value)
    })
    Array.from(allPOSElements).forEach(element => {
        allPOS.push(element.value)
    })

    for(var i = 0; i < allEnglishWords.length; i++) {     
    
        fullData.push({ 
            "english" : allEnglishWords[i],
            "chinese" : allChineseWords[i],
            "pos"     : allPOS[i] 
        });
    }


    JSONstring = JSON.stringify(fullData)
    console.log(JSONstring)
    sessionStorage.setItem("entry_" + userTitle.value, JSONstring)
    download(JSONstring, userTitle.value + '.json', 'text/plain');
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function checkColumnOne(e) {
    element = e.target
    pressedKey = e.key

    if (pressedKey.length == 1) {
        str = element.value + e.key
    } else {
        str = element.value
    }

    parentEl = element.parentElement.children
    childIndex = Array.from(parentEl).indexOf(element)
    //console.log(parentEl, element, childIndex)
    
    console.log(regex.test(str))

    if (!regex.test(str)) {
        parentEl[childIndex + 1].setAttribute("disabled", true)
        parentEl[childIndex + 2].setAttribute("disabled", true)

    } else {
        parentEl[childIndex + 1].removeAttribute("disabled")
        parentEl[childIndex + 2].removeAttribute("disabled")
    }
}

addNewLine()