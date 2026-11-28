import * as THREE from 'three';
import { T_MIN, T_MAX } from '../data/data';

const STOPS: [number, string][] = [
    [50, '#0a1a5c'], // тёмно-синий
    [150, '#1f4fd8'], // синий
    [250, '#7b2fbe'], // фиолетовый
    [350, '#d0103a'], // красный начинается
    [500, '#ff1f1f'], // красный
    [700, '#ff5a00'], // красно-оранжевый
    [850, '#ff9a00'], // оранжевый
    [950, '#ffd23f'], // жёлтый
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

export function makePaletteTexture(): THREE.DataTexture {
    const palette = new THREE.DataTexture(PALETTE_RGBA, PALETTE_SIZE, 1, THREE.RGBAFormat);
    palette.minFilter = THREE.LinearFilter;
    palette.magFilter = THREE.LinearFilter;
    palette.needsUpdate = true;
    return palette;
}

// визуальная палитра температур
export function createPaletteLegend(container: HTMLElement): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const width = 300;
    const height = 40;
    canvas.width = width;
    canvas.height = height;
    canvas.classList.add('palette-legend');
    container.appendChild(canvas);

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