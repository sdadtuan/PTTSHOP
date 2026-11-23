export function nextOrderNumber(
  now = Date.now(),
  rand = Math.floor(Math.random() * 900 + 100),
) {
  const stamp = now.toString().slice(-8);
  return `PTT${stamp}${rand}`;
}
