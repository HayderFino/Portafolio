document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio Loaded v1.1");

    // Easter Egg: Activate 3D Canvas with ?canvas in URL
    const urlParams = new URLSearchParams(window.location.search);
    const canvas = document.getElementById('bg-canvas');
    
    if (urlParams.has('canvas')) {
        if (canvas) {
            canvas.style.setProperty('display', 'block', 'important');
            console.log("⚡ 3D Engine Activated (Easter Egg)");
        }
    }

    // 3D Tilt for cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
            }
        });
    });
});
