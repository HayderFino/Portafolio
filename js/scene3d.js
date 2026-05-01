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
const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.15 });
const sphere = new THREE.Mesh(sphereGeom, sphereMat);
scene.add(sphere);

// Communication
const tabId = Math.random().toString(36).substr(2, 9);
const otherTabs = new Map();
const lightningGroups = new Map();

const getPos = () => ({
    id: tabId,
    x: (window.screenLeft ?? window.screenX) + (window.innerWidth / 2),
    y: (window.screenTop ?? window.screenY) + (window.innerHeight / 2),
    t: Date.now()
});

// Use multiple methods for reliability
const bc = new BroadcastChannel('p_sync');
bc.onmessage = (e) => {
    if (e.data && e.data.id !== tabId) otherTabs.set(e.data.id, { ...e.data, last: Date.now() });
};

window.addEventListener('storage', (e) => {
    if (e.key === 'p_sync_data' && e.newValue) {
        const d = JSON.parse(e.newValue);
        if (d.id !== tabId) otherTabs.set(d.id, { ...d, last: Date.now() });
    }
});

setInterval(() => {
    const p = getPos();
    bc.postMessage(p);
    localStorage.setItem('p_sync_data', JSON.stringify(p));
    
    // Cleanup
    const now = Date.now();
    for (const [id, d] of otherTabs.entries()) {
        if (now - d.last > 2000) {
            if (lightningGroups.has(id)) { scene.remove(lightningGroups.get(id)); lightningGroups.delete(id); }
            otherTabs.delete(id);
        }
    }
}, 100);

// Rendering
const boltMat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 1 });
const createBolt = (dx, dy) => {
    const pts = [new THREE.Vector3(0,0,0)];
    for(let i=1; i<15; i++) {
        const t = i/15;
        pts.push(new THREE.Vector3(dx*t + (Math.random()-0.5)*1.5, dy*t + (Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5));
    }
    pts.push(new THREE.Vector3(dx, dy, 0));
    return pts;
};

const animate = () => {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.005;
    const my = getPos();
    
    otherTabs.forEach((d, id) => {
        let g = lightningGroups.get(id);
        if(!g) { g = new THREE.Group(); lightningGroups.set(id, g); scene.add(g); }
        
        const sc = 0.05;
        const dx = (d.x - my.x) * sc;
        const dy = -(d.y - my.y) * sc;
        
        const count = 5;
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
