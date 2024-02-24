function handleStart() {
    document.getElementById('start-container').dataset.hidden = true;
    updateScore(0);
    start();
};

function updateScore(score) {
    document.getElementById('score').innerText = score;
};

function initInterface() {
    document.getElementById('start').addEventListener('click', handleStart);
};

initInterface();