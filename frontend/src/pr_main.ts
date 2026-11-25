import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { N, getData } from './data';

// 1. Сцена, камера, рендерер
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); //фон 0x111111 - чёрный
scene.add(new THREE.AxesHelper(10));

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(N * 1.5, N * 1.2, N * 1.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(N / 2, N / 2, N / 2);

// 2. Массив → 3D-текстура
const data = getData();                       // числа от 0 до 1
const bytes = new Uint8Array(data.length);    // в текстуре храним как 0..255
for (let i = 0; i < data.length; i++) {
  bytes[i] = Math.round(data[i] * 255);
}

const texture = new THREE.Data3DTexture(bytes, N, N, N);
texture.format = THREE.RedFormat;             // одно число на ячейку
texture.type = THREE.UnsignedByteType;
texture.minFilter = THREE.LinearFilter;       // плавные переходы
texture.magFilter = THREE.LinearFilter;
texture.unpackAlignment = 1;
texture.needsUpdate = true;

// 3. Материал: шейдер берёт значение из текстуры и красит его
const material = new THREE.ShaderMaterial({
  uniforms: { uData: { value: texture }, uSize: { value: N } },
  vertexShader: /* glsl */ `
    uniform float uSize;
    varying vec3 vCoord;
    void main() {
      // позиция точки на кубе → координата внутри текстуры (0..1)
      vCoord = position / uSize + 0.5;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp sampler3D;
    uniform sampler3D uData;
    varying vec3 vCoord;

    vec3 hsv2rgb(vec3 c) {
      vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
      return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
    }

    void main() {
      float t = texture(uData, vCoord).r;            // температура 0..1
      vec3 color = hsv2rgb(vec3((1.0 - t) * 0.66, 1.0, 1.0)); // синий → красный
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

// 4. Один цельный куб
const cube = new THREE.Mesh(new THREE.BoxGeometry(N, N, N), material);
cube.position.set(N / 2, N / 2, N / 2);
scene.add(cube);

// 5. Цикл отрисовки
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();