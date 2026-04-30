const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Objects
const geometry = new THREE.BufferGeometry();
const vertices = [];
const count = 1500;

for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    vertices.push(x, y, z);
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

// Material
const material = new THREE.PointsMaterial({
    size: 0.015,
    color: 0x00f2ff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

// Points
const points = new THREE.Points(geometry, material);
scene.add(points);

// Sphere Wireframe - Moved to the right and made smaller
const sphereGeom = new THREE.SphereGeometry(1.5, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x7000ff,
    wireframe: true,
    transparent: true,
    opacity: 0.05 // Even more subtle
});
const sphere = new THREE.Mesh(sphereGeom, sphereMat);
sphere.position.x = 2; // Move to the right
scene.add(sphere);

camera.position.z = 5;

// Mouse Movement
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
const animate = () => {
    requestAnimationFrame(animate);

    points.rotation.y += 0.0008; // Slower rotation
    points.rotation.x += 0.0004;

    sphere.rotation.y -= 0.001;
    sphere.rotation.x -= 0.0005;

    // Parallax effect - Sphere follows mouse but stays more to the right
    const targetX = mouseX * 2 + 2; 
    const targetY = -mouseY * 2;
    
    sphere.position.x += (targetX - sphere.position.x) * 0.05;
    sphere.position.y += (targetY - sphere.position.y) * 0.05;
    
    points.position.x += (mouseX * 1 - points.position.x) * 0.05;
    points.position.y += (-mouseY * 1 - points.position.y) * 0.05;

    renderer.render(scene, camera);
};

animate();
