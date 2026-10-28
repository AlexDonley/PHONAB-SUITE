const menuToggle = document.getElementById('menuToggle');
const abcGrid = document.getElementById('abcGrid');
const drillGrid = document.getElementById('drillGrid');
const abcDrillToggle = document.getElementById('abcDrillToggle');
const queueDiv = document.getElementById('queueDiv')
const queueSettings = document.getElementById('queueSettings');

const addToQueueBtn = document.getElementById('addToQueueBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const startQueueBtn = document.getElementById('startQueueBtn');

let defaultAbcs = {};
let defaultCards = {};

getAbcDefaults();
getCardDefaults();

const abcArr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const drillOpts = ['Upper', 'Lower', 'ASL', 'Animal', 'Misc', 'Action', 'Default'];
const queueOpts = ['Shuffle', 'Hide'];

populateCheckboxes(abcArr, abcGrid);
populateCheckboxes(drillOpts, drillGrid);
populateCheckboxes(queueOpts, queueSettings);

document.getElementById('shuffleCheck').addEventListener('click', toggleShuffle);

menuToggle.addEventListener('click', (e) => {
    parseToggle(e)
});
abcDrillToggle.addEventListener('click', (e) => {
    parseToggle(e)
});
addToQueueBtn.addEventListener('click', pushQueue)
clearQueueBtn.addEventListener('click', clearQueue)


function getAbcDefaults() {
    fetch('../../data/abc_let.json')
    .then(res => {
        if (res.ok) {
            console.log("Fetched default ABC words.")
        } else {
            console.log("Couldn't fetch default cards.")
        }
        return res.json()
    })
    .then(data => {
        defaultAbcs = data
    })
    .catch(error => console.log(error))
}

function getCardDefaults() {
    fetch('../../data/abc_img.json')
    .then(res => {
        if (res.ok) {
            console.log("Fetched default cards.")
        } else {
            console.log("Couldn't fetch default cards.")
        }
        return res.json()
    })
    .then(data => {
        defaultCards = data
    })
    .catch(error => console.log(error))
}

function parseToggle(e) {
    
    const toggleParent = e.currentTarget

    const labelArr = toggleParent.querySelectorAll('.toggle-label')
    const labelLeft = labelArr[0]
    const labelRight = labelArr[1]
    const elemLeft = document.getElementById(labelLeft.dataset.toggle)
    const elemRight = document.getElementById(labelRight.dataset.toggle)

    // Toggle the 'right' class on the container to slide the pill
    const isRight = toggleParent.classList.toggle('right');

    if (isRight) {
        // Switch active text colors
        labelLeft.classList.remove('active');
        labelRight.classList.add('active');

        // Swap menu visibility
        elemLeft.classList.remove('active');
        elemRight.classList.add('active');
    } else {
        // Switch active text colors back
        labelRight.classList.remove('active');
        labelLeft.classList.add('active');

        // Swap menu visibility back
        elemRight.classList.remove('active');
        elemLeft.classList.add('active');
    }
}

function constructCheckbox(text, value) {
    const newLabel = document.createElement('label');
    newLabel.classList.add('custom-checkbox');

    const newCheck = document.createElement('input');
    newCheck.type = 'checkbox';
    newCheck.value = value;
    newCheck.id = value + "Check"

    const newSpan = document.createElement('span');
    newSpan.classList.add('box-label')
    newSpan.innerText = text

    newLabel.append(newCheck);
    newLabel.append(newSpan);

    return newLabel
}

function populateCheckboxes(arr, containerElem) {
    arr.forEach(item => {
        const newCheckbox = constructCheckbox(item, item.toLowerCase())
        containerElem.append(newCheckbox)
    })
}

function populateDragList(arr, containerElem) {

    // Make container a dragover target
    // containerElem.classList.add('drag-container')
    containerElem.addEventListener('dragover', (e) => e.preventDefault());

    // Create draggable boxes
    arr.forEach((dict) => {
        const item = document.createElement('div');
        item.className = 'drag-item';
        item.textContent = dict.text;
        item.dataset.cardType = dict.type;
        item.dataset.defaultIdx = containerElem.querySelectorAll('div').length

        if (dict.type == 'img') {
            const thisUrl = defaultCards[dict.text]['unsplash'];
            item.dataset.imgUrl = thisUrl;
        }

        item.draggable = true;

        // --- Drag & Drop Event Listeners ---
        item.addEventListener('dragstart', (e) => {
            item.classList.add('dragging');
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            // Clear all drop target highlights
            containerElem.querySelectorAll('.drag-item').forEach(el => el.classList.remove('drag-over'));
            // Re-calculate arrows in case order changed
            updateArrows(containerElem);
        });

        item.addEventListener('dragenter', (e) => {
            e.preventDefault();
            const draggingItem = containerElem.querySelector('.dragging');
            if (draggingItem && draggingItem !== item) {
            item.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');

            const draggingItem = containerElem.querySelector('.dragging');
            if (!draggingItem || draggingItem === item) return;

            // Determine whether to place before or after based on mouse cursor position
            const rect = item.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;

            if (e.clientX < midpoint) {
            containerElem.insertBefore(draggingItem, item);
            } else {
            containerElem.insertBefore(draggingItem, item.nextSibling);
            }

            updateArrows(containerElem);
        });

        containerElem.appendChild(item);
    });

    // Initial arrow layout
    updateArrows(containerElem);
}

// Helper function to re-render separator arrows dynamically
function updateArrows(containerElem) {
    // Remove existing arrows
    containerElem.querySelectorAll('.drag-arrow').forEach(arrow => arrow.remove());

    // Get current draggable items in order
    const items = Array.from(containerElem.querySelectorAll('.drag-item'));
    
    items.forEach((item, index) => {
        // Insert arrow after every item except the last one
        if (index < items.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'drag-arrow';
        arrow.textContent = '→';
        item.after(arrow);
        }
    });
}

function clearQueue() {
    // Clear existing contents
    queueDiv.innerHTML = '';
}

function pushQueue() {
    let currentQueue = gatherQueue();
    populateDragList(currentQueue, queueDiv);
}

function gatherQueue() {
    
    let finalQueue = []
    const checkedAbcs = abcGrid.querySelectorAll('input[type="checkbox"]:checked')
    const checkedDrills = drillGrid.querySelectorAll('input[type="checkbox"]:checked')

    if (checkedAbcs) {
        
        let midQueue = []
        checkedAbcs.forEach(checked => {
            midQueue.push(checked.value)
        })

        if (checkedDrills) {
            midQueue.forEach(letter => {
                checkedDrills.forEach(checked => {

                    let thisDict = {}

                    switch(checked.value) {
                        case 'upper':
                            thisDict.text = letter.toUpperCase()
                            thisDict.type = 'text'
                            break;
                        case 'lower':
                            thisDict.text = letter.toLowerCase()
                            thisDict.type = 'text'
                            break;
                        case 'asl':
                            break;
                        case 'default':
                            thisDict.text = defaultAbcs[letter][defaultAbcs[letter][checked.value]]
                            thisDict.type = 'img'
                            break;
                        default:
                            thisDict.text = defaultAbcs[letter][checked.value]
                            thisDict.type = 'img'
                    }

                    finalQueue.push(thisDict)
                })
            })

        }
    }

    return finalQueue
}

function toggleShuffle() {

    let container = queueDiv

    // Get all direct child div elements with the data-default-idx attribute
    const divs = Array.from(container.querySelectorAll(':scope > div'));
    
    // Check the current state from the container's dataset
    const isShuffled = container.dataset.shuffled === 'true';

    if (!isShuffled) {
        // --- SHUFFLE ---
        // Randomize the array of divs using Math.random()
        const shuffledDivs = [...divs].sort(() => Math.random() - 0.5);
        
        // Re-append them in the new shuffled order
        shuffledDivs.forEach(div => container.appendChild(div));
        
        // Update state flag
        container.dataset.shuffled = 'true';
    } else {
        // --- UNSHUFFLE ---
        // Sort divs back based on their data-default-idx value
        const sortedDivs = [...divs].sort((a, b) => {
            const indexA = parseInt(a.dataset.defaultIdx, 10);
            const indexB = parseInt(b.dataset.defaultIdx, 10);
            return indexA - indexB;
        });
        
        // Re-append them in their original order
        sortedDivs.forEach(div => container.appendChild(div));
        
        // Update state flag
        container.dataset.shuffled = 'false';
    }

    updateArrows(container)
}

let cardDicts = []

function applyQueue() {
    
    cardDicts = []
    const cardDivs = queueDiv.querySelectorAll('div')

    cardDivs.forEach((div, i) => {
        let thisDict = {
            "text": div.innerText,
            "types": [div.dataset.cardType],
            "img": buildImageElem(div.dataset.imgUrl, i),
            "fx": {},
            "configs": {
                "size": "fill"
            }
        }

        cardDicts.push(thisDict)
    })
}

function buildImageElem(url, i) {
    
    const img = loadImage(url, () => {
        // This callback triggers once the image has successfully loaded
        if (i === currentIndex) {
            renderCardToBuffer(pg);
        }
    });

    return img
}




// P5 inclusion

let spriteShader;
let pg;

function preload() {
    // Load your single pair of unified shaders
    spriteShader = loadShader(
        '../../shaders/canv.vert', 
        '../../shaders/canv.frag'
    );
}

function setup() {
    const myCanvasElement = document.getElementById('cardCanvas');
    createCanvas(windowWidth, windowHeight, WEBGL, myCanvasElement);
    pg = createGraphics(windowWidth, windowHeight);
}

function draw() {
    
    background(0);

    // 1. Render your flashcard (images, text, borders) to the offscreen buffer
    renderCardToBuffer(pg);

    // 2. Activate the uber-shader
    shader(spriteShader);
    spriteShader.setUniform('tex', pg);

    // 3. Set your visual effects dynamically (e.g., mapped to mouse or flashcard states)
    if (false) {
        spriteShader.setUniform('uPixelate', 10.0);
    } else {
        spriteShader.setUniform('uPixelate', 0.0);
    }
    
    // spriteShader.setUniform('uFisheye', 1.2);    // Bulge effect
    
    if (false) {
        spriteShader.setUniform('uSwirl', 3.0 * sin(millis() / 1000));
    } else {
        spriteShader.setUniform('uSwirl', 0.0);
    }

    if (false) {
        spriteShader.setUniform('uWave', 3.0 * millis() / 1000);
    } else {
        spriteShader.setUniform('uWave', 0.0);
    }

    if (false) {
        spriteShader.setUniform('uTunnel', 0.5);
    } else {
        spriteShader.setUniform('uTunnel', 0.0);
    }

    if (false) {
        spriteShader.setUniform('uMirror', 1.0 + sin(millis()/1000));
    } else {
        spriteShader.setUniform('uMirror', 0.0);
    }

    spriteShader.setUniform('uAlpha', 1.0);      // Opacity / Ghost effect

    // 4. Draw the full-screen quad to render the effect
    rect(-width/2, -height/2, width, height);
}

function windowResized() {
    // Keep everything responsive when the window changes size
    resizeCanvas(windowWidth, windowHeight);
    pg.resizeCanvas(windowWidth, windowHeight);
}

// CANVAS FUNCTIONS

// State
let currentIndex = 0;
let images = {};
const overlay = document.getElementById('flashcardOverlay');
// const canvas = document.getElementById('cardCanvas');
// const ctx = canvas.getContext('2d');
const finishModal = document.getElementById('finishModal');

// UI Controls
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counterText = document.getElementById('counterText');
const progressBar = document.getElementById('progressBar');
const fsIcon = document.getElementById('fsIcon');

// Render Current Image Fitted to Canvas Background
function renderCardToBuffer(ctx) {
    if (!overlay.classList.contains('active')) return;

    const width = ctx.width;
    const height = ctx.height;

    //ctx.clearRect(0, 0, width, height);
    ctx.background(0)

    const dict = cardDicts[currentIndex]

    if (dict.types.includes("img")) {
        const img = dict['img']

        if (img && img.width > 1 && img.height > 1) {
            // console.log(img.width, img.height)
            // Compute "contain" aspect ratio scaling
            const imgRatio = img.width / img.height;
            const canvasRatio = width / height;

            let drawW, drawH, drawX, drawY;

            // if (dict.config.size == "fit") {
            //     // for image fit
            //     if (imgRatio > canvasRatio) {
            //         drawW = width;
            //         drawH = width / imgRatio;
            //     } else {
            //         drawH = height;
            //         drawW = height * imgRatio;
            //     }

            // } else {
                // for image fill
                if (imgRatio < canvasRatio) {
                    drawW = width;
                    drawH = width / imgRatio;
                } else {
                    drawH = height;
                    drawW = height * imgRatio;
                }
            // }

            drawX = (width - drawW) / 2;
            drawY = (height - drawH) / 2;

            ctx.push();
            ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
            ctx.scale(-1, -1); 
            ctx.image(img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.pop();
        }

        if (dict.types.includes("text")) {
            // Loading Fallback Spinner
            const textX = width / 2;
            const textY = height * 3 / 4;
            const thisText = dict.text
            
            // fill
            // ctx.fillStyle = '#FFFFFF';
            // ctx.font = '600 200px "Century Gothic", sans-serif';
            // ctx.textAlign = 'center';
            // ctx.fillText(thisText, textX, textY);

            // border
            // ctx.strokeStyle = "#000000"; // Black border color
            // ctx.lineWidth = 2;           // Border thickness
            // ctx.strokeText(thisText, textX, textY);

            ctx.push(); // Save state

            ctx.translate(0, height);
            ctx.scale(1, -1);

            ctx.fill(255);
            ctx.stroke(0);
            ctx.strokeWeight(2);
            ctx.textSize(200);

            ctx.textAlign(CENTER, CENTER);
            ctx.text(thisText, textX, textY);
            ctx.pop(); // Restore state
        }

    } else if (dict.types.includes("text")) {
        // Loading Fallback Spinner
        const textX = width / 2;
        const textY = height / 2;
        const thisText = dict.text
        
        // fill
        // ctx.fillStyle = '#FFFFFF';
        // ctx.font = '600 600px "Century Gothic", sans-serif';
        // ctx.textAlign = 'center';
        // ctx.fillText(thisText, textX, textY);

        // border
        // ctx.strokeStyle = "#000000"; // Black border color
        // ctx.lineWidth = 2;           // Border thickness
        // ctx.strokeText(thisText, textX, textY);
        
        ctx.push();

        ctx.translate(0, height);
        ctx.scale(1, -1);

        ctx.fill(255);
        ctx.noStroke();
        ctx.textSize(600);
        ctx.textAlign(CENTER, CENTER);
        ctx.text(thisText, textX, textY);
        ctx.pop();
    }

    updateUI();
}

function updateUI() {
    counterText.textContent = `${currentIndex + 1} / ${queueDiv.querySelectorAll('div').length}`;
    progressBar.style.width = `${((currentIndex + 1) / queueDiv.querySelectorAll('div').length) * 100}%`;
    prevBtn.disabled = currentIndex === 0;
}

// Navigation Logic
function nextCard() {
    if (currentIndex < queueDiv.querySelectorAll('div').length - 1) {
        currentIndex++;
        renderCardToBuffer(pg);
    } else {
        finishModal.classList.remove('hidden');
    }
}

function prevCard() {
    if (finishModal.classList.contains('hidden') && currentIndex > 0) {
        currentIndex--;
        renderCardToBuffer(pg);
    } else if (!finishModal.classList.contains('hidden')) {
        finishModal.classList.add('hidden');
    }
}

// App Control Functions
function openApp() {
    applyQueue()    
    currentIndex = 0;
    finishModal.classList.add('hidden');
    overlay.classList.add('active');
    renderCardToBuffer(pg)
    //resizeCanvas();
}

function closeApp() {
    overlay.classList.remove('active');
    if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
    overlay.requestFullscreen().catch(() => {});
    fsIcon.className = "fa-solid fa-compress";
    } else {
    document.exitFullscreen().catch(() => {});
    fsIcon.className = "fa-solid fa-expand";
    }
}

// Event Listeners
startQueueBtn.addEventListener('click', openApp);
document.getElementById('closeBtn').addEventListener('click', closeApp);
document.getElementById('modalExitBtn').addEventListener('click', closeApp);
document.getElementById('repeatBtn').addEventListener('click', openApp);
document.getElementById('prevBtn').addEventListener('click', prevCard);
document.getElementById('nextBtn').addEventListener('click', nextCard);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;

    if (e.key === 'ArrowUp') {
    prevCard();
    e.preventDefault();
    } else if (e.key === 'ArrowDown') {
    nextCard();
    e.preventDefault();
    } else if (e.key === 'Escape') {
    closeApp();
    }
});

// Global declarations to allow for modularity
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;






// VFX drag and drop element

const vfxDragAndDrop = {
    "draggables": ["pixelate", "whirl", "fisheye", "wave", "tunnel", "mirror"],
    "dropdowns": {
        "process": ["stacked", "shuffled", "sequential"],
        "interpolation": ["static", "linear", "looped"]
    }
};

/**
 * Builds and attaches the Drag and Drop VFX Configurator
 * @param {HTMLElement|string} targetContainer - DOM element or query selector string
 * @param {Object} config - Configuration object containing draggables and dropdowns
 */
function createVfxConfigurator(targetContainer, config) {
    const root = typeof targetContainer === 'string' 
    ? document.querySelector(targetContainer) 
    : targetContainer;

    root.innerHTML = ''; // Clear container

    // Main Wrapper
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'vfx-container';

    // 1. Create Top Palette (Available items)
    const palette = document.createElement('div');
    palette.className = 'vfx-palette';
    palette.id = 'vfx-palette';

    config.draggables.forEach(itemText => {
    const item = createDraggableItem(itemText);
    palette.appendChild(item);
    });

    // 2. Create Target Dropzone Box
    const dropzoneContainer = document.createElement('div');
    dropzoneContainer.className = 'vfx-dropzone-container';

    // 2a. Add Config Dropdowns to the top of the active box
    const controlsHeader = document.createElement('div');
    controlsHeader.className = 'vfx-controls-header';

    for (const [key, options] of Object.entries(config.dropdowns)) {
    const group = document.createElement('div');
    group.className = 'vfx-control-group';

    const label = document.createElement('label');
    label.innerText = key;
    label.htmlFor = `vfx-select-${key}`;

    const select = document.createElement('select');
    select.id = `vfx-select-${key}`;
    select.dataset.dropdownKey = key;

    options.forEach(optionText => {
        const opt = document.createElement('option');
        opt.value = optionText;
        opt.innerText = optionText;
        select.appendChild(opt);
    });

    group.appendChild(label);
    group.appendChild(select);
    controlsHeader.appendChild(group);
    }

    // 2b. Active Dropzone Area
    const dropzone = document.createElement('div');
    dropzone.className = 'vfx-dropzone';
    dropzone.id = 'vfx-active-dropzone';

    dropzoneContainer.appendChild(controlsHeader);
    dropzoneContainer.appendChild(dropzone);

    // Assemble UI
    mainWrapper.appendChild(palette);
    mainWrapper.appendChild(dropzoneContainer);
    root.appendChild(mainWrapper);

    // 3. Attach Drag & Drop Event Listeners
    setupDragAndDropHandlers([palette, dropzone]);
}

// Helper: Create individual draggable item node
function createDraggableItem(text) {
    const item = document.createElement('div');
    item.className = 'vfx-item';
    item.draggable = true;
    item.innerText = text;
    item.dataset.value = text;

    item.addEventListener('dragstart', (e) => {
    item.classList.add('dragging');
    e.dataTransfer.setData('text/plain', text);
    });

    item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    });

    return item;
}

// Helper: Configure dragover, dragleave, and drop events for containers
function setupDragAndDropHandlers(containers) {
    containers.forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow drop
        container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');

        const draggingElement = document.querySelector('.vfx-item.dragging');
        if (draggingElement) {
        container.appendChild(draggingElement);
        }
    });
    });
}

/**
 * Reads the current UI state to pass to a subsequent page/process
 * @returns {Object} Object containing active items and select values
 */
function getActiveVFXState() {
    const activeDropzone = document.getElementById('vfx-active-dropzone');
    const activeItems = Array.from(activeDropzone.querySelectorAll('.vfx-item'))
                            .map(item => item.dataset.value);

    const dropdowns = {};
    const selectElements = document.querySelectorAll('.vfx-controls-header select');
    selectElements.forEach(select => {
    dropdowns[select.dataset.dropdownKey] = select.value;
    });

    return {
    activeDraggables: activeItems,
    options: dropdowns
    };
}

// Initialize the component
createVfxConfigurator('#vfx-app', vfxDragAndDrop);