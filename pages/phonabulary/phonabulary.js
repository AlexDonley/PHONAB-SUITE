const menuToggle = document.getElementById('menuToggle');
const abcGrid = document.getElementById('abcGrid');
const drillGrid = document.getElementById('drillGrid');
const abcDrillToggle = document.getElementById('abcDrillToggle');
// const menuLeftAbcs = document.getElementById('menuLeftAbcs');
// const menuRightPhonics = document.getElementById('menuRightPhonics');

const abcArr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const drillOpts = ['Animals', 'Misc', 'Action', 'Upper', 'Lower', 'ASL']

populateCheckboxes(abcArr, abcGrid)
populateCheckboxes(drillOpts, drillGrid)

menuToggle.addEventListener('click', (e) => {
    parseToggle(e)
});
abcDrillToggle.addEventListener('click', (e) => {
    parseToggle(e)
});

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