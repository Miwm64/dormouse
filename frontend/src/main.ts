import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getData, T_MIN, T_MAX } from './data';

const { lengthX, lengthY, lengthZ, bytes } = getData();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); //фон 0x111111 - чёрный
scene.add(new THREE.AxesHelper(200));

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(lengthX * 2, lengthX * 1.7, lengthZ * 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(lengthX / 2, lengthY / 2, lengthZ / 2);

const texture = new THREE.Data3DTexture(bytes, lengthX, lengthY, lengthZ);
texture.format = THREE.RedFormat;
texture.type = THREE.UnsignedByteType;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter; //THREE.NearestFilter
texture.unpackAlignment = 1;
texture.needsUpdate = true;

const STOPS: [number, string][] = [
  [50,   '#0a1a5c'], // тёмно-синий
  [150,  '#1f4fd8'], // синий
  [250,  '#7b2fbe'], // фиолетовый
  [350,  '#d0103a'], // красный начинается
  [500,  '#ff1f1f'], // красный
  [700,  '#ff5a00'], // красно-оранжевый
  [850,  '#ff9a00'], // оранжевый
  [950,  '#ffd23f'], // жёлтый
  [1000, '#ffffff'], // белый (выше не меняется)
];

function makePalette(): THREE.DataTexture {
  const SIZE = 256;
  const rgba = new Uint8Array(SIZE * 4);
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  for (let i = 0; i < SIZE; i++) {
    const temp = T_MIN + (i / (SIZE - 1)) * (T_MAX - T_MIN);

    let k = 0;
    while (k < STOPS.length - 2 && temp > STOPS[k + 1][0]) k++;
    const [t0, c0] = STOPS[k];
    const [t1, c1] = STOPS[k + 1];

    const f = Math.min(1, Math.max(0, (temp - t0) / (t1 - t0)));
    const a = rgb(c0);
    const b = rgb(c1);
    for (let j = 0; j < 3; j++) rgba[i * 4 + j] = Math.round(a[j] + (b[j] - a[j]) * f);
    rgba[i * 4 + 3] = 255;
  }

  const palette = new THREE.DataTexture(rgba, SIZE, 1, THREE.RGBAFormat);
  palette.minFilter = THREE.LinearFilter;
  palette.magFilter = THREE.LinearFilter;
  palette.needsUpdate = true;
  return palette;
}

const material = new THREE.ShaderMaterial({
  uniforms: {
    uData: { value: texture },
    uPalette: { value: makePalette() },
    uSize: { value: new THREE.Vector3(lengthX, lengthY, lengthZ) },
  },
  vertexShader: /* glsl */ `
    uniform vec3 uSize;
    varying vec3 vCoord;
    void main() {
      // позиция точки на кубе (координата внутри текстуры (0..1))
      vCoord = position / uSize + 0.5;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp sampler3D;
    uniform sampler3D uData;
    uniform sampler2D uPalette;
    varying vec3 vCoord;

    void main() {
      float t = texture(uData, vCoord).r;  // температура 0..1 на шкале -100..1700
      vec3 color = texture(uPalette, vec2((t * 255.0 + 0.5) / 256.0, 0.5)).rgb;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const cube = new THREE.Mesh(new THREE.BoxGeometry(lengthX, lengthY, lengthZ), material);
cube.position.set(lengthX / 2, lengthY / 2, lengthZ / 2);
scene.add(cube);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();