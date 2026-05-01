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

// Sphere
const sphereGeom = new THREE.SphereGeometry(2, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x00f2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.15
});
const sphere = new THREE.Mesh(sphereGeom, sphereMat);
scene.add(sphere);

// Cross-Tab Logic
const channel = new BroadcastChannel('portfolio_sync');
const tabId = Math.random().toString(36).substr(2, 9);
const otherTabs = new Map();
const lightningGroups = new Map();

const getScreenPos = () => {
    return {
        id: tabId,
        centerX: window.screenX + (window.innerWidth / 2),
        centerY: window.screenY + (window.innerHeight / 2),
        timestamp: Date.now()
    };
};

const boltMat = new THREE.LineBasicMaterial({ 
    color: 0x00f2ff, 
    transparent: true, 
    opacity: 1,
    linewidth: 4
});

const createBoltPoints = (dx, dy, segments = 20) => {
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const jitter = 1.2;
        const px = dx * t + (Math.random() - 0.5) * jitter;
        const py = dy * t + (Math.random() - 0.5) * jitter;
        const pz = (Math.random() - 0.5) * jitter;
        points.push(new THREE.Vector3(px, py, pz));
    }
    points.push(new THREE.Vector3(dx, dy, 0));
    return points;
};

channel.onmessage = (event) => {
    const data = event.data;
    if (data.id !== tabId) {
        otherTabs.set(data.id, { ...data, lastUpdate: Date.now() });
        // Immediate response for handshake
        if (data.type === 'HELO') {
            channel.postMessage({ ...getScreenPos(), type: 'ACK' });
        }
    }
};

// Initial HELO to find existing tabs
channel.postMessage({ ...getScreenPos(), type: 'HELO' });

setInterval(() => {
    channel.postMessage(getScreenPos());
    const now = Date.now();
    for (const [id, data] of otherTabs.entries()) {
        if (now - data.lastUpdate > 1500) {
            if (lightningGroups.has(id)) {
                scene.remove(lightningGroups.get(id));
                lightningGroups.delete(id);
            }
            otherTabs.delete(id);
        }
    }
}, 50);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const animate = () => {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.005;
    const myPos = getScreenPos();
    
    if (otherTabs.size > 0) {
        sphere.material.opacity = 0.5;
        sphere.scale.set(1.1, 1.1, 1.1);
    } else {
        sphere.material.opacity = 0.15;
        sphere.scale.set(1, 1, 1);
    }

    otherTabs.forEach((data, id) => {
        let group = lightningGroups.get(id);
        if (!group) {
            group = new THREE.Group();
            lightningGroups.set(id, group);
            scene.add(group);
        }

        // Corrected Direction:
        // Screen X increases to the right. 
        // If data.centerX > myPos.centerX, other tab is to the RIGHT.
        // In Three.js, +X is RIGHT. So (data - myPos) is CORRECT.
        // If it was pointing away, it means the coordinate system or scale was confusing.
        // We use a stronger scale to make them cross windows.
        const scale = 0.04; 
        const dx = (data.centerX - myPos.centerX) * scale;
        const dy = -(data.centerY - myPos.centerY) * scale; 
        const dist = Math.sqrt(dx*dx + dy*dy);

        const targetCount = Math.floor(Math.max(3, 20 - dist * 0.5));
        
        while (group.children.length < targetCount) {
            const line = new THREE.Line(new THREE.BufferGeometry(), boltMat.clone());
            group.add(line);
        }
        while (group.children.length > targetCount) {
            group.remove(group.children[group.children.length - 1]);
        }

        group.children.forEach((line) => {
            line.geometry.setFromPoints(createBoltPoints(dx, dy));
            line.geometry.attributes.position.needsUpdate = true;
            line.material.opacity = Math.random() > 0.1 ? 1 : 0.1;
        });
    });

    renderer.render(scene, camera);
};

animate();
