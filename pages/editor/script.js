import { 
    addSourceWithParts, getSourceParts,
    getFilteredSources, getPartById,
    updateSourceWithParts
} from '../../js_modules/supabase-crud.js'

const modeText = document.querySelector('.mode-text');

const addMercyBtn   = document.querySelector('#addMercyBtn');

const resetSourcBtn = document.querySelector('#resetSourceBtn');
const saveSourceBtn   = document.querySelector('#saveSourceBtn');
const updateSourceBtn = document.querySelector('#updateSourceBtn');
const deleteSourceBtn = document.querySelector('#deleteSourceBtn');

const addPartBtn   = document.querySelector('#addPartBtn');
const mercyLines    = document.querySelector('.mercy-lines');

const createTitle       = document.querySelector('#createTitle');
const createAuthor      = document.querySelector('#createAuthor');
const langSelect         = document.querySelector('.lang-select');
const partArea         = document.querySelector('#partArea');
const partTemplate     = document.querySelector('#partTemplate');

const searchBtn = document.querySelector('#searchBtn'); 
const searchSource = document.querySelector('#searchSource');
const searchResults = document.querySelector('#searchResults');

searchBtn.addEventListener("click", searchWrap);
addMercyBtn.addEventListener("click", addMercyLine);
resetSourcBtn.addEventListener("click", resetPage);
saveSourceBtn.addEventListener("click", trySaveSource);
updateSourceBtn.addEventListener("click", tryUpdateSource);
addPartBtn.addEventListener("click", addPart);

function addMercyLine() {
    const newLine = mercyTemplate.content.cloneNode(true);

    newLine.querySelector('.del-mercy-line').addEventListener("click", (e) => {
        e.target.parentNode.remove()
    })
    
    mercyLines.append(newLine);
}

function trySaveSource() {

    let noNullCheck = true;

    const theseParts = document.querySelectorAll('.part-div');
    theseParts.forEach(part => {
        if (part.querySelector('textarea').value == '') {
            noNullCheck = false;
        }
    })

    if (createTitle.value == '' || noNullCheck == false) {
        alert('Fill in all blanks before attempting to save!')
    } else {

        const [newSourceData, newPartsData] = pullDatafromElems();

        console.log(newSourceData, newPartsData);
        addSourceWithParts(newSourceData, newPartsData);
    }
}

// TO DO
// Allow for adding / deleting fragments of parts with updates
// Link sources to User UUID
// Allow for deleting sources and accompanying parts, glosses, etc.
// Allow for gloss editing and saving
// Emoji grid popout menu

function tryUpdateSource() {
    let newData = pullDatafromElems();

    if (newData.length == 3) {
        updateSourceWithParts(newData[0], newData[1], newData[2]);
    }
}

function pullDatafromElems() {
    let mercyDict = {};

    // prepare mercy words dictionary
    const mercyLines = document.querySelectorAll('.mercy-line');
    mercyLines.forEach(line => {
        const word = line.querySelector('.mercy-input').value;
        const substituteElems = line.querySelectorAll('.mercy-substitute');
        const subArr = substituteElems[0].value.split(',').map(item => item.trim()).filter(item => item !== '');

        mercyDict[word] = subArr;
    })

    // prepare source data from all on-page elements
    const entrySourceData = {
        'title' : createTitle.value,
        'author' : createAuthor.value || 'guest',
        'lang' : langSelect.value,
        'mercy_words' : mercyDict
    }
    
    // prepare parts data
    let entryPartsData = []
    const theseParts = document.querySelectorAll('.part-div')

    theseParts.forEach ((part, i) => {
        const newPartObj = {
            'award' : part.querySelector('.award').value,
            'text' : part.querySelector('textarea').value.split('\n'),
            'idx' : i,
            'id' : part.dataset.partId || null
        }

        entryPartsData.push(newPartObj)
    })

    const updateCheck = createTitle.dataset.sourceId || null;
    if (updateCheck) {
        return [updateCheck, entrySourceData, entryPartsData]
    } else {
        return [entrySourceData, entryPartsData]
    }
}

function addPart() {
    const newPart = partTemplate.content.cloneNode(true);
    newPart.querySelector('.del-part').addEventListener("click", (e) => {
        e.target.parentNode.parentNode.remove()

        const partArr = Array.from(partArea.children)
        
        if (partArr.length < 2) {
            const thisButton = document.querySelector('.del-part')
            thisButton.disabled = true
        }
    })

    partArea.append(newPart)

    // check and enable or disable delete buttons
    const partArr = Array.from(partArea.children)
    if (partArr.length > 1) {
        const allButtons = document.querySelectorAll('.del-part')

        allButtons.forEach(button => {
            button.disabled = false
        })
    }

    return newPart
}

addPart()

async function searchWrap() {
    let searchSources = await getFilteredSources({
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
                pushDataToElems(source)
            })
            searchResults.append(sourceDiv)
        }) 
    }
}

async function pushDataToElems(source) {

    resetPage();

    // load title and author
    createTitle.value = source.title;
    createTitle.dataset.sourceId = source.id;

    createAuthor.value = source.author;
    langSelect.value = source.lang;
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
            addPart();
        }

        const thisPart = partArea.children[i];
        thisPart.dataset.partId = part.id;        

        const thisTextArea = thisPart.querySelector('textarea');
        const thisAward = thisPart.querySelector('.award');

        thisTextArea.value = part.text.join('\n');
        thisAward.value = part.award || '';
    });
}

function resetPage() {
    createTitle.value = '';
    createTitle.dataset.sourceId = '';

    createAuthor.value = '';
    langSelect.value = 'en';
    mercyLines.innerHTML = '';
    partArea.innerHTML = '';
    addPart();
    modeText.innerText = 'New';
}