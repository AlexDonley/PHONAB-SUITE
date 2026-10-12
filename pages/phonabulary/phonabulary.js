const toggleContainer = document.getElementById('menuToggle');
const labelLeft = document.getElementById('labelLeft');
const labelRight = document.getElementById('labelRight');
const menuLeftContent = document.getElementById('menuLeftContent');
const menuRightContent = document.getElementById('menuRightContent');

toggleContainer.addEventListener('click', () => {
    // Toggle the 'right' class on the container to slide the pill
    const isRight = toggleContainer.classList.toggle('right');

    if (isRight) {
        // Switch active text colors
        labelLeft.classList.remove('active');
        labelRight.classList.add('active');

        // Swap menu visibility
        menuLeftContent.classList.remove('active');
        menuRightContent.classList.add('active');
    } else {
        // Switch active text colors back
        labelRight.classList.remove('active');
        labelLeft.classList.add('active');

        // Swap menu visibility back
        menuRightContent.classList.remove('active');
        menuLeftContent.classList.add('active');
    }
});