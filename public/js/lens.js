const canvas = document.getElementById("lens");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Offscreen canvas for grid
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");

// Grid settings
const grid = {
    size: 196,
    strokeStyle: "rgba(225,225,255,0.25)",
    lineWidth: 2,
    shadowColor: "rgba(255,255,255,0.50)",
    shadowBlur: 16
};

// Draw grid dynamically
function drawGrid() {
    offCanvas.width = window.innerWidth;
    offCanvas.height = window.innerHeight;
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);

    offCtx.fillStyle = "#0e0e0e";
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    offCtx.strokeStyle = grid.strokeStyle;
    offCtx.lineWidth = grid.lineWidth;
    offCtx.shadowColor = grid.shadowColor;
    offCtx.shadowBlur = grid.shadowBlur;

    const cols = Math.ceil(offCanvas.width / grid.size);
    const rows = Math.ceil(offCanvas.height / grid.size);

    for (let x = 0; x <= cols; x++) {
        offCtx.beginPath();
        offCtx.moveTo(x * grid.size, 0);
        offCtx.lineTo(x * grid.size, offCanvas.height);
        offCtx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
        offCtx.beginPath();
        offCtx.moveTo(0, y * grid.size);
        offCtx.lineTo(offCanvas.width, y * grid.size);
        offCtx.stroke();
    }
}

drawGrid();

const texture = new THREE.CanvasTexture(offCanvas);
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.needsUpdate = true;

const uniforms = {
    uTexture: { value: texture },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uDistortion: { value: -0.1 }, // main radial distortion
    uMouse: { value: new THREE.Vector2(0.5, 0.5) } // mouse coords [0,1]
};

const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec2 uResolution;
        uniform float uDistortion;
        uniform vec2 uMouse;
        varying vec2 vUv;

        void main() {
            // Centered coordinates [-1,1]
            vec2 uv = vUv * 2.0 - 1.0;
            float aspect = uResolution.x / uResolution.y;
            vec2 uvAspect = vec2(uv.x * aspect, uv.y);

            // Main radial distortion
            float r = length(uvAspect);
            vec2 mainDistorted = uvAspect + uvAspect * r * r * uDistortion;

            // Subtle mouse-centered distortion
            vec2 mouse = uMouse * 2.0 - 1.0;
            mouse.x *= aspect;
            vec2 dir = mainDistorted - mouse;
            float dist = length(dir);
            float influence = exp(-dist * 8.0); // tight falloff
            vec2 mouseDistorted = mainDistorted + dir * .75 * influence;

            // Chromatic aberration (pre-distortion)
            float chroma = 0.0025 * r;
            vec2 uvR = mouseDistorted + vec2(chroma);
            vec2 uvG = mouseDistorted;
            vec2 uvB = mouseDistorted - vec2(chroma);

            // Undo aspect ratio for sampling
            uvR.x /= aspect;
            uvG.x /= aspect;
            uvB.x /= aspect;

            // Map back to 0-1
            vec2 finalUV_R = (uvR + 1.0) / 2.0;
            vec2 finalUV_G = (uvG + 1.0) / 2.0;
            vec2 finalUV_B = (uvB + 1.0) / 2.0;

            vec3 color;
            color.r = texture2D(uTexture, finalUV_R).r;
            color.g = texture2D(uTexture, finalUV_G).g;
            color.b = texture2D(uTexture, finalUV_B).b;

            gl_FragColor = vec4(color, 1.0);
        }
    `
});

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
plane.frustumCulled = false;
scene.add(plane);

function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Mouse tracking
window.addEventListener("mousemove", (e) => {
    uniforms.uMouse.value.x = e.clientX / window.innerWidth;
    uniforms.uMouse.value.y = 1.0 - e.clientY / window.innerHeight;
});

// Handle resize
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    drawGrid();
    texture.needsUpdate = true;
});
