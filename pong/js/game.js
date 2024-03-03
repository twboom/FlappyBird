const CONFIG = {
    PLAYER_WIDTH: 20,
    PLAYER_HEIGHT: 100,
    PLAYER_DISTANCE_TO_EDGE: 50,
    PLAYER_SPEED: 10,
    BALL_SIZE: 20,
}

const SESSION = {
    PLAYERS: {
        LEFT: null,
        RIGHT: null,
    },
    AGENTS: [],
    BALL: null,
    KEYBINDS: {},
    RUNNING: true,
    LAST_FRAME: 0,
}

const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');

class Player {
    constructor(xPos, controls) {
        this.score = 0;
        this.pos = CANVAS.height/2;
        this.controls = controls;
        this.leftEdge = xPos == 'left' ? CONFIG.PLAYER_DISTANCE_TO_EDGE : CANVAS.width - CONFIG.PLAYER_DISTANCE_TO_EDGE - CONFIG.PLAYER_WIDTH/2;
    };

    step() {
        if (this.controls) {
            if (SESSION.KEYBINDS[this.controls.up]) { this.move('up'); };
            if (SESSION.KEYBINDS[this.controls.down]) { this.move('down'); };
        };
    };

    move(direction) {
        let newPos;
        switch (direction) {
            case 'up':
                newPos = this.pos - CONFIG.PLAYER_SPEED;
                if (newPos - CONFIG.PLAYER_HEIGHT/2 < 0) { newPos = CONFIG.PLAYER_HEIGHT/2; };
                break;
                
            case 'down':
                newPos = this.pos + CONFIG.PLAYER_SPEED;
                if (newPos + CONFIG.PLAYER_HEIGHT/2 > CANVAS.height) { newPos = CANVAS.height - CONFIG.PLAYER_HEIGHT/2; };
                break;
        };
        this.pos = newPos;
    };


    render() {
        CTX.beginPath();
        CTX.rect(this.leftEdge, this.pos - CONFIG.PLAYER_HEIGHT/2, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT)
        CTX.fillStyle = 'white';
        CTX.fill();
    };
};

class Ball {
    constructor() {
        this.pos = {x: CANVAS.width/2, y: CANVAS.height/2};
        this.speed = {x: 5, y:5};
    };

    step() {
        // Update speed
        if (this.pos.y - CONFIG.BALL_SIZE/2 < 0 || this.pos.y + CONFIG.BALL_SIZE/2 > CANVAS.height) { this.speed.y *= -1 };

        if (
            (this.pos.x - CONFIG.BALL_SIZE/2 < CONFIG.PLAYER_DISTANCE_TO_EDGE + CONFIG.PLAYER_WIDTH &&
            (
                this.pos.y > SESSION.PLAYERS.LEFT.pos - CONFIG.PLAYER_HEIGHT/2 &&
                this.pos.y < SESSION.PLAYERS.LEFT.pos + CONFIG.PLAYER_HEIGHT/2
            )) || 
            (this.pos.x + CONFIG.BALL_SIZE/2 > CANVAS.width - CONFIG.PLAYER_DISTANCE_TO_EDGE - CONFIG.PLAYER_WIDTH &&
            (
                this.pos.y > SESSION.PLAYERS.RIGHT.pos - CONFIG.PLAYER_HEIGHT/2 &&
                this.pos.y < SESSION.PLAYERS.RIGHT.pos + CONFIG.PLAYER_HEIGHT/2
            ))
        ) { this.speed.x *= -1 };

        // Update position
        this.pos.x += this.speed.x;
        this.pos.y += this.speed.y;

        // Check for scores
        if (this.pos.x - CONFIG.BALL_SIZE/2 <= 0) { scorePoint('RIGHT'); };
        if (this.pos.x + CONFIG.BALL_SIZE/2 >= CANVAS.width) { scorePoint('LEFT'); };
    }

    render() {
        CTX.beginPath();
        CTX.rect(this.pos.x - CONFIG.BALL_SIZE/2, this.pos.y - CONFIG.BALL_SIZE, CONFIG.BALL_SIZE, CONFIG.BALL_SIZE);
        CTX.fillStyle = 'white';
        CTX.fill();
    };
};

class Agent {
    constructor(player) {
        this.player = player;
    };

    step(ballY) {
        if (this.player.pos > ballY) { this.player.move('up'); };
        if (this.player.pos < ballY) { this.player.move('down'); };
    };
};

function scorePoint(player) {
    SESSION.BALL.speed.x *= -1;
    SESSION.BALL.pos = {x: CANVAS.width/2, y: CANVAS.height/2};
    SESSION.PLAYERS[player].score++;
}

function frame() {
    console.log(Date.now() - SESSION.LAST_FRAME)
    SESSION.LAST_FRAME = Date.now();

    CTX.clearRect(0,0,CANVAS.width,CANVAS.height);

    SESSION.BALL.step();
    SESSION.BALL.render();

    SESSION.AGENTS.forEach(ag => {
        ag.step(SESSION.BALL.pos.y);
    });

    Object.values(SESSION.PLAYERS).forEach(pl => {
        pl.step();
        pl.render();
    });

    if (SESSION.RUNNING) { requestAnimationFrame(frame); };
};

function resizeCanvas() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
};

function init() {
    // Add listeners
    window.addEventListener('keydown', evt => {
        SESSION.KEYBINDS[evt.code] = true;
    });
    window.addEventListener('keyup', evt => {
        SESSION.KEYBINDS[evt.code] = false;
    });
    window.addEventListener('resize', resizeCanvas);

    // Set canvas size
    resizeCanvas();

    // Add the players
    SESSION.PLAYERS.LEFT = new Player('left', {up: 'KeyW', down: 'KeyS'}); 
    SESSION.PLAYERS.RIGHT = new Player('right');

    // Add agent for player RIGHT
    SESSION.AGENTS.push(new Agent(SESSION.PLAYERS.LEFT));
    SESSION.AGENTS.push(new Agent(SESSION.PLAYERS.RIGHT));

    // Add the ball
    SESSION.BALL = new Ball();

    // Start the frames
    SESSION.LAST_FRAME = Date.now();
    frame();
};

init();