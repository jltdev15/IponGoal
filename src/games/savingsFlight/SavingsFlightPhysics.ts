import { FLIGHT } from './SavingsFlightConfig';
export type Rect = { x: number; y: number; width: number; height: number };
export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
export function playerBounds(y: number): Rect {
  return {
    x: FLIGHT.playerX + FLIGHT.hitInset,
    y: y + FLIGHT.hitInset,
    width: FLIGHT.playerSize - FLIGHT.hitInset * 2,
    height: FLIGHT.playerSize - FLIGHT.hitInset * 2,
  };
}
export function integrate(y: number, velocity: number, seconds: number) {
  const nextVelocity = Math.min(
    velocity + FLIGHT.gravity * seconds,
    FLIGHT.maxFallVelocity,
  );
  return { y: y + nextVelocity * seconds, velocity: nextVelocity };
}
export function obstacleGap(index: number) {
  const center = [200, 172, 224, 188, 214][index % 5];
  return {
    top: center - FLIGHT.gapHeight / 2,
    bottom: center + FLIGHT.gapHeight / 2,
  };
}
