// A smooth line through the points that never dips below or above them (monotone cubic)
export function smooth(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n === 1) return `M${xs[0]},${ys[0]}`;
  const dx = xs.slice(1).map((x, i) => x - xs[i]);
  const slope = dx.map((d, i) => (ys[i + 1] - ys[i]) / d);
  const tangent = xs.map((_, i) => (i === 0 ? slope[0] : i === n - 1 ? slope[n - 2] : slope[i - 1] * slope[i] <= 0 ? 0 : 2 / (1 / slope[i - 1] + 1 / slope[i])));
  let path = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    path += `C${xs[i] + h},${ys[i] + tangent[i] * h} ${xs[i + 1] - h},${ys[i + 1] - tangent[i + 1] * h} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return path;
}

// 1, 2, 5 or 10 times a power of ten, so an axis ends on a round number
export function niceMax(value: number) {
  const power = 10 ** Math.floor(Math.log10(value));
  const step = value / power;
  return (step <= 1 ? 1 : step <= 2 ? 2 : step <= 5 ? 5 : 10) * power;
}
