import * as THREE from 'three';

export type Shape = 'sphere' | 'cube' | 'tetrahedron' | 'pyramid';

export const SHAPES: { id: Shape; label: string }[] = [
    { id: 'sphere', label: 'Шар' },
    { id: 'cube', label: 'Куб' },
    { id: 'tetrahedron', label: 'Тетраэдр' },
    { id: 'pyramid', label: 'Пирамида' },
];

const inside: Record<Shape, (u: number, v: number, w: number) => boolean> = {
    cube: () => true,

    // шар (в вытянутой коробке получится эллипсоид)
    sphere: (u, v, w) => (u - 0.5) ** 2 + (v - 0.5) ** 2 + (w - 0.5) ** 2 <= 0.25,

    // пирамида: квадратное основание внизу, вершина наверху
    pyramid: (u, v, w) => {
        const halfWidth = 0.5 * (1 - v); // сужается от 0.5 внизу до 0 наверху
        return Math.abs(u - 0.5) <= halfWidth && Math.abs(w - 0.5) <= halfWidth;
    },

    // тетраэдр с вершинами в четырёх вершинах коробки:
    // (0,0,0) (1,1,0) (1,0,1) (0,1,1). Условия ниже это его четыре грани.
    tetrahedron: (u, v, w) =>
        u + v + w <= 2 && w <= u + v && v <= u + w && u <= v + w,
};

//Маска: для каждой ячейки 1, если она внутри фигуры, иначе 0.
//Порядок ячеек такой же, как в массиве температур: x + lengthX * (y + lengthY * z).
//пример маски от бека.
export function makeMask(
    shape: Shape,
    lengthX: number,
    lengthY: number,
    lengthZ: number,
): Uint8Array {
    const mask = new Uint8Array(lengthX * lengthY * lengthZ);
    const test = inside[shape];

    for (let z = 0; z < lengthZ; z++) {
        for (let y = 0; y < lengthY; y++) {
            for (let x = 0; x < lengthX; x++) {
                // центр ячейки, +0.5
                const u = (x + 0.5) / lengthX;
                const v = (y + 0.5) / lengthY;
                const w = (z + 0.5) / lengthZ;
                mask[x + lengthX * (y + lengthY * z)] = test(u, v, w) ? 1 : 0;
            }
        }
    }
    return mask;
}

// Собирает фигуру из треугольников. points: вершины в долях коробки (0..1),
// faces: тройки номеров вершин. Координаты переводятся так, чтобы центр
// коробки оказался в (0, 0, 0): именно этого ждёт шейдер.
function polyhedron(
    points: [number, number, number][],
    faces: [number, number, number][],
    lengthX: number,
    lengthY: number,
    lengthZ: number,
): THREE.BufferGeometry {
    const positions: number[] = [];
    for (const face of faces) {
        for (const index of face) {
            const [u, v, w] = points[index];
            positions.push((u - 0.5) * lengthX, (v - 0.5) * lengthY, (w - 0.5) * lengthZ);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

// 3D-форма для показа. Должна совпадать с маской выше.
export function makeGeometry(
    shape: Shape,
    lengthX: number,
    lengthY: number,
    lengthZ: number,
): THREE.BufferGeometry {
    switch (shape) {
        case 'cube':
            return new THREE.BoxGeometry(lengthX, lengthY, lengthZ);

        case 'sphere': {
            const geometry = new THREE.SphereGeometry(0.5, 48, 32);
            geometry.scale(lengthX, lengthY, lengthZ);
            return geometry;
        }

        case 'pyramid':
            return polyhedron(
                [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0.5, 1, 0.5]],
                [[0, 1, 2], [0, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]],
                lengthX, lengthY, lengthZ,
            );

        case 'tetrahedron':
            return polyhedron(
                [[0, 0, 0], [1, 1, 0], [1, 0, 1], [0, 1, 1]],
                [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]],
                lengthX, lengthY, lengthZ,
            );
    }
}