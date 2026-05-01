const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-canvas'),
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 15;

const isMobile = window.innerWidth < 768;

// Sphere
const sphereSize = isMobile ? 1.2 : 2;
const sphereGeom = new THREE.SphereGeometry(sphereSize, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x00f2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.15
});
const sphere = new THREE.Mesh(sphereGeom, sphereMat);
if (isMobile) sphere.position.y = 4;
scene.add(sphere);

// Hybrid Sync (Broadcast + Storage)
const tabId = Math.random().toString(36).substr(2, 9);
const otherTabs = new Map();
const lightningGroups = new Map();

const getScreenPos = () => ({
    id: tabId,
    centerX: (window.screenLeft ?? window.screenX ?? 0) + (window.innerWidth / 2),
    centerY: (window.screenTop ?? window.screenY ?? 0) + (window.innerHeight / 2),
    time: Date.now()
});

const broadcast = (data) => {
    try {
        const bc = new BroadcastChannel('portfolio_sync');
        bc.postMessage(data);
        bc.close();
    } catch(e) {}
    localStorage.setItem('portfolio_sync_data', JSON.stringify(data));
};

// Listener
try {
    const bc = new BroadcastChannel('portfolio_sync');
    bc.onmessage = (e) => {
        if (e.data && e.data.id !== tabId) {
            otherTabs.set(e.data.id, { ...e.data, lastUpdate: Date.now() });
        }
    };
} catch(e) {}

window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_sync_data' && e.newValue) {
        const data = JSON.parse(e.newValue);
        if (data.id !== tabId) {
            otherTabs.set(data.id, { ...data, lastUpdate: Date.now() });
        }
    }
});

const boltMat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 1 });

const createBoltPoints = (dx, dy, segments = 20) => {
    const points = [];
    const startY = isMobile ? 4 : 0;
    points.push(new THREE.Vector3(0, startY, 0));
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const jitter = 1.5;
        points.push(new THREE.Vector3(
            dx * t + (Math.random() - 0.5) * jitter,
            startY + dy * t + (Math.random() - 0.5) * jitter,
            (Math.random() - 0.5) * jitter
        ));
    }
    points.push(new THREE.Vector3(dx, dy, 0));
    return points;
};

setInterval(() => {
    if (!isMobile) broadcast(getScreenPos());
}, 100);

const animate = () => {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.005;
    
    if (!isMobile) {
        const myPos = getScreenPos();
        sphere.material.opacity = otherTabs.size > 0 ? 0.5 : 0.15;
        const now = Date.now();

        otherTabs.forEach((data, id) => {
            if (now - data.lastUpdate > 2000) {
                if (lightningGroups.has(id)) {
                    scene.remove(lightningGroups.get(id));
                    lightningGroups.delete(id);
                }
                otherTabs.delete(id);
                return;
            }

            let group = lightningGroups.get(id);
            if (!group) {
                group = new THREE.Group();
                lightningGroups.set(id, group);
                scene.add(group);
            }

            const scale = 0.05; 
            const dx = (data.centerX - myPos.centerX) * scale;
            const dy = -(data.centerY - myPos.centerY) * scale;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist > 0.1) {
                const targetCount = Math.floor(Math.max(3, 15 - dist * 0.5));
                while (group.children.length < targetCount) group.add(new THREE.Line(new THREE.BufferGeometry(), boltMat.clone()));
                while (group.children.length > targetCount) group.remove(group.children[group.children.length - 1]);

                group.children.forEach((line) => {
                    line.geometry.setFromPoints(createBoltPoints(dx, dy));
                    line.geometry.attributes.position.needsUpdate = true;
                    line.material.opacity = Math.random() > 0.1 ? 1 : 0.1;
                });
            }
        });
    }
    renderer.render(scene, camera);
};

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
