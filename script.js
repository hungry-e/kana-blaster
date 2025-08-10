// script.js

// --- Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const hiraganaBtn = document.getElementById('hiraganaBtn');
const katakanaBtn = document.getElementById('katakanaBtn');
const bothBtn = document.getElementById('bothBtn');


const WIDTH = 720;
const HEIGHT = 900;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const FPS = 60;
const MAX_ESCAPES = 10;
const KANA_SPAWN_RATE = 1000; // in milliseconds

// --- Load Assets ---
const backgroundImage = new Image();
backgroundImage.src = 'background.jpg';

// Wait for the font and image to load
Promise.all([
    document.fonts.load('64px NotoSansJP'),
    new Promise(resolve => backgroundImage.onload = resolve)
]).then(() => {
    // Assets are loaded, ready to start.
    console.log("Assets loaded.");
});


// --- Game Data & Colors ---
const colors = {
    "WHITE": "#FFFFFF", "GRAY": "#808080", "PASTEL_PINK": "#ffc0cb",
    "NEON_CYAN": "#00FFFF", "NEON_MAGENTA": "#FF00FF", "PLAYER_BLUE": "#4d9de0"
};

const BASIC_KANA = [
    { romaji: "a", hiragana: "あ", katakana: "ア" }, { romaji: "i", hiragana: "い", katakana: "イ" }, { romaji: "u", hiragana: "う", katakana: "ウ" }, { romaji: "e", hiragana: "え", katakana: "エ" }, { romaji: "o", hiragana: "お", katakana: "オ" },
    { romaji: "ka", hiragana: "か", katakana: "カ" }, { romaji: "ki", hiragana: "き", katakana: "キ" }, { romaji: "ku", hiragana: "く", katakana: "ク" }, { romaji: "ke", hiragana: "け", katakana: "ケ" }, { romaji: "ko", hiragana: "こ", katakana: "コ" },
    { romaji: "sa", hiragana: "さ", katakana: "サ" }, { romaji: "shi", hiragana: "し", katakana: "シ" }, { romaji: "su", hiragana: "す", katakana: "ス" }, { romaji: "se", hiragana: "せ", katakana: "セ" }, { romaji: "so", hiragana: "そ", katakana: "ソ" },
    { romaji: "ta", hiragana: "た", katakana: "タ" }, { romaji: "chi", hiragana: "ち", katakana: "チ" }, { romaji: "tsu", hiragana: "つ", katakana: "ツ" }, { romaji: "te", hiragana: "て", katakana: "テ" }, { romaji: "to", hiragana: "と", katakana: "ト" },
    { romaji: "na", hiragana: "な", katakana: "ナ" }, { romaji: "ni", hiragana: "に", katakana: "ニ" }, { romaji: "nu", hiragana: "ぬ", katakana: "ヌ" }, { romaji: "ne", hiragana: "ね", katakana: "ネ" }, { romaji: "no", hiragana: "の", katakana: "ノ" },
    { romaji: "ha", hiragana: "は", katakana: "ハ" }, { romaji: "hi", hiragana: "ひ", katakana: "ヒ" }, { romaji: "fu", hiragana: "ふ", katakana: "フ" }, { romaji: "he", hiragana: "へ", katakana: "ヘ" }, { romaji: "ho", hiragana: "ほ", katakana: "ホ" },
    { romaji: "ma", hiragana: "ま", katakana: "マ" }, { romaji: "mi", hiragana: "み", katakana: "ミ" }, { romaji: "mu", hiragana: "む", katakana: "ム" }, { romaji: "me", hiragana: "め", katakana: "メ" }, { romaji: "mo", hiragana: "も", katakana: "モ" },
    { romaji: "ya", hiragana: "や", katakana: "ヤ" }, { romaji: "yu", hiragana: "ゆ", katakana: "ユ" }, { romaji: "yo", hiragana: "よ", katakana: "ヨ" },
    { romaji: "ra", hiragana: "ら", katakana: "ラ" }, { romaji: "ri", hiragana: "り", katakana: "リ" }, { romaji: "ru", hiragana: "る", katakana: "ル" }, { romaji: "re", hiragana: "れ", katakana: "レ" }, { romaji: "ro", hiragana: "ろ", katakana: "ロ" },
    { romaji: "wa", hiragana: "わ", katakana: "ワ" }, { romaji: "wo", hiragana: "を", katakana: "ヲ" },
    { romaji: "n", hiragana: "ん", katakana: "ン" }
];

// --- Game State Variables ---
let score, escapes, gameOver, typingBuffer, escapedKana, fallingKana;
let lastSpawnTime, gameMode;
let animationFrameId; // To control the game loop

// --- Game Objects ---
class Kana {
    constructor() {
        const kanaData = BASIC_KANA[Math.floor(Math.random() * BASIC_KANA.length)];
        this.romaji = kanaData.romaji;
        
        let characterType = gameMode;
        if (gameMode === 'both') {
            characterType = Math.random() < 0.5 ? 'hiragana' : 'katakana';
        }
        
        this.character = characterType === 'hiragana' ? kanaData.hiragana : kanaData.katakana;
        this.x = Math.random() * (WIDTH - 80) + 40;
        this.y = -50;
        // SPEED ADJUSTMENT: Use integer speeds like the original python script
        this.speed = Math.floor(Math.random() * 3) + 1; // Speed is now 1, 2, or 3
    }

    update() { this.y += this.speed; }

    draw() {
        ctx.font = "64px NotoSansJP";
        ctx.fillStyle = colors.WHITE;
        ctx.textAlign = "center";
        ctx.fillText(this.character, this.x, this.y);
    }
}

function resetGame() {
    score = 0;
    escapes = 0;
    gameOver = false;
    typingBuffer = "";
    escapedKana = [];
    fallingKana = [];
    lastSpawnTime = 0;
}

// --- Event Listeners ---
hiraganaBtn.addEventListener('click', () => startGame('hiragana'));
katakanaBtn.addEventListener('click', () => startGame('katakana'));
bothBtn.addEventListener('click', () => startGame('both'));

window.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (e.key === 'Enter') {
            returnToMenu();
        }
        return;
    }

    if (e.key === 'Backspace') {
        typingBuffer = typingBuffer.slice(0, -1);
    } else if (e.key === 'Enter') {
        let destroyed = false;
        let targetKanaIndex = -1;
        let lowestY = -1;

        for (let i = 0; i < fallingKana.length; i++) {
            if (fallingKana[i].romaji === typingBuffer) {
                if (fallingKana[i].y > lowestY) {
                    lowestY = fallingKana[i].y;
                    targetKanaIndex = i;
                }
            }
        }
        
        if (targetKanaIndex !== -1) {
            fallingKana.splice(targetKanaIndex, 1);
            score += 10;
            destroyed = true;
        }

        typingBuffer = "";

    } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        typingBuffer += e.key.toLowerCase();
    }
});

// --- Game Flow Functions ---
function startGame(selectedMode) {
    gameMode = selectedMode;
    resetGame();
    
    // Hide start screen and show canvas
    startScreen.style.display = 'none';
    canvas.style.display = 'block';

    // Start the game loop
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function returnToMenu() {
    // Stop the game loop
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;

    // Show start screen and hide canvas
    startScreen.style.display = 'block';
    canvas.style.display = 'none';
}

// --- Main Game Loop ---
function gameLoop(currentTime) {
    // --- Update Logic ---
    if (!gameOver) {
        if (currentTime - lastSpawnTime > KANA_SPAWN_RATE) {
            fallingKana.push(new Kana());
            lastSpawnTime = currentTime;
        }
        for (let i = fallingKana.length - 1; i >= 0; i--) {
            fallingKana[i].update();
            if (fallingKana[i].y > HEIGHT + 50) {
                escapes++;
                escapedKana.push(fallingKana[i].character);
                fallingKana.splice(i, 1);
            }
        }
        if (escapes >= MAX_ESCAPES) gameOver = true;
    }
    
    // --- Drawing Logic ---
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);
    fallingKana.forEach(kana => kana.draw());
    
    ctx.font = "56px NotoSansJP";
    ctx.fillStyle = colors.PLAYER_BLUE;
    ctx.textAlign = "center";
    ctx.fillText("V", WIDTH / 2, HEIGHT - 30);

    ctx.font = "26px NotoSansJP";
    ctx.fillStyle = colors.NEON_CYAN;
    ctx.textAlign = "left";
    ctx.fillText(typingBuffer, 12, HEIGHT - 12);
    
    ctx.fillText(`Score: ${score}`, 12, 44);
    let modeText = gameMode.charAt(0).toUpperCase() + gameMode.slice(1); // Capitalize
    ctx.fillText(`Mode: ${modeText}`, 12, 76);

    ctx.textAlign = "right";
    ctx.fillStyle = colors.PASTEL_PINK;
    ctx.fillText(`Escapes: ${escapes}/${MAX_ESCAPES}`, WIDTH - 12, 44);
    
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.font = "84px NotoSansJP";
        ctx.fillStyle = colors.NEON_MAGENTA;
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 80);
        ctx.font = "26px NotoSansJP";
        ctx.fillStyle = colors.WHITE;
        ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2);
        const missedText = `Missed: ${escapedKana.slice(-10).join(', ')}`;
        ctx.fillStyle = colors.PASTEL_PINK;
        ctx.fillText(missedText, WIDTH / 2, HEIGHT / 2 + 50);
        ctx.font = "26px NotoSansJP";
        ctx.fillStyle = colors.GRAY;
        ctx.fillText("Press Enter to Return to Menu", WIDTH / 2, HEIGHT / 2 + 120);
    }
    
    // Keep the loop going
    if (!gameOver) {
       animationFrameId = requestAnimationFrame(gameLoop);
    }
}