document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    const cards = document.querySelectorAll('.project-card, .tech-item');

    // 1. Interactive 3D Tilt (Existing)
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                scale: 1.05,
                duration: 0.5,
                ease: 'power2.out'
            });
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });

    // 2. 3D Scroll Reveal (New)
    // We animate elements as they enter the viewport
    const revealTargets = document.querySelectorAll('section, .project-card, .tech-item, .section-title');
    
    revealTargets.forEach(target => {
        gsap.from(target, {
            scrollTrigger: {
                trigger: target,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 100,
            rotateX: -20, // Rotate from 3D space
            z: -100,
            duration: 1.2,
            ease: 'power4.out',
            clearProps: 'all' // Ensure it stays "burned" after animation
        });
    });

    // 3. 3D Parallax on Hero
    gsap.to('.hero-content', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: 200,
        rotateX: 10,
        opacity: 0
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('nav').offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - navHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
});
