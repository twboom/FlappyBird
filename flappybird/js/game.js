// Config and constants
const CONFIG = {
    BIRD_SIZE: 10,
    BIRD_X_POS: 250,
    BIRD_GRAVITY: 1,
    BIRD_START_POS: 600,
    BIRD_JUMP_SPEED: 15,
    PIPE_WIDTH: 40,
    PIPE_GAP: 250,
    PIPE_MARGIN: 150,
    PIPE_SPEED: 5,
    PIPE_INTERVAL: 70,
    DEBUG_BIRD_MOVE: 10,
};
const SESSION = {
    SCORE: 0,
    PIPES: [],
    RUNNING: false,
    FRAMES_SINCE_LAST_PIPE: 0,
};
const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');


// Objects
class Bird {
    constructor() {
        this.pos = CONFIG.BIRD_START_POS;
        this.speed = 0;
    };

    jump() {
        this.speed = CONFIG.BIRD_JUMP_SPEED;
    };

    checkCollision() {
        let pipeCollision = false;
        let floorCollision = false;
        for (let i = 0; i < SESSION.PIPES.length; i++) {
            if (SESSION.PIPES[i].checkCollision().hit) { pipeCollision = true; break; };
        };

        if (this.pos <= 0 + CONFIG.BIRD_SIZE) { floorCollision = true; };

        return {hit: pipeCollision||floorCollision, pipe: pipeCollision, floor: floorCollision};
    };

    step() {
        this.speed -= CONFIG.BIRD_GRAVITY;
        this.pos += this.speed;
        if (this.pos <= 0 + CONFIG.BIRD_SIZE) { this.pos = 0 + CONFIG.BIRD_SIZE };
    };

    render() {
        CTX.beginPath();
        CTX.arc(CONFIG.BIRD_X_POS, CANVAS.height-this.pos, CONFIG.BIRD_SIZE, 0, 2*Math.PI);
        CTX.fill();
    };
};


class Pipe {
    constructor(position) {
        this.pos = position;
        this.height = Math.round((CANVAS.height - 2*CONFIG.PIPE_MARGIN) * Math.random()) + CONFIG.PIPE_MARGIN;
        this.upperEdge = this.height - CONFIG.PIPE_GAP/2;
        this.lowerEdge = this.height + CONFIG.PIPE_GAP/2;
        this.cleared = false;
    };

    step() {
        this.pos -= CONFIG.PIPE_SPEED;
        if (this.pos < 0-CONFIG.PIPE_WIDTH * 10) { Pipe.remove(this); return; };
    };

    render() {
        const leftEdge = this.pos - CONFIG.PIPE_WIDTH/2;
        CTX.beginPath();
        CTX.rect(leftEdge, 0, CONFIG.PIPE_WIDTH, this.upperEdge);
        CTX.rect(leftEdge, this.lowerEdge, CONFIG.PIPE_WIDTH, CANVAS.height);
        CTX.fill();
    };

    checkCollision() {
        let detected = false;
        let hit = false;
        if (this.cleared) {
            return {detected: false, hit: false};
        };
        if (this.pos > CONFIG.BIRD_X_POS - CONFIG.PIPE_WIDTH/2 - CONFIG.BIRD_SIZE && this.pos < CONFIG.BIRD_X_POS + CONFIG.PIPE_WIDTH/2 + CONFIG.BIRD_SIZE) {
            detected = true;
            const birdUpper = CANVAS.height-SESSION.BIRD.pos - CONFIG.BIRD_SIZE/2;
            const birdLower = CANVAS.height-SESSION.BIRD.pos + CONFIG.BIRD_SIZE/2;
            if (birdUpper <= this.upperEdge || birdLower >= this.lowerEdge) {
                hit = true;
            };
        };
        return {detected: detected, hit: hit};
    };

    static async remove(pipe) {
        SESSION.PIPES.splice(SESSION.PIPES.indexOf(pipe),1);
    };
};


// Utility
function frame() {
    // Clear canvas
    CTX.clearRect(0,0,CANVAS.width,CANVAS.height);

    // Update pipes
    SESSION.PIPES.forEach(pipe => {
        pipe.step();
        if (pipe.pos + CONFIG.PIPE_WIDTH + CONFIG.BIRD_SIZE <= CONFIG.BIRD_X_POS && !pipe.cleared) {
            pipe.cleared = true;
            countPoint();
        };
        pipe.render();
    });

    // Update bird
    SESSION.BIRD.step();
    SESSION.BIRD.render();

    // Check collisions
    if (SESSION.BIRD.checkCollision().hit) {
        gameOver();
    };

    // Pipe spawning
    if (SESSION.FRAMES_SINCE_LAST_PIPE >= CONFIG.PIPE_INTERVAL) {
        SESSION.PIPES.push(new Pipe(CANVAS.width + CONFIG.PIPE_WIDTH));
        SESSION.FRAMES_SINCE_LAST_PIPE = 0;
    } else {
        SESSION.FRAMES_SINCE_LAST_PIPE++;
    };

    // Frame
    if (SESSION.RUNNING) { requestAnimationFrame(frame); };
};

function renderCurrentState() {
    CTX.beginPath();
    CTX.clearRect(0,0,CANVAS.width,CANVAS.height);
    SESSION.PIPES.forEach(pipe => { pipe.render(); });
    SESSION.BIRD.render();
};

function pipeCheck(pipe) {
    let detected = false;
    let hit = false;
    if (pipe.pos > CONFIG.BIRD_X_POS - CONFIG.PIPE_WIDTH/2 - CONFIG.BIRD_SIZE && pipe.pos < CONFIG.BIRD_X_POS + CONFIG.PIPE_WIDTH/2 + CONFIG.BIRD_SIZE) {
        detected = true;
        const birdUpper = CANVAS.height-SESSION.BIRD.pos - CONFIG.BIRD_SIZE/2;
        const birdLower = CANVAS.height-SESSION.BIRD.pos + CONFIG.BIRD_SIZE/2;
        if (birdUpper <= pipe.upperEdge || birdLower >= pipe.lowerEdge) {
            hit = true;
        };
    };
    return {detected: detected, hit: hit};
};

function resizeCanvas() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
};

function start() {
    SESSION.RUNNING = true;

    frame();
};

function stop() {
    SESSION.RUNNING = false;
};

function toggle() {
    switch(SESSION.RUNNING) {
        case true:
            stop();
            break;

        case false:
            start();
    };
};

function gameOver() {
    stop();
    alert('Game Over!\nYour score is ' + SESSION.SCORE);
};

function countPoint() {
    SESSION.SCORE++;
    updateScore(SESSION.SCORE);
};

function init() {
    SESSION.BIRD = new Bird();

    window.addEventListener('click', _ => { SESSION.BIRD.jump(); });
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', evt => {
        // console.log(evt)
        switch(evt.code) {
            case 'KeyP':
                toggle();
                break;

            case 'Space':
                SESSION.BIRD.jump();
                break;

            case 'ArrowRight':
                if (evt.shiftKey) { SESSION.BIRD.jump(); };
                frame();
                break;

            case 'KeyW':
                SESSION.BIRD.pos += evt.shiftKey ? 1 : CONFIG.DEBUG_BIRD_MOVE;
                renderCurrentState();
                break;

            case 'KeyS':
                SESSION.BIRD.pos -= evt.shiftKey ? 1 : CONFIG.DEBUG_BIRD_MOVE;
                renderCurrentState();
                break;

            case 'KeyD':
                SESSION.PIPES.forEach(pipe => { pipe.step(); });
                renderCurrentState();
                break;

            case 'KeyQ':
                SESSION.PIPES.forEach(pipe => { console.log(pipe.checkCollision()); });
                break;
        };
    });
    resizeCanvas();
};

init();