const inputText = document.getElementById('inputText');
const displayBox = document.getElementById('displayBox');

const matchSelect = document.getElementById('match-select');

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

var matchPrompt = "capital"; // can be "audio", "picture", "action", or "capital"

var currentQueue = [];

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
                        matchQueue = createMatchQueue(currentQueue, 10);
                        console.log("New match queue created: ", matchQueue);

                        nextInQueue(matchQueue[0].toLowerCase());
                    }

                    if(processedData.value.toLowerCase() === matchQueue[0].toLowerCase()) {
                        console.log("Correct match for: ", processedData.value);

                        teamScores[processedData.team] += 1;
                        document.getElementById(`score${processedData.team === "red" ? 1 : 2}`).textContent = teamScores[processedData.team];
                        
                        matchQueue.shift();
                        if (matchQueue.length > 0) {
                            nextInQueue(matchQueue[0].toLowerCase());
                        }
                    }

                }
            }
    }, 10);

});

function nextInQueue(char) {
    console.log(matchPrompt);
    
    switch (matchPrompt) {
        case "audio":
            // play audio for char
            break;
        case "picture":
            imgToDisplay(char);
            break;
        case "action":
            imgToDisplay(char, 'Action');
            break;
        case "capital":
            displayBox.innerHTML = char.toUpperCase();
            break;
    }   
}

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

function imgToDisplay(char, type) {
    displayBox.innerHTML = "";
    var newImg = document.createElement('img');

    console.log("Displaying image for char: ", char, " with type: ", type);

    if (type) {
        newImg.src = iconPriority(abcImgs[abcLets[char][type]]);
    } else {
        let typesArr = ["Animal", "Misc", "Action"];
        let randomType = typesArr[Math.floor(Math.random() * typesArr.length)];

        newImg.src = iconPriority(abcImgs[abcLets[char][randomType]]);
    }

    displayBox.appendChild(newImg);
}


document.addEventListener('DOMContentLoaded', () => {
            
            // --- STATE MANAGEMENT ---
            const state = {
                letters: new Set(['A', 'B', 'C', 'D', 'E']), // Default selected letters
                mode: 'display',           // 'display' | 'game'
                input: 'single',           // 'single' | 'multi'
                triggerMode: 'auto',       // 'auto' | 'timed'
                displayPrompt: 'audio'      // 'audio' | 'picture' | 'action' | 'capital'
            };

            const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const VOWELS = ['A', 'E', 'I', 'O', 'U'];

            // --- DOM ELEMENTS ---
            const overlay = document.getElementById('modal-overlay');
            const openModalBtn = document.getElementById('open-modal-btn');
            const closeModalX = document.getElementById('close-modal-x');
            const alphabetGrid = document.getElementById('alphabet-grid');
            const gameOptionsContainer = document.getElementById('game-options-container');
            const btnStart = document.getElementById('btn-start');
            const letterErrorMsg = document.getElementById('letter-error-msg');
            
            const jsonOutput = document.getElementById('json-output');
            const outputPlaceholder = document.getElementById('output-placeholder');
            const timestampBadge = document.getElementById('timestamp-badge');

            // --- 1. RENDER ALPHABET GRID ---
            function renderAlphabetGrid() {
                alphabetGrid.innerHTML = '';
                ALPHABET.forEach(letter => {
                    const isSelected = state.letters.has(letter);
                    const tile = document.createElement('button');
                    tile.type = 'button';
                    tile.dataset.letter = letter;
                    tile.className = `letter-tile aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center relative border transition-all ${
                        isSelected 
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-brand-500 hover:bg-slate-50'
                    }`;

                    tile.innerHTML = `
                        <span>${letter}</span>
                        ${isSelected ? '<i class="fa-solid fa-check text-[10px] absolute top-1 right-1 opacity-80"></i>' : ''}
                    `;

                    tile.addEventListener('click', () => toggleLetter(letter));
                    alphabetGrid.appendChild(tile);
                });
            }

            function toggleLetter(letter) {
                if (state.letters.has(letter)) {
                    state.letters.delete(letter);
                } else {
                    state.letters.add(letter);
                }
                letterErrorMsg.classList.add('hidden');
                renderAlphabetGrid();
            }

            // Quick select handlers
            document.getElementById('btn-select-all').addEventListener('click', () => {
                ALPHABET.forEach(l => state.letters.add(l));
                letterErrorMsg.classList.add('hidden');
                renderAlphabetGrid();
            });

            document.getElementById('btn-select-none').addEventListener('click', () => {
                state.letters.clear();
                renderAlphabetGrid();
            });

            document.getElementById('btn-select-vowels').addEventListener('click', () => {
                state.letters.clear();
                VOWELS.forEach(v => state.letters.add(v));
                letterErrorMsg.classList.add('hidden');
                renderAlphabetGrid();
            });

            // --- 2. SEGMENTED CONTROL SWITCH LOGIC ---
            function setupSegmentedControl(containerId, sliderId, initialValue, onChange) {
                const container = document.getElementById(containerId);
                const slider = document.getElementById(sliderId);
                const options = container.querySelectorAll('.segmented-option');

                function updateUI(value) {
                    options.forEach((opt, index) => {
                        const matches = opt.dataset.value === value;
                        if (matches) {
                            opt.classList.add('text-slate-900');
                            opt.classList.remove('text-slate-500');
                            // Move slider
                            slider.style.width = `${100 / options.length}%`;
                            slider.style.transform = `translateX(${index * 100}%)`;
                        } else {
                            opt.classList.remove('text-slate-900');
                            opt.classList.add('text-slate-500');
                        }
                    });
                }

                options.forEach(opt => {
                    opt.addEventListener('click', () => {
                        const val = opt.dataset.value;
                        updateUI(val);
                        onChange(val);
                    });
                });

                // Initial positioning
                updateUI(initialValue);
            }

            // Initialize Mode Switch
            setupSegmentedControl('mode-segmented', 'mode-slider', state.mode, (val) => {
                state.mode = val;
                if (val === 'game') {
                    gameOptionsContainer.classList.add('open');
                } else {
                    gameOptionsContainer.classList.remove('open');
                }
            });

            // Initialize Input Switch
            setupSegmentedControl('input-segmented', 'input-slider', state.input, (val) => {
                state.input = val;
            });

            // Initialize Trigger Mode Switch
            setupSegmentedControl('trigger-segmented', 'trigger-slider', state.triggerMode, (val) => {
                state.triggerMode = val;
            });

            // Dropdown prompt handler
            const displayPromptSelect = document.getElementById('display-prompt-select');
            displayPromptSelect.value = state.displayPrompt;
            displayPromptSelect.addEventListener('change', (e) => {
                state.displayPrompt = e.target.value;
            });


            // --- 3. MODAL CONTROLS & SUBMIT HANDLER ---
            function openModal() {
                overlay.classList.remove('hidden', 'modal-hidden');
                document.body.style.overflow = 'hidden'; // Block background scroll
            }

            function closeModal() {
                overlay.classList.add('modal-hidden');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }, 200);
            }

            // openModalBtn.addEventListener('click', openModal);
            closeModalX.addEventListener('click', closeModal);

            // Close on overlay backdrop click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal();
                }
            });

            // Start Button Click Handler
            btnStart.addEventListener('click', () => {
                // Validation: At least 1 letter selected
                if (state.letters.size === 0) {
                    letterErrorMsg.classList.remove('hidden');
                    return;
                }

                // Construct Result Object
                const resultObject = {
                    letters: Array.from(state.letters).sort(),
                    mode: state.mode,
                    input: state.input
                };

                // Append conditional properties if mode === 'game'
                if (state.mode === 'game') {
                    resultObject.triggerMode = state.triggerMode;
                    resultObject.displayPrompt = state.displayPrompt;
                }

                // Log output to browser console
                console.log('Menu Submitted Object:', resultObject);
                currentQueue = resultObject.letters;
                matchPrompt = matchSelect.value;
                console.log (matchPrompt);

                // Render JSON to code block on website
                // outputPlaceholder.classList.add('hidden');
                // jsonOutput.classList.remove('hidden');
                // jsonOutput.textContent = JSON.stringify(resultObject, null, 2);
                //timestampBadge.textContent = `Updated: ${new Date().toLocaleTimeString()}`;

                // Close Modal
                closeModal();
            });

            // --- INITIAL RENDER ---
            renderAlphabetGrid();
});




tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            colors: {
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                }
            }
        }
    }
}