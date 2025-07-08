// import { fillMaxFontSize } from './js/resize-text.js'

export function fillMaxFontSize(elem, word, margin, min) {
    
    const parentLimits = elem.getBoundingClientRect();

    let changeFS = 1;

    if (min) {
        changeFS = min;
    }

    const childDiv = document.createElement('div');
    childDiv.innerText = word;
    childDiv.style.margin = 'auto';
    childDiv.style.fontSize = changeFS + "pt";

    elem.innerHTML = '';
    elem.append(childDiv);

    // linear method 
    // only creates one line of text
    // TODO: figure out how to optimize line breaks

    while (
        childDiv.getBoundingClientRect().width < parentLimits.width - (margin * 2)
        && childDiv.getBoundingClientRect().height < parentLimits.height
    ) {
        changeFS++
        childDiv.style.fontSize = changeFS + "pt"
    }

    changeFS--
    childDiv.style.fontSize = changeFS + "pt"

    // const newDimensions = childDiv.getBoundingClientRect()
}

window.addEventListener('resize', (event) => {
    resizeLimitedTexts()
})

export function resizeLimitedTexts() {
    const allResize = document.querySelectorAll('.resize-txt');

    allResize.forEach(elem => {
        if (elem.children[0]) {
            const inTxt = elem.children[0].innerText;
            fillMaxFontSize(elem, inTxt, 15);
        }
    })
}

resizeLimitedTexts()