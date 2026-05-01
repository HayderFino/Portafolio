const scene = new THREE.Scene();
// Wider FOV (90) and huge far plane to ensure rays are NEVER clipped
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-canvas'),
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 20; // Move camera further back

// Sphere
const sphereGeom = new THREE.SphereGeometry(2, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.15 });
const sphere = new THREE.Mesh(sphereGeom, sphereMat);
scene.add(sphere);

// Communication
const tabId = Math.random().toString(36).substr(2, 9);
const otherTabs = new Map();
const lightningGroups = new Map();

const getPos = () => {
    // Brave/Shields Bypass: If screenX is blocked (returns 0), we try to at least detect existence
    const sx = window.screenLeft ?? window.screenX ?? 0;
    const sy = window.screenTop ?? window.screenY ?? 0;
    return { id: tabId, x: sx + (window.innerWidth / 2), y: sy + (window.innerHeight / 2), t: Date.now() };
};

const bc = new BroadcastChannel('p_sync');
bc.onmessage = (e) => {
    if (e.data && e.data.id !== tabId) otherTabs.set(e.data.id, { ...e.data, last: Date.now() });
};

setInterval(() => {
    const p = getPos();
    bc.postMessage(p);
    localStorage.setItem('p_sync_data', JSON.stringify(p));
    
    const now = Date.now();
    for (const [id, d] of otherTabs.entries()) {
        if (now - d.last > 2000) {
            if (lightningGroups.has(id)) { scene.remove(lightningGroups.get(id)); lightningGroups.delete(id); }
            otherTabs.delete(id);
        }
    }
}, 50); // Faster sync

const boltMat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 1, linewidth: 2 });
const createBolt = (dx, dy) => {
    const pts = [new THREE.Vector3(0,0,0)];
    const segments = 20;
    for(let i=1; i<segments; i++) {
        const t = i/segments;
        // Jitter that increases with distance
        const jitter = 1.2 + (Math.sqrt(dx*dx + dy*dy) * 0.05);
        pts.push(new THREE.Vector3(
            dx*t + (Math.random()-0.5)*jitter, 
            dy*t + (Math.random()-0.5)*jitter, 
            (Math.random()-0.5)*jitter
        ));
    }
    pts.push(new THREE.Vector3(dx, dy, 0));
    return pts;
};

const animate = () => {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.005;
    const my = getPos();
    
    sphere.material.opacity = otherTabs.size > 0 ? 0.6 : 0.15;

    otherTabs.forEach((d, id) => {
        let g = lightningGroups.get(id);
        if(!g) { g = new THREE.Group(); lightningGroups.set(id, g); scene.add(g); }
        
        // ADJUSTED SCALE: Lower scale (0.03) to keep rays within wider FOV
        const sc = 0.03;
        let dx = (d.x - my.x) * sc;
        let dy = -(d.y - my.y) * sc;
        
        // If Brave blocks coordinates (dx and dy would be 0), create a "seeking" vibration
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
        }

        const count = 6;
        while(g.children.length < count) g.add(new THREE.Line(new THREE.BufferGeometry(), boltMat.clone()));
        while(g.children.length > count) g.remove(g.children[g.children.length-1]);
        
        g.children.forEach(l => {
            l.geometry.setFromPoints(createBolt(dx, dy));
            l.geometry.attributes.position.needsUpdate = true;
            l.material.opacity = Math.random() > 0.1 ? 1 : 0.1;
        });
    });
    renderer.render(scene, camera);
};
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
