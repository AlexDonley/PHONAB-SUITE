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

const abcArr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const drillOpts = ['Upper', 'Lower', 'ASL', 'Animal', 'Misc', 'Action']
const queueOpts = ['Shuffle', 'Hide']

let defaultAbcs = {}
let defaultCards = {}

getAbcDefaults()
getCardDefaults()

populateCheckboxes(abcArr, abcGrid)
populateCheckboxes(drillOpts, drillGrid)
populateCheckboxes(queueOpts, queueSettings)

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
        console.log(defaultAbcs['a'])
    })
    .catch(error => console.log(error))
}

function getCardDefaults() {
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

    // Helper function to re-render separator arrows dynamically
    function updateArrows() {
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

    // Create draggable boxes
    arr.forEach((word) => {
    const item = document.createElement('div');
    item.className = 'drag-item';
    item.textContent = word;
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
        updateArrows();
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

        updateArrows();
    });

    containerElem.appendChild(item);
    });

    // Initial arrow layout
    updateArrows();
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
                    switch(checked.value) {
                        case 'upper':
                            finalQueue.push(letter.toUpperCase())
                            break;
                        case 'lower':
                            finalQueue.push(letter.toLowerCase())
                            break;
                        case 'asl':
                            break;
                        default:
                            let defaultWord = defaultAbcs[letter][checked.value]
                            finalQueue.push(defaultWord)
                    }
                })
            })

        }
    }

    return finalQueue
}