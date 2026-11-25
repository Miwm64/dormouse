export const N = 5; // размер куба: 5 × 5 × 5 маленьких кубиков

// Возвращает массив из N*N*N чисел от 0 до 1 (температура каждого кубика)
export function getData(): number[] {
  const data: number[] = [];
  for (let z = 0; z < N; z++) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        data.push((x + y + z) / (3 * (N - 1)));
      }
    }
  }
  return data;
}