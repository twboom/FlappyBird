// Config
const CONFIG = {
    tickspeed: 30,
    blockSize: 20,
    playerWidth: 20,
    playerHeight: 40,
    playerGravity: 1,
    playerTerminalVelocity: 20,
    playerJump: 15,
    playerSpeed: 5,
    playerFriction: 1,
}

// Constants
const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');
const SESSION = {
    pausedState: false,
    cameraPos: [0, 0],
};
// Classes
class Player {
    constructor() {
        this.x = LEVEL ? LEVEL.startPos[0] * CONFIG.blockSize : 0;
        this.y = LEVEL ? LEVEL.startPos[1] * CONFIG.blockSize : 0;
        this.velX = 0;
        this.velY = 0;
        this.actions = new Set();
    };

    get hitbox() {
        return {
            x: this.x - CONFIG.playerWidth/2,
            y: this.y - CONFIG.playerHeight/2,
            width: CONFIG.playerWidth,
            height: CONFIG.playerHeight,
        };
    };

    tick() {
        let newX = this.x;
        let newY = this.y;
        let newVelX = this.velX;
        let newVelY = this.velY;

        // Gravity
        newVelY += CONFIG.playerGravity;
        if (newVelY > CONFIG.playerTerminalVelocity) { newVelY = CONFIG.playerTerminalVelocity; };

        // Friction
        if (newVelX < 0) { newVelX += CONFIG.playerFriction; };
        if (newVelX > 0) { newVelX -= CONFIG.playerFriction; };

        // Walking
        if (this.actions.has('moveLeft')) {
            newVelX = -CONFIG.playerSpeed;
        };

        if (this.actions.has('moveRight')) {
            newVelX = CONFIG.playerSpeed;
        };

        newX += newVelX

        
        newY += newVelY;

        // Collisions
        let feetCollision = false;

        const head = {
            x: this.x - CONFIG.playerWidth / 2,
            y: newY - this.hitbox.height / 2 - 1,
            width: CONFIG.playerWidth,
            height: 1,
        };

        const feet = {
            x: this.x - CONFIG.playerWidth / 2,
            y: newY + this.hitbox.height / 2,
            width: CONFIG.playerWidth,
            height: 1,
        };
        
        LEVEL.platforms.forEach(platform => {
            // Head check
            const currentHeadCollision = boundingBoxCollision(platform.hitbox, head);
            if (currentHeadCollision) {
                if (newVelY > 0) { newVelY = 0;  };
                newY = platform.hitbox.y + platform.hitbox.height + this.hitbox.height / 2;
                newVelY = 0;
            };
            
            // Feet check
            const currentFeetCollision = boundingBoxCollision(platform.hitbox, feet);
            if (currentFeetCollision) {
                if (newVelY > 0) { newVelY = 0;  };
                if (newY + this.hitbox.height > platform.hitbox.y) { newY = platform.hitbox.y - CONFIG.playerHeight/2 - 1; };
            };
            if (currentFeetCollision && !feetCollision) { feetCollision = true };

            // Body check
            const body = {
                x: newX - CONFIG.playerWidth / 2,
                y: newY - CONFIG.playerHeight / 2,
                width: this.hitbox.width,
                height: this.hitbox.height - 5,
            };
            const currentBodyCollsion = boundingBoxCollision(platform.hitbox, body);
            if (currentBodyCollsion) {
                newX = this.x
                newVelX = 0;
            }
            
        });

        // Jumping
        if (this.actions.has('jump')) {
            if (feetCollision) { newVelY = -CONFIG.playerJump; newY += newVelY };
            this.actions.delete('jump')
        };

        // Update values
        this.x = newX;
        this.y = newY;
        this.velX = newVelX;
        this.velY = newVelY;
    }

    render() {
        CTX.beginPath();
        CTX.fillStyle = 'red';
        CTX.fillRect(this.x - CONFIG.playerWidth/2, this.y - CONFIG.playerHeight/2, CONFIG.playerWidth, CONFIG.playerHeight);
    }
};

class Platform {
    constructor(x, y, width, vertical=false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.vertical = vertical;
    };

    get pxX() { return this.x * CONFIG.blockSize; };
    get pxY() { return this.y * CONFIG.blockSize; };
    get pxWidth() {
        if (!this.vertical) {
            return this.width*CONFIG.blockSize;
        } else {
            return CONFIG.blockSize;
        };
    };
    get pxHeight() { if (!this.vertical) {
            return CONFIG.blockSize;
        } else {
            return this.width*CONFIG.blockSize;
        };
    };

    get hitbox() {
        return {
            x: this.pxX,
            y: this.pxY,
            width: this.pxWidth,
            height: this.pxHeight,
        };
    };

    render() {
        CTX.beginPath();
        CTX.fillStyle = 'black';
        let width = this.width*CONFIG.blockSize;
        let height = CONFIG.blockSize;
        if (this.vertical) {
            const tempHeight = height;
            height = width;
            width = tempHeight;
        };
        CTX.fillRect(this.x * CONFIG.blockSize, this.y * CONFIG.blockSize, width, height);
    };

    playerCollision(player) {
        return boundingBoxCollision(this.hitbox, player.hitbox)
    }
};

const LEVEL = {
    platforms: [
        new Platform(-19, -15, 39),
        new Platform(-20, -15, 30, true),
        new Platform(20, -15, 30, true),
        new Platform(-19, 14, 39),
        new Platform(8, 10, 4),
    ],
    startPos: [10, 8],
};

// Utility functions
function resizeCanvas() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    SESSION.cameraPos = [CANVAS.width / 2, CANVAS.height / 2];
};

function boundingBoxCollision(box1, box2) {
    if (
        box1.x < box2.x + box2.width &&
        box1.x + box1.width > box2.x &&
        box1.y < box2.y + box2.height &&
        box1.y + box1.height > box2.y
    ) {
        return true;
    } else {
        return false;
    };
};

// Game functions
function pauseGame() {
    SESSION.pausedState = true;
    return 'Paused game'
};

function unpauseGame() {
    SESSION.pausedState = false;
    frame();
    gameTick();
    return 'Unpaused game'
};

function togglePaused() {
    if (SESSION.pausedState) {
        return unpauseGame();
    } else {
        return pauseGame();
    };
};

function frame(pauseOverride = true) {
    // Check if game is running
    if (SESSION.pausedState && !pauseOverride) { return; };

    // Clear canvas
    CTX.clearRect(-SESSION.cameraPos[0], -SESSION.cameraPos[1], CANVAS.width, CANVAS.height);

    // Set camera position
    CTX.resetTransform();
    CTX.translate(SESSION.cameraPos[0], SESSION.cameraPos[1]);

    LEVEL.platforms.forEach(platform => {
        platform.render();
    });

    if (SESSION.player instanceof Player) {
        SESSION.player.render();
    };

    requestAnimationFrame(frame);
};

function gameTick(pauseOverride = false) {
    // console.log(SESSION.pausedState && !pauseOverride)
    if (SESSION.pausedState && !pauseOverride) { return; };
    // console.log('tick');



    if (SESSION.player instanceof Player) {
        SESSION.player.tick();
    };


    if (!pauseOverride) { setTimeout(gameTick, (1/CONFIG.tickspeed) * 1000); };
};

function init() {
    resizeCanvas();
    
    SESSION.player = new Player();

    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('keydown', evt => {
        switch(evt.key) {
            case 'w':
                SESSION.player.actions.add('jump');
                break;
            
            case 'a':
                SESSION.player.actions.add('moveLeft');
                break;
            
            case 'd':
                SESSION.player.actions.add('moveRight');
                break;
        };
    });
    
    document.addEventListener('keyup', evt => {
        switch(evt.key) {            
            case 'a':
                SESSION.player.actions.delete('moveLeft');
                break;
            
            case 'd':
                SESSION.player.actions.delete('moveRight');
                break;
        };
    });

    document.addEventListener('keypress', evt => {
        switch(evt.key) {
            case 'p':
                togglePaused();
                break;

            case 'o':
                gameTick(true);
                frame();
                break;
        };
    });

    frame();
    gameTick();
};

init();