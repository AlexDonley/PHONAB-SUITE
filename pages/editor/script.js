import { 
    addBook, addPart, addBookWithParts,
    getBookParts, getFilteredBooks, getPartById,
    fetchWithCache, loadAllBooks
} from '../../js_modules/supabase-crud.js'

const addMercyBtn   = document.querySelector('#addMercyBtn');
const saveBookBtn   = document.querySelector('#saveBookBtn');
const addChunkBtn   = document.querySelector('#addChunkBtn');
const mercyLines    = document.querySelector('.mercy-lines');

const createTitle       = document.querySelector('#createTitle');
const createAuthor      = document.querySelector('#createAuthor');
const chunkArea         = document.querySelector('#chunkArea');
const chunkTemplate     = document.querySelector('#chunkTemplate')

addMercyBtn.addEventListener("click", addMercyLine)
saveBookBtn.addEventListener("click", trySaveBook)
addChunkBtn.addEventListener("click", addChunk);

function addMercyLine() {
    const newLine = mercyTemplate.content.cloneNode(true);
    console.log(newLine, mercyLines)
    mercyLines.append(newLine);
}

function trySaveBook() {

    let noNullCheck = true

    const theseChunks = document.querySelectorAll('.chunk-div')
    theseChunks.forEach(chunk => {
        if (chunk.querySelector('textarea').value == '') {
            noNullCheck = false
        }
    })

    if (createTitle.value == '' || noNullCheck == false) {
        alert('Fill in all blanks before attempting to save!')
    } else {

        let mercyDict = {}

        const mercyLines = document.querySelectorAll('.mercy-line')
        mercyLines.forEach(line => {
            const word = line.querySelector('.mercy-input').value
            const substituteElems = line.querySelectorAll('.mercy-translation')
            let subArr = []
            substituteElems.forEach(elem => {
                if (elem.value != '') {
                    subArr.push(elem.value)
                }
            })
            mercyDict[word] = subArr
        })

        const entryBookData = {
            'title' : createTitle.value,
            'author' : createAuthor.value || 'guest',
            'lang' : 'en',
            'mercy_words' : mercyDict
        }
        let entryPartsData = []

        theseChunks.forEach (chunk => {
            const newChunkObj = {
                'award' : chunk.querySelector('.award').value,
                'text' : chunk.querySelector('textarea').value.split('\n')
            }

            entryPartsData.push(newChunkObj)
        })


        console.log(entryBookData, entryPartsData)
        addBookWithParts(entryBookData, entryPartsData)
    }
}

function addChunk() {
    const newChunk = chunkTemplate.content.cloneNode(true);
    newChunk.querySelector('.del-chunk').addEventListener("click", (e) => {
        e.target.parentNode.parentNode.remove()

        const chunkArr = Array.from(chunkArea.children)
        
        if (chunkArr.length < 2) {
            const thisButton = document.querySelector('.del-chunk')
            thisButton.disabled = true
        }
    })

    chunkArea.append(newChunk)

    const chunkArr = Array.from(chunkArea.children)
    if (chunkArr.length > 1) {
        const allButtons = document.querySelectorAll('.del-chunk')

        allButtons.forEach(button => {
            button.disabled = false
        })
    }
}

addChunk()