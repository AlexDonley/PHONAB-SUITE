import { 
    addSourceWithParts, getSourceParts,
    getFilteredSources, getPartById,
    fetchWithCache
} from '../../js_modules/supabase-crud.js'

const modeText = document.querySelector('.mode-text');

const addMercyBtn   = document.querySelector('#addMercyBtn');
const saveSourceBtn   = document.querySelector('#saveSourceBtn');
const addChunkBtn   = document.querySelector('#addChunkBtn');
const mercyLines    = document.querySelector('.mercy-lines');

const createTitle       = document.querySelector('#createTitle');
const createAuthor      = document.querySelector('#createAuthor');
const chunkArea         = document.querySelector('#chunkArea');
const chunkTemplate     = document.querySelector('#chunkTemplate');

const searchBtn = document.querySelector('#searchBtn'); 
const searchSource = document.querySelector('#searchSource');
const searchResults = document.querySelector('#searchResults');

searchBtn.addEventListener("click", searchWrap);
addMercyBtn.addEventListener("click", addMercyLine)
saveSourceBtn.addEventListener("click", trySaveSource)
addChunkBtn.addEventListener("click", addChunk);

function addMercyLine() {
    const newLine = mercyTemplate.content.cloneNode(true);
    console.log(newLine, mercyLines)
    mercyLines.append(newLine);
}

function trySaveSource() {

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

        const [newSourceData, newPartsData] = scrapeElemsForData();

        console.log(newSourceData, newPartsData)
        addSourceWithParts(newSourceData, newPartsData)
    }
}

function scrapeElemsForData() {
    let mercyDict = {}

    const mercyLines = document.querySelectorAll('.mercy-line');
    mercyLines.forEach(line => {
        const word = line.querySelector('.mercy-input').value;
        const substituteElems = line.querySelectorAll('.mercy-substitute');
        const subArr = substituteElems[0].value.split(',').map(item => item.trim()).filter(item => item !== '');

        mercyDict[word] = subArr;
    })

    const entrySourceData = {
        'title' : createTitle.value,
        'author' : createAuthor.value || 'guest',
        'lang' : 'en',
        'mercy_words' : mercyDict
    }
    let entryPartsData = []

    theseChunks.forEach ((chunk, i) => {
        const newChunkObj = {
            'award' : chunk.querySelector('.award').value,
            'text' : chunk.querySelector('textarea').value.split('\n'),
            'idx' : i
        }

        entryPartsData.push(newChunkObj)
    })

    return [entrySourceData, entryPartsData]
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

    // check and enable or disable delete buttons
    const chunkArr = Array.from(chunkArea.children)
    if (chunkArr.length > 1) {
        const allButtons = document.querySelectorAll('.del-chunk')

        allButtons.forEach(button => {
            button.disabled = false
        })
    }

    return newChunk
}

addChunk()

async function searchWrap() {
    let searchSources = await getFilteredSources({
        'lang': 'en', 
        'searchTerm': searchSource.value,
        'limit': 40
    })

    console.log(searchSources)

    if (searchSources.length > 0) {

        searchResults.innerHTML = ''

        searchSources.forEach(source => {
            const sourceDiv = document.createElement('button')
            sourceDiv.classList.add('source-result')
            sourceDiv.innerHTML = `
                <h3>${source.title}</h3>
                <p>Author: ${source.author}</p>
                <p>Language: ${source.lang}</p>
            `

            sourceDiv.addEventListener("click", () => {
                loadPartsToUpdate(source)
            })
            searchResults.append(sourceDiv)
        }) 
    }
}

async function loadPartsToUpdate(source) {

    // load title and author
    createTitle.value = source.title;
    createAuthor.value = source.author;
    modeText.innerText = 'Update: ' + source.id;

    // load mercy words
    const thisMercy = source.mercy_words;
    const mercyKeys = Object.keys(thisMercy);

    mercyKeys.forEach(key => {

        const newLine = mercyTemplate.content.cloneNode(true);
        newLine.querySelector('.mercy-input').value = key;
        newLine.querySelector('.mercy-substitute').value = thisMercy[key].join(', ');
        mercyLines.append(newLine);
    })
    

    // load parts
    const parts = await getSourceParts(source.id);
    console.log(parts);

    parts.forEach((part, i) => {

        if (i > 0) {
            addChunk();
        }

        const thisChunk = chunkArea.children[i];
        thisChunk.dataset.partId = part.id;        

        console.log(thisChunk);

        const thisTextArea = thisChunk.querySelector('textarea');
        const thisAward = thisChunk.querySelector('.award');

        thisTextArea.value = part.text.join('\n');
        thisAward.value = part.award || '';
    });
}