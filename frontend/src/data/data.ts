import { makeMask, type Shape } from './shapes';

export const T_MIN = -100; // °C: всё холоднее показывается как -100
export const T_MAX = 1700; // °C: всё горячее показывается как 1700
const KELVIN = 273.15;

const USE_FAKE = true; // true = заглушка, false = настоящий бек (Simulator)

//заглушка

const FAKE = {
	lengthX: 20,          // размеры сетки (в ячейках)
	lengthY: 20,
	lengthZ: 20,
	baseCelsius: 20,      // температура тела, °C
	ambientCelsius: 20,   // температура вне тела (клетки, не входящие в фигуру), °C
	hotCelsius: 900,      // температура источника, °C
	hot: { x: 0.5, y: 0.1, z: 0.5 }, // источник в долях коробки (0..1): здесь низ по центру
	spread: 6,            // как далеко расходится тепло (в ячейках): больше = шире
};

type GridView = {
	Grid: { LengthX: number; LengthY: number; LengthZ: number };
	Data: number[]; // температуры в кельвинах
};

// Делает массив так же, как его вернул бы бек
function fakeGridView(mask: Uint8Array): GridView {
	const { lengthX, lengthY, lengthZ, baseCelsius, ambientCelsius, hotCelsius, spread } = FAKE;
	const hot = {
		x: FAKE.hot.x * lengthX,
		y: FAKE.hot.y * lengthY,
		z: FAKE.hot.z * lengthZ,
	};

	const Data: number[] = [];
	for (let z = 0; z < lengthZ; z++) {
		for (let y = 0; y < lengthY; y++) {
			for (let x = 0; x < lengthX; x++) {
				if (!mask[Data.length]) {
					// клетка вне фигуры: температура среды
					Data.push(ambientCelsius + KELVIN);
					continue;
				}
				const distance = Math.hypot(x + 0.5 - hot.x, y + 0.5 - hot.y, z + 0.5 - hot.z);
				const k = Math.exp(-distance / spread); // 1 у источника, дальше плавно падает к 0
				const celsius = baseCelsius + (hotCelsius - baseCelsius) * k;
				Data.push(celsius + KELVIN); // бек отдаёт кельвины
			}
		}
	}

	return { Grid: { LengthX: lengthX, LengthY: lengthY, LengthZ: lengthZ }, Data };
}

function loadGridView(mask: Uint8Array): GridView {
	if (USE_FAKE) return fakeGridView(mask);

	const res = Simulator.getGridView();
	if (!res.ok) throw new Error(res.error);
	return res.data;
}

//конец заглушки

export type GridData = {
	lengthX: number;
	lengthY: number;
	lengthZ: number;
	bytes: Uint8Array; // температуры как числа 0..255
	mask: Uint8Array;  // 1 = ячейка внутри фигуры
};

// для показа заполняем пустые клетки у границы значениями ближайших клеток тела.
// Клетки далеко от фигуры всё равно не видны, их трогать не нужно.
function fillOutside(
	bytes: Uint8Array,
	mask: Uint8Array,
	lengthX: number,
	lengthY: number,
	lengthZ: number,
	layers = 2, // на сколько клеток от границы заполняем
): void {
	const known = Uint8Array.from(mask); // 1 = значение клетки можно использовать

	for (let layer = 0; layer < layers; layer++) {
		const filled: number[] = [];

		for (let z = 0; z < lengthZ; z++) {
			for (let y = 0; y < lengthY; y++) {
				for (let x = 0; x < lengthX; x++) {
					const i = x + lengthX * (y + lengthY * z);
					if (known[i]) continue;

					// среднее по соседним клеткам (до 26 штук вокруг), у которых значение есть
					let sum = 0;
					let count = 0;
					for (let dz = -1; dz <= 1; dz++) {
						for (let dy = -1; dy <= 1; dy++) {
							for (let dx = -1; dx <= 1; dx++) {
								const nx = x + dx;
								const ny = y + dy;
								const nz = z + dz;
								if (nx < 0 || ny < 0 || nz < 0 || nx >= lengthX || ny >= lengthY || nz >= lengthZ) continue;
								const j = nx + lengthX * (ny + lengthY * nz);
								if (known[j]) {
									sum += bytes[j];
									count++;
								}
							}
						}
					}

					if (count > 0) {
						bytes[i] = Math.round(sum / count);
						filled.push(i);
					}
				}
			}
		}

		// клетки этого слоя становятся «известными» только после прохода,
		// иначе результат зависел бы от порядка обхода
		for (const i of filled) known[i] = 1;
	}
}

export function getData(shape: Shape): GridData {
	// Размеры сетки пока берём из заглушки. С настоящим беком они придут в ответе.
	const mask = makeMask(shape, FAKE.lengthX, FAKE.lengthY, FAKE.lengthZ);

	const { Grid, Data } = loadGridView(mask);
	const lengthX = Grid.LengthX;
	const lengthY = Grid.LengthY;
	const lengthZ = Grid.LengthZ;

	if (Data.length !== lengthX * lengthY * lengthZ) {
		throw new Error('Размер массива не совпадает с размерами сетки');
	}

	// Кельвины -> 0..255 по фиксированной шкале
	const bytes = new Uint8Array(Data.length);
	for (let i = 0; i < Data.length; i++) {
		const celsius = Data[i] - KELVIN;
		const t = (celsius - T_MIN) / (T_MAX - T_MIN); // 0..1
		bytes[i] = Math.round(Math.min(1, Math.max(0, t)) * 255);
	}

	fillOutside(bytes, mask, lengthX, lengthY, lengthZ);

	return { lengthX, lengthY, lengthZ, bytes, mask };
}







