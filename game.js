const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelTitle = document.getElementById("level-title");

// Klavye Tuş Durumları
const keys = { w: false, a: false, s: false, d: false, space: false };

window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === " ") keys.space = true;
    if (keys.hasOwnProperty(k)) keys[k] = true;
});

window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === " ") keys.space = false;
    if (keys.hasOwnProperty(k)) keys[k] = false;
});

// HARİTA VE ZORLU BÖLÜM TANIMLARI
const levels = [
    {
        name: "1. Bölüm - Sahil Kenarı",
        bgColor: "#87CEEB",
        groundColor: "#E6C280",
        finishX: 2300,
        platforms: [
            { x: 0, y: 400, w: 600, h: 100 },
            { x: 700, y: 350, w: 400, h: 150 },
            { x: 1200, y: 420, w: 500, h: 80 },
            { x: 1800, y: 380, w: 600, h: 120 }
        ],
        hazards: [
            { x: 850, y: 330, w: 60, h: 20 },
            { x: 1400, y: 400, w: 80, h: 20 }
        ]
    },
    {
        name: "2. Bölüm - Fabrika",
        bgColor: "#333344",
        groundColor: "#777788",
        finishX: 2500,
        platforms: [
            { x: 0, y: 400, w: 500, h: 100 },
            { x: 600, y: 300, w: 300, h: 200 },
            { x: 1000, y: 450, w: 600, h: 50 },
            { x: 1700, y: 350, w: 900, h: 150 }
        ],
        hazards: [
            { x: 700, y: 280, w: 50, h: 20 },
            { x: 1200, y: 430, w: 100, h: 20 },
            { x: 1950, y: 330, w: 80, h: 20 }
        ]
    },
    {
        name: "3. Bölüm - Yer Altı (Mağara Girişi)",
        bgColor: "#1a0f07",
        groundColor: "#5c3a21",
        finishX: 2600,
        platforms: [
            { x: 0, y: 420, w: 500, h: 80 },
            { x: 600, y: 380, w: 400, h: 120 },
            { x: 1100, y: 320, w: 400, h: 180 },
            { x: 1600, y: 400, w: 1100, h: 100 }
        ],
        hazards: [
            { x: 750, y: 360, w: 80, h: 20 },
            { x: 1250, y: 300, w: 100, h: 20 },
            { x: 1800, y: 380, w: 120, h: 20 }
        ]
    },
    {
        name: "4. Bölüm - Yer Altı Derinlikleri",
        bgColor: "#0d0d1a",
        groundColor: "#3a215c",
        finishX: 2900,
        platforms: [
            { x: 0, y: 400, w: 400, h: 100 },
            { x: 500, y: 320, w: 300, h: 180 },
            { x: 900, y: 420, w: 500, h: 80 },
            { x: 1500, y: 300, w: 400, h: 200 },
            { x: 2000, y: 380, w: 1000, h: 120 }
        ],
        hazards: [
            { x: 600, y: 300, w: 80, h: 20 },
            { x: 1100, y: 400, w: 120, h: 20 },
            { x: 1650, y: 280, w: 100, h: 20 },
            { x: 2200, y: 360, w: 150, h: 20 }
        ]
    }
];

let currentLevelIndex = 0;
let currentLevel = levels[currentLevelIndex];

// YAVAŞLATILMIŞ MOTOR VE FİZİK DEĞERLERİ
const bike = {
    x: 100, y: 300, vx: 0, vy: 0, angle: 0, angularVelocity: 0,
    speed: 0.15,         // Gaz gücü düşürüldü (Eski değer: 0.4)
    maxSpeed: 4,         // Maksimum hız sınırı eklendi
    brake: 0.8,          // Frenleme
    jumpForce: -6,       // Zıplama yüksekliği
    gravity: 0.25,       // Yerçekimi hafifçe yumuşatıldı
    friction: 0.96,      // Sürtünme artırıldı (daha çabuk yavaşlar)
    isGrounded: false,
    reset: function() {
        this.x = 100; this.y = 300; this.vx = 0; this.vy = 0;
        this.angle = 0; this.angularVelocity = 0; this.isGrounded = false;
    }
};

let cameraX = 0;

function update() {
    // 1. D Tuşu: İleri Gitme (Maksimum hız sınırıyla)
    if (keys.d) {
        bike.vx += bike.speed;
        if (bike.vx > bike.maxSpeed) bike.vx = bike.maxSpeed;
    }

    // 2. A Tuşu: Fren
    if (keys.a) {
        if (bike.vx > 0) bike.vx *= bike.brake;
        else bike.vx = 0;
    }

    // 3. W Tuşu: Ön Kaldırma (Yavaşlatıldı)
    if (keys.w) bike.angularVelocity -= 0.02;

    // 4. S Tuşu: Arka Kaldırma (Yavaşlatıldı)
    if (keys.s) bike.angularVelocity += 0.02;

    // 5. Space Tuşu: Zıplama
    if (keys.space && bike.isGrounded) {
        bike.vy = bike.jumpForce;
        bike.isGrounded = false;
    }

    // Fizik
    bike.vy += bike.gravity;
    bike.vx *= bike.friction;
    bike.angularVelocity *= 0.85;

    bike.x += bike.vx;
    bike.y += bike.vy;
    bike.angle += bike.angularVelocity;

    // Zemin Çarpışmaları
    bike.isGrounded = false;
    for (let p of currentLevel.platforms) {
        if (bike.x > p.x && bike.x < p.x + p.w && bike.y + 15 > p.y && bike.y - 15 < p.y + p.h) {
            bike.y = p.y - 15;
            bike.vy = 0;
            bike.angle *= 0.8;
            bike.isGrounded = true;
        }
    }

    // Engeller
    if (currentLevel.hazards) {
        for (let h of currentLevel.hazards) {
            if (bike.x > h.x && bike.x < h.x + h.w && bike.y + 15 > h.y && bike.y - 15 < h.y + h.h) {
                bike.reset();
            }
        }
    }

    // Kafa Üstü Düşme
    const normalizedAngle = Math.abs(bike.angle % (Math.PI * 2));
    if (normalizedAngle > Math.PI * 0.6 && bike.vy === 0) {
        bike.reset();
    }

    // Düşme
    if (bike.y > canvas.height + 100) bike.reset();

    // Bitiş
    if (bike.x >= currentLevel.finishX) {
        currentLevelIndex++;
        if (currentLevelIndex >= levels.length) {
            alert("Tebrikler! Bütün bölümleri başardın!");
            currentLevelIndex = 0;
        }
        currentLevel = levels[currentLevelIndex];
        levelTitle.innerText = currentLevel.name;
        bike.reset();
    }

    cameraX = bike.x - 200;
}

function draw() {
    canvas.style.backgroundColor = currentLevel.bgColor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Zemin
    ctx.fillStyle = currentLevel.groundColor;
    for (let p of currentLevel.platforms) {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Dikenler
    if (currentLevel.hazards) {
        ctx.fillStyle = "red";
        for (let h of currentLevel.hazards) {
            ctx.fillRect(h.x, h.y, h.w, h.h);
            ctx.strokeStyle = "darkred";
            ctx.strokeRect(h.x, h.y, h.w, h.h);
        }
    }

    // Bitiş
    ctx.fillStyle = "gold";
    ctx.fillRect(currentLevel.finishX, 250, 20, 150);

    // Motor
    ctx.save();
    ctx.translate(bike.x, bike.y);
    ctx.rotate(bike.angle);

    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(-20, -10, 40, 15);

    ctx.fillStyle = "#f39c12";
    ctx.beginPath();
    ctx.arc(0, -18, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(-18, 10, 8, 0, Math.PI * 2);
    ctx.arc(18, 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

levelTitle.innerText = currentLevel.name;
gameLoop();