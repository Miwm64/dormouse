import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getData, T_MIN, T_MAX } from './data';
import { SHAPES, makeGeometry, type Shape } from './shapes';

const layout = document.createElement('div');
layout.classList.add('layout');

const viewport = document.createElement('div');
viewport.classList.add('viewport');

const sidePanel = document.createElement('aside');
sidePanel.classList.add('side-panel');

layout.append(viewport, sidePanel);
document.body.appendChild(layout);


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); //фон 0x111111 - чёрный
scene.add(new THREE.AxesHelper(200));

//1 - временное, настоящее ставится в ResizeObserver
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Размер холста всегда равен размеру viewport. Срабатывает при запуске,
// при изменении окна и на каждом кадре анимации панели.
new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (width === 0 || height === 0) return;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
}).observe(viewport);

// ---------- Палитра ----------
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


const PALETTE_SIZE = 256;

const PALETTE_RGBA = (() => {
  const rgba = new Uint8Array(PALETTE_SIZE * 4);
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  for (let i = 0; i < PALETTE_SIZE; i++) {
    const temp = T_MIN + (i / (PALETTE_SIZE - 1)) * (T_MAX - T_MIN);

    // две соседние цветовые точки, между которыми лежит temp
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
  return rgba;
})();

function makePalette(): THREE.DataTexture {
  const palette = new THREE.DataTexture(PALETTE_RGBA, PALETTE_SIZE, 1, THREE.RGBAFormat);
  palette.minFilter = THREE.LinearFilter;
  palette.magFilter = THREE.LinearFilter;
  palette.needsUpdate = true;
  return palette;
}

const material = new THREE.ShaderMaterial({
  side: THREE.DoubleSide, // рисуем обе стороны граней, чтобы не зависеть от порядка вершин
  uniforms: {
    uData: { value: null as THREE.Data3DTexture | null },
    uPalette: { value: makePalette() },
    uSize: { value: new THREE.Vector3(1, 1, 1) },
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

const figure = new THREE.Mesh(new THREE.BufferGeometry(), material);
scene.add(figure);

// Боковая панель
const heading = document.createElement('h2');
heading.textContent = 'Фигура';

const shapeList = document.createElement('div');
shapeList.classList.add('shape-list');

sidePanel.append(heading, shapeList);

const buttons = new Map<Shape, HTMLButtonElement>();
for (const { id, label } of SHAPES) {
  const button = document.createElement('button');
  button.textContent = label;
  button.classList.add('control-button');
  button.addEventListener('click', () => setShape(id));
  shapeList.appendChild(button);
  buttons.set(id, button);
}

const toggle = document.createElement('button');
toggle.classList.add('panel-toggle');
toggle.textContent = '☰';
toggle.title = 'Показать / скрыть панель';
toggle.addEventListener('click', () => layout.classList.toggle('collapsed'));
viewport.appendChild(toggle);



let cameraPlaced = false;

function setShape(shape: Shape) {
  for (const [id, button] of buttons) {
    button.classList.toggle('active', id === shape);
  }

  const { lengthX, lengthY, lengthZ, bytes } = getData(shape);

  const texture = new THREE.Data3DTexture(bytes, lengthX, lengthY, lengthZ);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter; //THREE.NearestFilter THREE.LinearFilter
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  material.uniforms.uData.value?.dispose(); // освобождаем старую текстуру
  material.uniforms.uData.value = texture;
  material.uniforms.uSize.value.set(lengthX, lengthY, lengthZ);

  figure.geometry.dispose();
  figure.geometry = makeGeometry(shape, lengthX, lengthY, lengthZ);
  figure.position.set(lengthX / 2, lengthY / 2, lengthZ / 2);
  controls.target.set(lengthX / 2, lengthY / 2, lengthZ / 2);
  if (!cameraPlaced) { //чтоб не "скакала" камера
    const size = Math.max(lengthX, lengthY, lengthZ);
    camera.position.set(size * 2, size * 1.7, size * 2);
    cameraPlaced = true;
  }
}
setShape('pyramid'); // начальная фигура

// визуальная палитра температур
function createPaletteLegend() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const width = 300;
  const height = 40;
  canvas.width = width;
  canvas.height = height;
  canvas.classList.add('palette-legend');
  viewport.appendChild(canvas);

  const strip = document.createElement('canvas');
  strip.width = PALETTE_SIZE;
  strip.height = 1;
  const stripCtx = strip.getContext('2d')!;
  const imageData = stripCtx.createImageData(PALETTE_SIZE, 1);
  imageData.data.set(PALETTE_RGBA);
  stripCtx.putImageData(imageData, 0, 0);

  const drawX = 10;
  const drawY = 10;
  const drawWidth = width - 20;
  const drawHeight = 15;
  
  ctx.drawImage(strip, drawX, drawY, drawWidth, drawHeight);

  //Мин и Макс температура
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`${T_MIN}°C`, drawX, drawY + 28);
  
  ctx.textAlign = 'right';
  ctx.fillText(`${T_MAX}°C`, drawX + drawWidth, drawY + 28);

  ctx.textAlign = 'center';
  ctx.fillText('Температура', drawX + drawWidth / 2, drawY + 28);
}

createPaletteLegend();


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();