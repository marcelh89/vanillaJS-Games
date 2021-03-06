const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 50;
let chosenDefender = 1;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];


// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
    clicked: false
}
canvas.addEventListener('mousedown', function () {
    mouse.clicked = true;
})
canvas.addEventListener('mouseup', function () {
    mouse.clicked = false;
})
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function (e) {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function () {
    mouse.x = undefined;
    mouse.y = undefined;
})

// game board
const controlsBar = {
    width: canvas.width,
    height: cellSize
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
    }

    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}

function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y))
        }
    }
}

createGrid();

function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
    }
}

// projectiles
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();

        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j] && projectiles[i] && collision(enemies[j], projectiles[i])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }

    }
}


// defenders
const defender1 = new Image();
defender1.src = 'sprites/defender1.png';
const defender2 = new Image();
defender2.src = 'sprites/defender2.png';

class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.shootNow = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
        this.spriteWidth = 194;
        this.spriteHeight = 194;
        this.minFrame = 0;
        this.maxFrame = 16;
        this.chosenDefender = chosenDefender;
    }

    draw() {
        //ctx.fillStyle = 'blue';
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 25, this.y + 10)
        if (this.chosenDefender === 1) {
            ctx.drawImage(defender1, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height)
        } else if (this.chosenDefender === 2) {
            ctx.drawImage(defender2, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height)
        }

    }

    update() {
        if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            if (this.frameX === 15) this.shootNow = true;
        }

        // handle sprites with different amount of images and starting positions
        if (this.chosenDefender === 1) {
            // spaghetti code version :)
            if (this.shooting) {
                this.minFrame = 0;
                this.maxFrame = 15;
            } else {
                this.minFrame = 17;
                this.maxFrame = 23;
            }
        } else if (this.chosenDefender === 2) {
            // spaghetti code version :)
            if (this.shooting) {
                this.minFrame = 13;
                this.maxFrame = 28;
            } else {
                this.minFrame = 0;
                this.maxFrame = 12;
            }
        }


        if (this.shooting && this.shootNow) {
            projectiles.push(new Projectile(this.x + 70, this.y + 35))
            this.shootNow = false;
        }

    }
}

canvas.addEventListener('click', function () {
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    if (gridPositionY < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
            return;
    }
    let defenderCost = 100;
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }
})

function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();
        if (enemyPositions.indexOf(defenders[i].y) !== -1) {
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && collision(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
            }
            if (defenders[i] && defenders[i].health <= 0) {
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

const card1 = {
    x: 10,
    y: 10,
    width: 70,
    height: 85
};
const card2 = {
    x: 90,
    y: 10,
    width: 70,
    height: 85
}


function chooseDefender() {
    let card1stroke;
    let card2stroke;

    if (collision(mouse, card1) && mouse.clicked) {
        chosenDefender = 1;
    } else if (collision(mouse, card2) && mouse.clicked) {
        chosenDefender = 2;
    }

    if (chosenDefender === 1) {
        card1stroke = 'white';
        card2stroke = 'black';
    } else if (chosenDefender === 2) {
        card1stroke = 'black';
        card2stroke = 'white';
    } else {
        card2stroke = 'black';
        card1stroke = 'black';
    }

    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0,0.2';
    ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
    ctx.strokeStyle = card1stroke;
    ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
    ctx.drawImage(defender1, 0, 0, 194, 194, 0, 5, 194 / 2, 194 / 2);
    ctx.fillRect(card2.x, card2.y, card2.width, card2.height)
    ctx.strokeStyle = card2stroke;
    ctx.drawImage(defender2, 0, 0, 194, 194, 80, 5, 194 / 2, 194 / 2);
    ctx.strokeRect(card2.x, card2.y, card2.width, card2.height)
}

// FloatingMessages
const floatingMessages = [];

class FloatingMessage {
    constructor(value, x, y, size, color) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }

    update() {
        this.y -= 0.3;
        this.lifeSpan += 1;
        if (this.opacity > 0.03) this.opacity -= 0.03;
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Orbitron';
        ctx.fillText(this.value, this.x, this.y)
        ctx.globalAlpha = 1;
    }
}

function handleFloatingMessages() {
    console.log("handleFloatingMessages")
    for (let i = 0; i < floatingMessages.length; i++) {
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if (floatingMessages[i].lifeSpan >= 50) {
            floatingMessages.splice(i, 1);
            i--;
        }
    }
}


// enemies
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = 'sprites/enemy1.png';
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = 'sprites/enemy2.png';
enemyTypes.push(enemy2);

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.4
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.frameX = 0;
        this.frameY = 0; // one-row sprite sheet always stays 0 here
        this.minFrame = 0;
        if (this.enemyType === enemy1) {
            this.maxFrame = 4
        } else if (this.enemyType === enemy2) {
            this.maxFrame = 8;
        }
        this.spriteWidth = 256;
        this.spriteHeight = 256;
    }

    update() {
        this.x -= this.movement;
        if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }

    draw() {
        //ctx.fillStyle = 'red';
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
        //ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
    }
}

function handleEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        enemy.update();
        enemy.draw();
        if (enemy.x < 0) {
            gameOver = true;
        }
        if (enemy.health <= 0) {
            let gainedResources = enemy.maxHealth / 10;
            floatingMessages.push(new FloatingMessage('+' + gainedResources, enemy.x, enemy.y, 30, 'gold'))
            floatingMessages.push(new FloatingMessage('+' + gainedResources, 470, 85, 30, 'gold'))
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemy.y)
            enemyPositions.splice(findThisIndex, 1)
            enemies.splice(i, 1);
            i--;
        }
    }
    if (frame % enemiesInterval === 0 && score < winningScore) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        if (enemiesInterval > 120) enemiesInterval -= 50;
    }
}


// resources
const amounts = [20, 30, 40];

class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    }

    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.fillText(this.amount, this.x + 15, this.y + 25)
    }

}

function handleResources() {
    if (frame % 500 === 0 && score < winningScore) {
        resources.push(new Resource())
    }

    for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        resource.draw();
        if (resource && mouse.x && mouse.y && collision(resource, mouse)) {
            numberOfResources += resource.amount;
            floatingMessages.push(new FloatingMessage('+' + resource.amount, resource.x, resource.y, 30, 'black'))
            floatingMessages.push(new FloatingMessage('+' + resource.amount, 470, 85, 30, 'gold'))
            resources.splice(i, 1);
            i--;
        }
    }

}


// utilities
function handleGameStatus() {
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.fillText('Score: ' + score, 180, 40)
    ctx.fillText('Resouces: ' + numberOfResources, 180, 80)
    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '90px Orbitron';
        ctx.fillText('GAME OVER', 135, 330);
    }
    if (score >= winningScore && enemies.length === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText('LEVEL COMPLETE', 130, 300);
        ctx.font = '30px Orbitron';
        ctx.fillText('You win with ' + score + ' points', 130, 340);
    }
}

canvas.addEventListener('click', function () {
    /*const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    if (gridPositionY < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
            return;
    }
     */
    let defenderCost = 100;

    if (numberOfResources >= defenderCost) {
        //defenders.push(new Defender(gridPositionX, gridPositionY));
        //numberOfResources -= defenderCost;
    } else {
        floatingMessages.push(new FloatingMessage('need more resources', mouse.x, mouse.y, 15, 'blue'));
    }
})

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleResources();
    handleDefenders();
    handleProjectiles();
    handleEnemies();
    chooseDefender();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    if (!gameOver) requestAnimationFrame(animate);

}

animate();

function collision(first, second) {

    if (!(first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y)
    ) {
        return true;
    }

}

window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
})