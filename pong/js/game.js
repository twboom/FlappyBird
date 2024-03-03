const CONFIG = {
    PLAYER_WIDTH: 20,
    PLAYER_HEIGHT: 100,
    PLAYER_DISTANCE_TO_EDGE: 50,
    PLAYER_SPEED: 10,
    BALL_SIZE: 20,
    AGENT_CLOCK_SPEED: 100,
}

const SESSION = {
    PLAYERS: {
        LEFT: null,
        RIGHT: null,
    },
    AGENTS: [],
    BALL: null,
    KEY_ACTIVITY: {},
    RUNNING: true,
}

const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');

const CONSTANTS = {};
function setConstants() {
    CONSTANTS.PLAYER_LEFT_EDGE_LEFT = CONFIG.PLAYER_DISTANCE_TO_EDGE;
    CONSTANTS.PLAYER_LEFT_EDGE_RIGHT = CONFIG.PLAYER_DISTANCE_TO_EDGE + CONFIG.PLAYER_WIDTH;
    CONSTANTS.PLAYER_RIGHT_EDGE_LEFT = CANVAS.width - CONFIG.PLAYER_DISTANCE_TO_EDGE - CONFIG.PLAYER_WIDTH;
    CONSTANTS.PLAYER_RIGHT_EDGE_RIGHT = CANVAS.width - CONFIG.PLAYER_DISTANCE_TO_EDGE;
};

class Player {
    constructor(xPos, controls) {
        this.score = 0;
        this.pos = CANVAS.height/2;
        this.controls = controls;

        this.edgeLeft = xPos == 'left' ? CONSTANTS.PLAYER_LEFT_EDGE_LEFT : CONSTANTS.PLAYER_RIGHT_EDGE_LEFT;
        this.edgeRight = this.edgeLeft + CONFIG.PLAYER_WIDTH;
    };

    get edgeTop() { return this.pos - CONFIG.PLAYER_HEIGHT/2; };
    get edgeBottom() { return this.pos + CONFIG.PLAYER_HEIGHT/2; };

    set edgeTop(value) { this.pos = value + CONFIG.PLAYER_HEIGHT/2 }
    set edgeBottom(value) { this.pos = value - CONFIG.PLAYER_HEIGHT/2 }

    step() {
        if (this.controls) {
            if (SESSION.KEY_ACTIVITY[this.controls.up]) { this.move('up'); };
            if (SESSION.KEY_ACTIVITY[this.controls.down]) { this.move('down'); };
        };
    };

    move(direction) {
        switch (direction) {
            case 'up':
                this.pos -= CONFIG.PLAYER_SPEED;
                if (this.edgeTop < 0) { this.edgeTop = 0 };
                break;
                
            case 'down':
                this.pos += CONFIG.PLAYER_SPEED;
                if (this.edgeBottom > CANVAS.height) { this.edgeBottom = CANVAS.height };
                break;
        };
    };


    render() {
        CTX.beginPath();
        CTX.rect(this.edgeLeft, this.edgeTop, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT)
        CTX.fillStyle = 'white';
        CTX.fill();
    };
};

class Ball {
    constructor() {
        this.pos = {x: CANVAS.width/2, y: CANVAS.height/2};
        this.speed = {x: 5, y:5};

        this.isScoring = false;
    };

    get edgeLeft() { return this.pos.x - CONFIG.BALL_SIZE/2; };
    get edgeRight() { return this.pos.x + CONFIG.BALL_SIZE/2; };
    get edgeTop() { return this.pos.y - CONFIG.BALL_SIZE/2; };
    get edgeBottom() { return this.pos.y + CONFIG.BALL_SIZE/2; };

    step() {
        if (this.edgeLeft <= 0) { scorePoint('RIGHT'); };
        if (this.edgeLeft >= CANVAS.width) { scorePoint('LEFT'); };

        // Top/Bottom edge detection
        if (this.edgeTop < 0 || this.edgeBottom > CANVAS.height) { this.speed.y *= -1 };

        // Player hit detection
        if (
            !this.isScoring &&
            (this.edgeLeft <= CONSTANTS.PLAYER_LEFT_EDGE_RIGHT &&
            (
                this.pos.y > SESSION.PLAYERS.LEFT.edgeTop &&
                this.pos.y < SESSION.PLAYERS.LEFT.edgeBottom
                // true
            )) || 
            (this.edgeRight >= CONSTANTS.PLAYER_RIGHT_EDGE_LEFT &&
            (
                this.pos.y > SESSION.PLAYERS.RIGHT.edgeTop &&
                this.pos.y < SESSION.PLAYERS.RIGHT.edgeBottom
                // true
            ))
        ) { this.speed.x *= -1 };

        // Update position
        this.pos.x += this.speed.x;
        this.pos.y += this.speed.y;

        // Check for scores
        if (this.edgeLeft < CONSTANTS.PLAYER_LEFT_EDGE_LEFT) { this.isScoring = true; };
        if (this.edgeRight > CONSTANTS.PLAYER_RIGHT_EDGE_RIGHT) { this.isScoring = true; };
    }

    render() {
        CTX.beginPath();
        CTX.rect(this.edgeLeft, this.edgeTop, CONFIG.BALL_SIZE, CONFIG.BALL_SIZE);
        CTX.fillStyle = 'white';
        CTX.fill();
    };
};

class Agent {
    constructor(player) {
        this.player = player;
        this.id = SESSION.AGENTS.length;
        this.keys = {
            up: 'AGENT-' + this.id + 'up',
            down: 'AGENT-' + this.id + 'down',
        }
        this.player.controls = {up: this.keys.up, down: this.keys.down};
        SESSION.AGENTS.push(this);
    };

    step(ballY) {
        if (this.player.pos > ballY) { SESSION.KEY_ACTIVITY[this.keys.up] = true; SESSION.KEY_ACTIVITY[this.keys.down] = false; };
        if (this.player.pos < ballY) { SESSION.KEY_ACTIVITY[this.keys.down] = true; SESSION.KEY_ACTIVITY[this.keys.up] = false; };
    };
};

function scorePoint(player) {
    SESSION.BALL.speed.x *= -1;
    SESSION.BALL.pos = {x: CANVAS.width/2, y: CANVAS.height/2};
    SESSION.PLAYERS[player].score++;
    SESSION.BALL.isScoring = false;
}

function frame() {
    CTX.clearRect(0,0,CANVAS.width,CANVAS.height);

    SESSION.BALL.step();
    SESSION.BALL.render();

    Object.values(SESSION.PLAYERS).forEach(pl => {
        pl.step();
        pl.render();
    });

    if (SESSION.RUNNING) { requestAnimationFrame(frame); };
};

function agentFrame() {
    SESSION.AGENTS.forEach(ag => {
        ag.step(SESSION.BALL.pos.y);
    });
};

function resizeCanvas() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
};

function init() {
    // Add listeners
    window.addEventListener('keydown', evt => {
        SESSION.KEY_ACTIVITY[evt.code] = true;
    });
    window.addEventListener('keyup', evt => {
        SESSION.KEY_ACTIVITY[evt.code] = false;
    });
    window.addEventListener('resize', resizeCanvas);

    // Set canvas size
    resizeCanvas();

    setConstants();

    // Add the players
    SESSION.PLAYERS.LEFT = new Player('left', {up: 'KeyW', down: 'KeyS'}); 
    SESSION.PLAYERS.RIGHT = new Player('right', {up: 'ArrowUp', down: 'ArrowDown'});

    // Add agent for player RIGHT
    new Agent(SESSION.PLAYERS.LEFT);
    // new Agent(SESSION.PLAYERS.RIGHT);

    // Add the ball
    SESSION.BALL = new Ball();

    // Start the frames
    frame();
    SESSION.AGENT_CLOCK = setInterval(agentFrame, CONFIG.AGENT_CLOCK_SPEED);
};

init();