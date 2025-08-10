document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    let gameState = 'menu'; // 'menu', 'playing', 'gameover'
    let lastTime = 0;
    
    // Asset loading
    const backgroundImage = new Image();
    backgroundImage.src = 'background.png';

    const font = new FontFace('NotoSansJP', 'url(NotoSansJP-Regular.ttf)');
    document.fonts.add(font);
    font.load().then(() => {
        // Start the game loop only after assets are ready
        backgroundImage.onload = () => {
            requestAnimationFrame(gameLoop);
        };
    }).catch(err => console.error('Font loading failed:', err));


    // --- FONT DEFINITIONS ---
    const UI_FONT = "26px NotoSansJP";
    const KANA_FONT = "64px NotoSansJP";
    const BIG_FONT = "84px NotoSansJP";
    const SHIP_FONT = "56px NotoSansJP";
    const SMALL_UI_FONT = "20px NotoSansJP";

    // --- KANA DATA ---
    const BASIC_KANA = [
        ["a","あ","ア"],["i","い","イ"],["u","う","ウ"],["e","え","エ"],["o","お","オ"],
        ["ka","か","カ"],["ki","き","キ"],["ku","く","ク"],["ke","け","ケ"],["ko","こ","コ"],
        ["sa","さ","サ"],["shi","し","シ"],["su","す","ス"],["se","せ","セ"],["so","そ","ソ"],
        ["ta","た","タ"],["chi","ち","チ"],["tsu","つ","ツ"],["te","て","テ"],["to","と","ト"],
        ["na","な","ナ"],["ni","に","ニ"],["nu","ぬ","ヌ"],["ne","ね","ネ"],["no","の","ノ"],
        ["ha","は","ハ"],["hi","ひ","ヒ"],["fu","ふ","フ"],["he","へ","ヘ"],["ho","ほ","ホ"],
        ["ma","ま","マ"],["mi","み","ミ"],["mu","む","ム"],["me","め","メ"],["mo","も","モ"],
        ["ya","や","ヤ"],["yu","ゆ","ユ"],["yo","よ","ヨ"],
        ["ra","ら","ラ"],["ri","り","リ"],["ru","る","ル"],["re","れ","レ"],["ro","ろ","ロ"],
        ["wa","わ","ワ"],["wo","を","ヲ"],["n","ん","ン"]
    ];
    const DAKUTEN_KANA = [
        ["ga","が","ガ"],["gi","ぎ","ギ"],["gu","ぐ","グ"],["ge","げ","ゲ"],["go","ご","ゴ"],
        ["za","ざ","ザ"],["ji","じ","ジ"],["zu","ず","ズ"],["ze","ぜ","ゼ"],["zo","ぞ","ゾ"],
        ["da","だ","ダ"],["ji","ぢ","ヂ"],["zu","づ","ヅ"],["de","で","デ"],["do","ど","ド"],
        ["ba","ば","バ"],["bi","び","ビ"],["bu","ぶ","ブ"],["be","べ","ベ"],["bo","ぼ","ボ"],
        ["pa","ぱ","パ"],["pi","ぴ","ピ"],["pu","ぷ","プ"],["pe","ぺ","ペ"],["po","ぽ","ポ"]
    ];
    const COMBINATION_KANA = [
        ["kya","きゃ","キャ"],["kyu","きゅ","キュ"],["kyo","きょ","キョ"],
        ["sha","しゃ","シャ"],["shu","しゅ","シュ"],["sho","しょ","ショ"],
        ["cha","ちゃ","チャ"],["chu","ちゅ","チュ"],["cho","ちょ","チョ"],
        ["nya","にゃ","ニャ"],["nyu","にゅ","ニュ"],["nyo","にょ","ニョ"],
        ["hya","ひゃ","ヒャ"],["hyu","ひゅ","ヒュ"],["hyo","ひょ","ヒョ"],
        ["mya","みゃ","ミャ"],["myu","みゅ","ミュ"],["myo","みょ","ミョ"],
        ["rya","りゃ","リャ"],["ryu","りゅ","リュ"],["ryo","りょ","リョ"],
        ["gya","ぎゃ","ギャ"],["gyu","ぎゅ","ギュ"],["gyo","ぎょ","ギョ"],
        ["ja","じゃ","ジャ"],["ju","じゅ","ジュ"],["jo","じょ","ジョ"],
        ["bya","びゃ","ビャ"],["byu","びゅ","ビュ"],["byo","びょ","ビョ"],
        ["pya","ぴゃ","パ"],["pyu","ぴゅ","ピュ"],["pyo","ぴょ","ピョ"]
    ];

    // --- GAMEPLAY CONSTANTS ---
    const START_MAX_ON_SCREEN = 3;
    const MAX_ON_SCREEN_CAP = 5;
    const START_SPEED = 60.0;
    const SPEED_CAP = 200.0; // Increased for more challenge
    const SCORE_PER = 10;
    const MAX_ESCAPES = 3;
    const DIFFICULTY_STEPS = [
        { score: 0, max: START_MAX_ON_SCREEN, speed: START_SPEED, spawn: 1.5 },
        { score: 300, max: 3, speed: 80.0, spawn: 1.2 },
        { score: 700, max: 4, speed: 130.0, spawn: 0.9 },
        { score: 1200, max: 5, speed: 170.0, spawn: 0.7 },
        { score: 1800, max: 5, speed: SPEED_CAP, spawn: 0.55 }
    ];

    // --- COLOR LIBRARY ---
    const colors = {
        DEEP_PURPLE: "rgb(59, 8, 85)",      
        PURPLE_MAGENTA: "rgb(133, 36, 103)", 
        PASTEL_PINK: "rgb(253, 128, 131)",   
        NEON_MAGENTA: "rgb(238, 34, 125)",   
        TEAL_BLUE: "rgb(73, 128, 153)",       
        NEON_CYAN: "rgb(48, 192, 183)",        
        WHITE: "rgb(255, 255, 255)",
        BLACK: "rgb(0, 0, 0)",
        LIGHT_CYAN: "rgb(230, 255, 255)",
        AQUA_GLOW: "rgba(180, 240, 240, 0.7)",
        GRAY: "rgb(200, 200, 200)"
    };
    const SYNTHWAVE_COLORS = [colors.PASTEL_PINK, colors.NEON_MAGENTA, colors.TEAL_BLUE, colors.NEON_CYAN];
    const STAR_COLORS = [colors.PASTEL_PINK, colors.NEON_MAGENTA, colors.TEAL_BLUE, colors.NEON_CYAN];

    // --- STARFIELD ---
    const NUM_STARS = 140;
    let stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            spd: Math.random() * 150 + 30,
            sz: Math.random() > 0.3 ? 1 : 2,
            color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
        });
    }

    function drawStarfield(dt) {
        stars.forEach(s => {
            s.y += s.spd * dt;
            if (s.y > HEIGHT) {
                s.y = -2;
                s.x = Math.random() * WIDTH;
            }
            if (s.sz === 1) {
                ctx.fillStyle = s.color;
                ctx.fillRect(s.x, s.y, 2, 2);
            } else {
                let gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 3);
                const rgb = s.color.substring(4, s.color.length-1).replace(/ /g, '');
                gradient.addColorStop(0, `rgba(${rgb},0.6)`);
                gradient.addColorStop(1, `rgba(${rgb},0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
            }
        });
    }
    
    // --- UTILITY FUNCTIONS ---
    function drawRoundedRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // --- ENTITY CLASSES ---
    class KanaEnemy {
        constructor(romaji, glyph, x, y, speed) {
            this.romaji = romaji;
            this.glyph = glyph;
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.hit = false;
            this.color = SYNTHWAVE_COLORS[Math.floor(Math.random() * SYNTHWAVE_COLORS.length)];
        }
        update(dt) { this.y += this.speed * dt; }
        draw() {
            ctx.font = KANA_FONT;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.glyph, this.x, this.y);
        }
    }

    class Bullet {
        constructor(x, y, target) {
            this.x = x;
            this.y = y;
            this.speed = 680;
            this.target = target;
            this.active = true;
        }
        update(dt, explosions) {
            this.y -= this.speed * dt;
            if (this.target && !this.target.hit && this.y <= this.target.y) {
                this.active = false;
                this.target.hit = true;
                explosions.push(new Explosion(this.target.x, this.target.y, this.target.color));
            }
             if (this.y < 0) this.active = false;
        }
        draw() {
            // Glow
            ctx.fillStyle = colors.AQUA_GLOW;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
            // Core bullet
            ctx.fillStyle = colors.LIGHT_CYAN;
            ctx.fillRect(this.x - 2, this.y - 7, 4, 14);
        }
    }

    class Explosion {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.timer = 0.28;
            this.max_r = 36;
        }
        update(dt) { this.timer -= dt; }
        get done() { return this.timer <= 0; }
        draw() {
            const ratio = 1 - Math.max(0, this.timer) / 0.28;
            
            // Outer glow
            const r_big = this.max_r * (0.8 + ratio * 0.6);
            const a = 1 - ratio;
            const rgb = this.color.substring(4, this.color.length - 1).replace(/ /g, '');
            let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r_big);
            gradient.addColorStop(0, `rgba(${rgb},${a * 0.8})`);
            gradient.addColorStop(1, `rgba(${rgb},0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r_big, 0, Math.PI * 2);
            ctx.fill();

            // Inner flash
            const flash_r = 8 + 18 * ratio;
            ctx.fillStyle = colors.WHITE;
            ctx.beginPath();
            ctx.arc(this.x, this.y, flash_r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // --- GAME STATE VARIABLES ---
    let score, escapes, escaped_kana, enemies, bullets, explosions;
    let input_buffer, spawn_timer, ship_x, escape_text, escape_timer;
    let selected_kana, ROMAJI_TO_HIRAGANA, ROMAJI_TO_KATAKANA, ALL_ROMAJI;

    // --- GAME LOGIC ---
    let menuState = {
        kana_categories: { "Basic": true, "Ha/Dakuten": false, "Combinations": false },
        game_mode_index: 0, // 0: Hiragana, 1: Katakana, 2: Both
        game_modes: ["Hiragana", "Katakana", "Both"],
        buttons: {
            mode: { x: WIDTH/2 - 150, y: 250, w: 300, h: 50 },
            cats: [
                { x: WIDTH/2 - 120, y: 330, w: 240, h: 40, label: "Basic" },
                { x: WIDTH/2 - 120, y: 380, w: 240, h: 40, label: "Ha/Dakuten" },
                { x: WIDTH/2 - 120, y: 430, w: 240, h: 40, label: "Combinations" }
            ],
            play: { x: WIDTH/2 - 60, y: 500, w: 120, h: 50 }
        }
    };

    function getDifficulty(score) {
        let diff = { ...DIFFICULTY_STEPS[0] };
        for (const step of DIFFICULTY_STEPS) {
            if (score >= step.score) {
                diff = { ...step };
            }
        }
        diff.max = Math.min(diff.max, MAX_ON_SCREEN_CAP);
        diff.speed = Math.min(diff.speed, SPEED_CAP);
        return diff;
    }

    function resetGame() {
        // Build selected Kana lists based on menu choices
        selected_kana = [];
        if (menuState.kana_categories["Basic"]) selected_kana.push(...BASIC_KANA);
        if (menuState.kana_categories["Ha/Dakuten"]) selected_kana.push(...DAKUTEN_KANA);
        if (menuState.kana_categories["Combinations"]) selected_kana.push(...COMBINATION_KANA);
        
        ROMAJI_TO_HIRAGANA = Object.fromEntries(selected_kana.map(([r,h,k]) => [r,h]));
        ROMAJI_TO_KATAKANA = Object.fromEntries(selected_kana.map(([r,h,k]) => [r,k]));
        ALL_ROMAJI = Object.keys(ROMAJI_TO_HIRAGANA);

        score = 0;
        escapes = 0;
        escaped_kana = [];
        enemies = [];
        bullets = [];
        explosions = [];
        input_buffer = "";
        spawn_timer = 0.0;
        ship_x = WIDTH / 2;
        escape_text = "";
        escape_timer = 0.0;
    }

    function handleMenuClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Mode button
        const mb = menuState.buttons.mode;
        if (x > mb.x && x < mb.x + mb.w && y > mb.y && y < mb.y + mb.h) {
            menuState.game_mode_index = (menuState.game_mode_index + 1) % menuState.game_modes.length;
        }

        // Category checkboxes
        menuState.buttons.cats.forEach(cb => {
            if (x > cb.x && x < cb.x + cb.w && y > cb.y && y < cb.y + cb.h) {
                menuState.kana_categories[cb.label] = !menuState.kana_categories[cb.label];
            }
        });
        
        // Play button
        const pb = menuState.buttons.play;
        if (x > pb.x && x < pb.x + pb.w && y > pb.y && y < pb.y + pb.h) {
            // Check if at least one category is selected
            if (Object.values(menuState.kana_categories).some(v => v)) {
                resetGame();
                gameState = 'playing';
            }
        }
    }
    
    function handleKeyDown(event) {
        if (gameState === 'playing') {
            if (event.key === 'Backspace') {
                input_buffer = input_buffer.slice(0, -1);
            } else if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
                input_buffer += event.key.toLowerCase();
                // Check for match
                let matchFound = false;
                for (const e of enemies) {
                    if (e.romaji === input_buffer && !e.hit) {
                        ship_x = e.x;
                        bullets.push(new Bullet(ship_x, HEIGHT - 80, e));
                        input_buffer = "";
                        score += SCORE_PER;
                        matchFound = true;
                        break;
                    }
                }
                // Word-break logic
                if (!matchFound && input_buffer && !ALL_ROMAJI.some(r => r.startsWith(input_buffer))) {
                    input_buffer = "";
                }
            }
        } else if (gameState === 'gameover') {
            if (event.key.toLowerCase() === 'r') {
                resetGame();
                gameState = 'playing';
            } else if (event.key.toLowerCase() === 'q') {
                gameState = 'menu';
            }
        }
    }
    
    canvas.addEventListener('mousedown', handleMenuClick);
    window.addEventListener('keydown', handleKeyDown);

    // --- MAIN LOOPS ---
    function drawMenu(dt) {
        ctx.drawImage(backgroundImage, 0, 0);
        drawStarfield(dt);

        ctx.textAlign = 'center';
        ctx.font = BIG_FONT;
        ctx.fillStyle = colors.PASTEL_PINK;
        ctx.fillText("Kana Blaster", WIDTH / 2, 120);

        // Draw mode button
        const mb = menuState.buttons.mode;
        ctx.fillStyle = colors.PURPLE_MAGENTA;
        drawRoundedRect(mb.x, mb.y, mb.w, mb.h, 15);
        ctx.fill();
        ctx.strokeStyle = colors.WHITE;
        ctx.lineWidth = 2;
        drawRoundedRect(mb.x, mb.y, mb.w, mb.h, 15);
        ctx.stroke();

        const mode_text = menuState.game_modes[menuState.game_mode_index];
        let mode_color = colors.WHITE;
        if (mode_text === "Hiragana") mode_color = colors.NEON_CYAN;
        if (mode_text === "Katakana") mode_color = colors.NEON_MAGENTA;
        
        ctx.font = SMALL_UI_FONT;
        ctx.fillStyle = mode_color;
        ctx.fillText(`Mode: ${mode_text}`, WIDTH / 2, mb.y + 30);

        // Draw category checkboxes
        menuState.buttons.cats.forEach(cb => {
            ctx.fillStyle = colors.PURPLE_MAGENTA;
            drawRoundedRect(cb.x, cb.y, cb.w, cb.h, 15);
            ctx.fill();
            ctx.strokeStyle = colors.WHITE;
            drawRoundedRect(cb.x, cb.y, cb.w, cb.h, 15);
            ctx.stroke();
            
            ctx.fillStyle = colors.WHITE;
            ctx.textAlign = 'left';
            ctx.fillText(cb.label, cb.x + 40, cb.y + 26);

            if (menuState.kana_categories[cb.label]) {
                ctx.strokeStyle = colors.NEON_CYAN;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(cb.x + 10, cb.y + 20);
                ctx.lineTo(cb.x + 20, cb.y + 30);
                ctx.lineTo(cb.x + 30, cb.y + 10);
                ctx.stroke();
            }
        });

        // Draw play button
        const pb = menuState.buttons.play;
        ctx.fillStyle = colors.NEON_CYAN;
        drawRoundedRect(pb.x, pb.y, pb.w, pb.h, 15);
        ctx.fill();
        ctx.font = SMALL_UI_FONT;
        ctx.fillStyle = colors.BLACK;
        ctx.textAlign = 'center';
        ctx.fillText("PLAY", WIDTH/2, pb.y + 32);
    }
    
    function updateAndDrawGame(dt) {
        // --- UPDATE ---
        if (gameState === 'playing') {
            const diff = getDifficulty(score);
            spawn_timer += dt;
            if (spawn_timer >= diff.spawn && enemies.filter(e => !e.hit).length < diff.max) {
                spawn_timer = 0.0;
                if (ALL_ROMAJI.length > 0) {
                    const romaji = ALL_ROMAJI[Math.floor(Math.random() * ALL_ROMAJI.length)];
                    let glyph;
                    const mode = menuState.game_mode_index;
                    if (mode === 0) glyph = ROMAJI_TO_HIRAGANA[romaji];
                    else if (mode === 1) glyph = ROMAJI_TO_KATAKANA[romaji];
                    else glyph = Math.random() > 0.5 ? ROMAJI_TO_HIRAGANA[romaji] : ROMAJI_TO_KATAKANA[romaji];
                    
                    const xPos = Math.random() * (WIDTH - 120) + 60;
                    const yPos = -80 - Math.random() * 120;
                    enemies.push(new KanaEnemy(romaji, glyph, xPos, yPos, diff.speed));
                }
            }

            enemies.forEach(e => e.update(dt));
            bullets.forEach(b => b.update(dt, explosions));
            explosions.forEach(ex => ex.update(dt));

            let remaining_enemies = [];
            enemies.forEach(e => {
                if (e.y >= HEIGHT - 80 && !e.hit) {
                    escapes++;
                    escaped_kana.push(e.romaji.toUpperCase());
                    escape_text = `${e.romaji.toUpperCase()} ESCAPED!`;
                    escape_timer = 1.0;
                } else if(e.hit || e.y < HEIGHT - 79) {
                   if (!e.hit) remaining_enemies.push(e);
                }
            });
            enemies = remaining_enemies;

            bullets = bullets.filter(b => b.active);
            explosions = explosions.filter(ex => !ex.done);

            if (escapes >= MAX_ESCAPES) {
                gameState = 'gameover';
            }
            if (escape_timer > 0) escape_timer -= dt;
        }

        // --- DRAW ---
        ctx.drawImage(backgroundImage, 0, 0);
        drawStarfield(dt);

        enemies.forEach(e => e.draw());
        bullets.forEach(b => b.draw());
        explosions.forEach(ex => ex.draw());

        // Draw Ship
        ctx.font = SHIP_FONT;
        ctx.textAlign = 'center';
        ctx.fillStyle = colors.NEON_CYAN;
        ctx.fillText("人", ship_x, HEIGHT - 60);

        // Draw UI
        ctx.textAlign = 'left';
        ctx.font = UI_FONT;
        ctx.fillStyle = colors.WHITE;
        ctx.fillText(`Score: ${score}`, 12, 32);
        ctx.fillStyle = colors.NEON_CYAN;
        ctx.fillText(`Input: ${input_buffer}`, 12, 64);

        ctx.textAlign = 'right';
        ctx.fillStyle = colors.PASTEL_PINK;
        ctx.fillText(`Escapes: ${escapes}/${MAX_ESCAPES}`, WIDTH - 12, 32);

        if (escape_timer > 0) {
            ctx.textAlign = 'center';
            ctx.font = BIG_FONT;
            ctx.fillStyle = colors.DEEP_PURPLE;
            ctx.fillText(escape_text, WIDTH / 2 + 4, HEIGHT / 2 + 4);
            ctx.fillStyle = colors.PASTEL_PINK;
            ctx.fillText(escape_text, WIDTH / 2, HEIGHT / 2);
        }

        if (gameState === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0,0,WIDTH,HEIGHT);
            
            ctx.textAlign = 'center';
            ctx.font = BIG_FONT;
            ctx.fillStyle = colors.NEON_MAGENTA;
            ctx.fillText("GAME OVER", WIDTH/2, HEIGHT/2 - 80);
            
            ctx.font = UI_FONT;
            ctx.fillStyle = colors.WHITE;
            ctx.fillText(`Final Score: ${score}`, WIDTH/2, HEIGHT/2 + 20);

            const escaped_str = escaped_kana.join(', ');
            ctx.fillStyle = colors.PASTEL_PINK;
            ctx.fillText(`Missed: ${escaped_str}`, WIDTH/2, HEIGHT/2 + 54);
            
            ctx.fillStyle = colors.GRAY;
            ctx.fillText("R = Restart    Q = Quit to Menu", WIDTH/2, HEIGHT/2 + 88);
        }
    }

    function gameLoop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        if (gameState === 'menu') {
            drawMenu(dt);
        } else {
            updateAndDrawGame(dt);
        }

        requestAnimationFrame(gameLoop);
    }
});