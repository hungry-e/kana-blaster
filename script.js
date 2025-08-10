// script.js

// --- Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 720;
const HEIGHT = 900;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const FPS = 60;
const MAX_ESCAPES = 10;
const KANA_SPAWN_RATE = 1000; // in milliseconds

// --- Load Assets ---
const backgroundImage = new Image();
backgroundImage.src = 'background.png'; // Using the uploaded .jpg file

// We need to wait for the font and image to load before starting
Promise.all([
    document.fonts.load('64px NotoSansJP'),
    backgroundImage.onload
]).then(startGame);


// --- Game Data & Colors (similar to Python) ---
const colors = {
    "WHITE": "#FFFFFF",
    "GRAY": "#808080",
    "PASTEL_PINK": "#ffc0cb",
    "NEON_CYAN": "#00FFFF",
    "NEON_MAGENTA": "#FF00FF",
    "PLAYER_BLUE": "#4d9de0"
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
let score;
let escapes;
let gameOver;
let typingBuffer;
let escapedKana;
let fallingKana;
let lastSpawnTime;
let gameMode; // 'hiragana' or 'katakana'

// --- Game Objects (JS Class instead of just a dict) ---
class Kana {
    constructor() {
        const kanaData = BASIC_KANA[Math.floor(Math.random() * BASIC_KANA.length)];
        this.romaji = kanaData.romaji;
        this.character = gameMode === 'hiragana' ? kanaData.hiragana : kanaData.katakana;
        this.x = Math.random() * (WIDTH - 80) + 40;
        this.y = -50;
        this.speed = Math.random() * 1.5 + 1; // Speed between 1 and 2.5
    }

    update() {
        this.y += this.speed;
    }

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
    gameMode = Math.random() < 0.5 ? 'hiragana' : 'katakana';
}


// --- Event Listener for Keyboard Input (replaces pygame.event.get()) ---
window.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (e.key === 'r' || e.key === 'R') {
            resetGame();
        }
        return; // Don't process other keys if game is over
    }

    if (e.key === 'Backspace') {
        typingBuffer = typingBuffer.slice(0, -1);
    } else if (e.key === 'Enter') {
        let destroyed = false;
        // Find the lowest kana on screen that matches the buffer
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
            fallingKana.splice(targetKanaIndex, 1); // Remove the kana
            score += 10;
            destroyed = true;
        }

        if (destroyed) {
            // Potentially switch mode after successful clear
            if (Math.random() < 0.2) { // 20% chance to switch mode
                 gameMode = gameMode === 'hiragana' ? 'katakana' : 'hiragana';
            }
        }
        typingBuffer = ""; // Clear buffer regardless

    } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        typingBuffer += e.key.toLowerCase();
    }
});

// --- Main Game Loop (replaces the `while running:` loop) ---
function gameLoop(currentTime) {
    // --- Update Logic ---
    if (!gameOver) {
        // Spawn new kana
        if (currentTime - lastSpawnTime > KANA_SPAWN_RATE) {
            fallingKana.push(new Kana());
            lastSpawnTime = currentTime;
        }

        // Update and check for escapes
        for (let i = fallingKana.length - 1; i >= 0; i--) {
            fallingKana[i].update();
            if (fallingKana[i].y > HEIGHT + 50) {
                escapes++;
                escapedKana.push(fallingKana[i].character);
                fallingKana.splice(i, 1);
            }
        }
        
        // Check for game over condition
        if (escapes >= MAX_ESCAPES) {
            gameOver = true;
        }
    }
    
    // --- Drawing Logic (replaces all the SCREEN.blit calls) ---
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Draw background
    ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);
    
    // Draw falling kana
    fallingKana.forEach(kana => kana.draw());
    
    // Draw player "ship" and typing buffer
    ctx.font = "56px NotoSansJP";
    ctx.fillStyle = colors.PLAYER_BLUE;
    ctx.textAlign = "center";
    ctx.fillText("V", WIDTH / 2, HEIGHT - 30);

    ctx.font = "26px NotoSansJP";
    ctx.fillStyle = colors.NEON_CYAN;
    ctx.textAlign = "left";
    ctx.fillText(typingBuffer, 12, HEIGHT - 12);
    
    // Draw UI
    ctx.fillText(`Score: ${score}`, 12, 44);
    ctx.fillText(`Mode: ${gameMode.toUpperCase()}`, 12, 76);
    ctx.textAlign = "right";
    ctx.fillStyle = colors.PASTEL_PINK;
    ctx.fillText(`Escapes: ${escapes}/${MAX_ESCAPES}`, WIDTH - 12, 44);
    
    // Draw Game Over screen
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
        
        const missedText = `Missed: ${escapedKana.slice(-10).join(', ')}`; // Show last 10 missed
        ctx.fillStyle = colors.PASTEL_PINK;
        ctx.fillText(missedText, WIDTH / 2, HEIGHT / 2 + 50);

        ctx.font = "26px NotoSansJP";
        ctx.fillStyle = colors.GRAY;
        ctx.fillText("Press 'R' to Restart", WIDTH / 2, HEIGHT / 2 + 120);
    }
    
    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// --- Start the Game ---
function startGame() {
    console.log("Assets loaded, starting game.");
    resetGame();
    // The `requestAnimationFrame` function is the JS equivalent of a game loop.
    // It tells the browser that you wish to perform an animation.
    requestAnimationFrame(gameLoop);
}