const menuToggle = document.getElementById('menuToggle');
const abcGrid = document.getElementById('abcGrid');
const drillGrid = document.getElementById('drillGrid');
const abcDrillToggle = document.getElementById('abcDrillToggle');
const queueDiv = document.getElementById('queueDiv')
const queueSettings = document.getElementById('queueSettings');

const addToQueueBtn = document.getElementById('addToQueueBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const startQueueBtn = document.getElementById('startQueueBtn');
// const menuLeftAbcs = document.getElementById('menuLeftAbcs');
// const menuRightPhonics = document.getElementById('menuRightPhonics');

let defaultAbcs = {}
let defaultCards = {}

getAbcDefaults()
getCardDefaults()

const abcArr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const drillOpts = ['Upper', 'Lower', 'ASL', 'Animal', 'Misc', 'Action', 'Default']
const queueOpts = ['Shuffle', 'Hide']

populateCheckboxes(abcArr, abcGrid)
populateCheckboxes(drillOpts, drillGrid)
populateCheckboxes(queueOpts, queueSettings)

document.getElementById('shuffleCheck').addEventListener('click', toggleShuffle)

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
            console.log("Fetched default cards.")
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

function applyQueue() {
    
    images = []

    const cardDivs = queueDiv.querySelectorAll('div')

    cardDivs.forEach((div, i) => {
        if (div.dataset.imgUrl) {
            const img = new Image();
            img.src = div.dataset.imgUrl;
            img.onload = () => { if (i === currentIndex) renderCard(); };
            images.push(img);
        }
    })
}


// CANVAS FUNCTIONS

// 1. Array of Image Links
const IMAGE_URLS = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1600&q=80"
];

// State
let currentIndex = 0;
let images = [];
const overlay = document.getElementById('flashcardOverlay');
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
const finishModal = document.getElementById('finishModal');

// UI Controls
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counterText = document.getElementById('counterText');
const progressBar = document.getElementById('progressBar');
const fsIcon = document.getElementById('fsIcon');

// Preload Images
IMAGE_URLS.forEach((url, i) => {
    const img = new Image();
    img.src = url;
    img.onload = () => { if (i === currentIndex) renderCard(); };
    images.push(img);
});

// Resize Handling
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    renderCard();
}
window.addEventListener('resize', resizeCanvas);

// Render Current Image Fitted to Canvas Background
function renderCard() {
    if (!overlay.classList.contains('active')) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    const img = images[currentIndex];
    if (img && img.complete && img.naturalWidth !== 0) {
    // Compute "contain" aspect ratio scaling
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawW, drawH, drawX, drawY;

    if (imgRatio > canvasRatio) {
        drawW = width;
        drawH = width / imgRatio;
    } else {
        drawH = height;
        drawW = height * imgRatio;
    }

    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
    // Loading Fallback Spinner
    ctx.fillStyle = '#6366f1';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading Image...', width / 2, height / 2);
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
    renderCard();
    } else {
    finishModal.classList.remove('hidden');
    }
}

function prevCard() {
    if (finishModal.classList.contains('hidden') && currentIndex > 0) {
    currentIndex--;
    renderCard();
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
    resizeCanvas();
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