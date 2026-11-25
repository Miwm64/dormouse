import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { N, getData } from './data';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); //фон 0x111111 - чёрный
scene.add(new THREE.AxesHelper(10));

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(N * 2, N * 1.7, N * 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(N / 2, N / 2, N / 2);

const data = getData();
const bytes = new Uint8Array(data.length);
for (let i = 0; i < data.length; i++) {
  bytes[i] = Math.round(data[i] * 255);
}

const texture = new THREE.Data3DTexture(bytes, N, N, N);
texture.format = THREE.RedFormat;
texture.type = THREE.UnsignedByteType;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter; //THREE.NearestFilter
texture.unpackAlignment = 1;
texture.needsUpdate = true;

const material = new THREE.ShaderMaterial({
  uniforms: { uData: { value: texture }, uSize: { value: N } },
  vertexShader: /* glsl */ `
    uniform float uSize;
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
    varying vec3 vCoord;

    /*vec3 hsv2rgb(vec3 c) {
      vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
      return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
    }

    void main() {
      float t = texture(uData, vCoord).r;
      vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 1.0), t);
      //vec3 color = hsv2rgb(vec3((1.0 - t) * 0.66, 1.0, 1.0));
      gl_FragColor = vec4(color, 1.0);
    }*/

   void main() {
    float t = texture(uData, vCoord).r;

    vec3 cold = vec3(0.0, 0.0, 1.0);  // синий
    vec3 mid  = vec3(1.0, 0.0, 0.0);  // красный
    vec3 hot  = vec3(1.0, 1.0, 1.0);  // белый

    vec3 color = t < 0.5 ? mix(cold, mid, t * 2.0) : mix(mid, hot, (t - 0.5) * 2.0);
    gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const cube = new THREE.Mesh(new THREE.BoxGeometry(N, N, N), material);
cube.position.set(N / 2, N / 2, N / 2);
scene.add(cube);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
