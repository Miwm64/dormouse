import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makePaletteTexture } from './ui/palette';
import { makeGeometry, type Shape } from './data/shapes';
import type { GridData } from './data/data';

export type Viewer = {
    showShape(shape: Shape, data: GridData): void;

    updateTemperatures(bytes: Uint8Array): void;
};

export function createViewer(container: HTMLElement): Viewer {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); //фон 0x111111 - чёрный
    scene.add(new THREE.AxesHelper(200));

    //1 - временное, настоящее ставится в ResizeObserver
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
    }).observe(container);

    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, // рисуем обе стороны граней, чтобы не зависеть от порядка вершин
        uniforms: {
            uData: { value: null as THREE.Data3DTexture | null },
            uPalette: { value: makePaletteTexture() },
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

    let texture: THREE.Data3DTexture | null = null;
    let textureBytes: Uint8Array | null = null;
    let cameraPlaced = false;

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    return {
        showShape(shape, { lengthX, lengthY, lengthZ, bytes }) {
            texture?.dispose();

            textureBytes = bytes.slice();
            texture = new THREE.Data3DTexture(textureBytes, lengthX, lengthY, lengthZ);
            texture.format = THREE.RedFormat;
            texture.type = THREE.UnsignedByteType;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter; //THREE.NearestFilter THREE.LinearFilter
            texture.unpackAlignment = 1;
            texture.needsUpdate = true;

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
        },

        updateTemperatures(bytes) {
            if (!texture || !textureBytes) {
                throw new Error('updateTemperatures: сначала нужно вызвать showShape');
            }
            if (bytes.length !== textureBytes.length) {
                throw new Error('updateTemperatures: размер данных не совпадает с размером сетки');
            }
            textureBytes.set(bytes);
            texture.needsUpdate = true;
        },
    };
}