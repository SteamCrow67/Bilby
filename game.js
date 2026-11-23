(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreSpan = document.getElementById('scoreDisplay');
    const restartBtn = document.getElementById('restartBtn');

    const CANVAS_W = 800;
    const CANVAS_H = 400;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    let bilby = { x: CANVAS_W / 2, y: CANVAS_H - 60, radius: 22, speed: 7 };
    let piranhas = [];
    let score = 0;
    let gameOver = false;
    let gameWin = false;
    let frameId = null;
    let keys = { left: false, right: false };
    let mouseX = null;

    const MAX_PIRANHAS = 12;
    const SPAWN_RATE = 28;
    let spawnCounter = 0;
    const WIN_SCORE = 20;

    function resetGame() {
        gameOver = false;
        gameWin = false;
        score = 0;
        updateScoreDisplay();
        piranhas = [];
        bilby.x = CANVAS_W / 2;
        bilby.y = CANVAS_H - 60;
        keys.left = false;
        keys.right = false;
        mouseX = null;
        spawnCounter = 0;
        if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
        gameLoop();
    }

    function updateScoreDisplay() {
        if(scoreSpan) scoreSpan.textContent = score;
    }

    function spawnPiranha() {
        if (piranhas.length >= MAX_PIRANHAS) return;
        const radius = 14 + Math.random() * 12;
        const x = Math.random() * (CANVAS_W - 2 * radius) + radius;
        const y = -radius * 2;
        const speedY = 1.8 + Math.random() * 2.5;
        const speedX = (Math.random() - 0.5) * 1.2;
        piranhas.push({ x, y, radius, speedY, speedX });
    }

    function update() {
        if (gameOver || gameWin) return;

        if (keys.left) {
            bilby.x = Math.max(bilby.radius, bilby.x - bilby.speed);
            mouseX = null;
        }
        if (keys.right) {
            bilby.x = Math.min(CANVAS_W - bilby.radius, bilby.x + bilby.speed);
            mouseX = null;
        }
        if (mouseX !== null) {
            const targetX = Math.min(CANVAS_W - bilby.radius, Math.max(bilby.radius, mouseX));
            bilby.x += (targetX - bilby.x) * 0.15;
        }

        spawnCounter++;
        if (spawnCounter >= SPAWN_RATE) { spawnPiranha(); spawnCounter = 0; }

        for (let i = piranhas.length - 1; i >= 0; i--) {
            const p = piranhas[i];
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.x - p.radius < 0) { p.x = p.radius; p.speedX *= -0.8; } 
            else if (p.x + p.radius > CANVAS_W) { p.x = CANVAS_W - p.radius; p.speedX *= -0.8; }

            const dx = p.x - bilby.x;
            const dy = p.y - bilby.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < p.radius + bilby.radius) { gameOver = true; break; }

            if (p.y - p.radius > CANVAS_H + 20) {
                piranhas.splice(i, 1);
                score++;
                updateScoreDisplay();
                if (score >= WIN_SCORE) { gameWin = true; break; }
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        const gradient = ctx.createRadialGradient(200, 150, 100, 400, 200, 600);
        gradient.addColorStop(0, '#1d4a5a');
        gradient.addColorStop(0.7, '#0b2b3b');
        gradient.addColorStop(1, '#04151f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Пузырьки
        ctx.fillStyle = 'rgba(200, 235, 255, 0.2)';
        for (let i = 0; i < 12; i++) {
            const bx = (Math.sin(Date.now() / 2000 + i) * 300 + 400);
            const by = (i * 37 + Date.now() / 20) % CANVAS_H;
            ctx.beginPath();
            ctx.arc(bx, by, 4 + i % 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Пираний
        piranhas.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 3;
            // Тело
            ctx.beginPath();
            ctx.ellipse(0, 0, p.radius, p.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#2e3f4e';
            ctx.fill();
            ctx.strokeStyle = '#1a2a33';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Глаза
            ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.arc(-p.radius * 0.4, -p.radius * 0.2, p.radius * 0.25, 0, Math.PI * 2); ctx.fillStyle = '#f0e6d2'; ctx.fill();
            ctx.beginPath(); ctx.arc(-p.radius * 0.45, -p.radius * 0.25, p.radius * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#a00'; ctx.fill();
            ctx.beginPath(); ctx.arc(p.radius * 0.4, -p.radius * 0.2, p.radius * 0.25, 0, Math.PI * 2); ctx.fillStyle = '#f0e6d2'; ctx.fill();
            ctx.beginPath(); ctx.arc(p.radius * 0.45, -p.radius * 0.25, p.radius * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#a00'; ctx.fill();
            // Пасть
            ctx.beginPath(); ctx.arc(0, p.radius * 0.2, p.radius * 0.5, 0.2, Math.PI - 0.2); ctx.lineWidth = 4; ctx.strokeStyle = '#7a2e2e'; ctx.stroke();
            // Зубы
            ctx.fillStyle = '#f0f0f0';
            const toothCount = 5;
            for (let i = 0; i < toothCount; i++) {
                const angle = 0.4 + (i / toothCount) * (Math.PI - 0.8);
                const tx = Math.cos(angle) * p.radius * 0.55;
                const ty = Math.sin(angle) * p.radius * 0.55 + p.radius * 0.2;
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 4, ty - 8); ctx.lineTo(tx + 4, ty - 8); ctx.fill();
            }
            // Плавники
            ctx.beginPath(); ctx.moveTo(-p.radius, -p.radius * 0.3); ctx.lineTo(-p.radius * 1.7, -p.radius * 0.8); ctx.lineTo(-p.radius * 1.7, -p.radius * 0.1); ctx.fillStyle = '#2e3f4e'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(-p.radius, p.radius * 0.3); ctx.lineTo(-p.radius * 1.7, p.radius * 0.8); ctx.lineTo(-p.radius * 1.7, p.radius * 0.1); ctx.fill();
            ctx.restore();
        });

        // Билби
        ctx.save();
        ctx.translate(bilby.x, bilby.y);
        ctx.shadowColor = 'rgba(0, 160, 255, 0.8)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 5;
        // Тело
        ctx.beginPath(); ctx.arc(0, 0, bilby.radius, 0, Math.PI * 2); ctx.fillStyle = '#7ec8e0'; ctx.fill(); ctx.strokeStyle = '#3f8faa'; ctx.lineWidth = 3; ctx.stroke();
        // Глаза
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(-bilby.radius * 0.35, -bilby.radius * 0.15, bilby.radius * 0.25, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.arc(-bilby.radius * 0.4, -bilby.radius * 0.2, bilby.radius * 0.1, 0, Math.PI * 2); ctx.fillStyle = '#1a3a4a'; ctx.fill();
        ctx.beginPath(); ctx.arc(bilby.radius * 0.35, -bilby.radius * 0.15, bilby.radius * 0.25, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.arc(bilby.radius * 0.4, -bilby.radius * 0.2, bilby.radius * 0.1, 0, Math.PI * 2); ctx.fillStyle = '#1a3a4a'; ctx.fill();
        // Улыбка
        ctx.beginPath(); ctx.arc(0, bilby.radius * 0.25, bilby.radius * 0.35, 0.1, Math.PI - 0.1); ctx.lineWidth = 3; ctx.strokeStyle = '#1e4a5e'; ctx.stroke();
        // Плавники
        ctx.beginPath(); ctx.ellipse(-bilby.radius * 0.9, bilby.radius * 0.2, bilby.radius * 0.3, bilby.radius * 0.15, 0.3, 0, Math.PI * 2); ctx.fillStyle = '#5fb0cc'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(bilby.radius * 0.9, bilby.radius * 0.2, bilby.radius * 0.3, bilby.radius * 0.15, -0.3, 0, Math.PI * 2); ctx.fill();
        // Хвост
        ctx.beginPath(); ctx.moveTo(-bilby.radius * 0.8, bilby.radius * 0.6); ctx.lineTo(-bilby.radius * 1.3, bilby.radius * 1.0); ctx.lineTo(-bilby.radius * 0.6, bilby.radius * 0.9); ctx.fillStyle = '#5fb0cc'; ctx.fill();
        ctx.restore();

        // Счёт
        ctx.font = 'bold 24px "Montserrat", sans-serif';
        ctx.fillStyle = '#f9e75c';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillText('Счёт: ' + score, 30, 60);

        // Сообщения
        if (gameOver) {
            ctx.font = 'bold 50px "Montserrat", sans-serif';
            ctx.fillStyle = '#ff5e5e';
            ctx.shadowBlur = 25;
            ctx.fillText('GAME OVER', CANVAS_W / 2 - 190, CANVAS_H / 2);
            ctx.font = '24px "Montserrat", sans-serif';
            ctx.fillStyle = '#ffbaba';
            ctx.fillText('Нажми "Заново"', CANVAS_W / 2 - 100, CANVAS_H / 2 + 70);
        } else if (gameWin) {
            ctx.font = 'bold 50px "Montserrat", sans-serif';
            ctx.fillStyle = '#f9e75c';
            ctx.shadowBlur = 30;
            ctx.fillText('ПОБЕДА!', CANVAS_W / 2 - 130, CANVAS_H / 2);
            ctx.font = '24px "Montserrat", sans-serif';
            ctx.fillStyle = '#b3e0ff';
            ctx.fillText('Ты спас друзей!', CANVAS_W / 2 - 100, CANVAS_H / 2 + 70);
        }
    }

    function gameLoop() {
        update();
        draw();
        if (!gameOver && !gameWin) {
            frameId = requestAnimationFrame(gameLoop);
        } else {
            frameId = null;
        }
    }

    // Управление
    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
            keys.left = true;
            mouseX = null;
            e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
            keys.right = true;
            mouseX = null;
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
            keys.left = false;
            e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
            keys.right = false;
            e.preventDefault();
        }
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        let canvasMouseX = (e.clientX - rect.left) * scaleX;
        canvasMouseX = Math.max(bilby.radius, Math.min(CANVAS_W - bilby.radius, canvasMouseX));
        mouseX = canvasMouseX;
    }

    function handleMouseLeave() {
        mouseX = null;
    }

    // Запуск
    window.addEventListener('load', () => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        restartBtn.addEventListener('click', resetGame);
        resetGame();
    });

    window.addEventListener('beforeunload', () => {
        if (frameId) cancelAnimationFrame(frameId);
    });
})();