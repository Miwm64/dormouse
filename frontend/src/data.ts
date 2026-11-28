export const T_MIN = -100; // °C: всё холоднее показывается как -100
export const T_MAX = 1700; // °C: всё горячее показывается как 1700
const KELVIN = 273.15;

const USE_FAKE = true;

//-----заглушка------

const FAKE = {
  lengthX: 20,        // размеры сетки (в ячейках)
  lengthY: 10,
  lengthZ: 10,
  baseCelsius: 100,    // температура тела, °C
  hotCelsius: 900,    // температура источника, °C
  hot: { x: 0, y: 5, z: 5 }, // ячейка, где стоит источник (номера ячеек, с 0)
  spread: 10,          // как далеко расходится тепло (в ячейках): больше = шире
};

type GridView = {
  Grid: { LengthX: number; LengthY: number; LengthZ: number };
  Data: number[]; // температуры в кельвинах
};

// Делает массив так же, как его вернул бы бек
function fakeGridView(): GridView {
  const { lengthX, lengthY, lengthZ, baseCelsius, hotCelsius, hot, spread } = FAKE;

  const Data: number[] = [];
  for (let z = 0; z < lengthZ; z++) {
    for (let y = 0; y < lengthY; y++) {
      for (let x = 0; x < lengthX; x++) {
        const distance = Math.hypot(x - hot.x, y - hot.y, z - hot.z);
        const k = Math.exp(-distance / spread); // 1 у источника, дальше плавно падает к 0
        const celsius = baseCelsius + (hotCelsius - baseCelsius) * k;
        Data.push(celsius + KELVIN); // бек отдаёт кельвины
      }
    }
  }

  return { Grid: { LengthX: lengthX, LengthY: lengthY, LengthZ: lengthZ }, Data };
}

function loadGridView(): GridView {
  if (USE_FAKE) return fakeGridView();

  const res = Simulator.getGridView();
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

//-------

export type GridData = {
  lengthX: number;
  lengthY: number;
  lengthZ: number;
  bytes: Uint8Array; // температуры как числа 0..255
};

export function getData(): GridData {
  const { Grid, Data } = loadGridView();
  const lengthX: number = Grid.LengthX;
  const lengthY: number = Grid.LengthY;
  const lengthZ: number = Grid.LengthZ;

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

  return { lengthX, lengthY, lengthZ, bytes };
}