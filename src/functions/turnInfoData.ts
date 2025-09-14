import { calculateBearing } from "./bearing";

/**
 * Normalize angle to [0, 360)
 */
function normalize360(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Smallest signed angle from `from` to `to` in degrees.
 * Result is in range (-180, 180]. Positive means rotate clockwise (right),
 * negative means rotate counterclockwise (left).
 *
 * Bearings assumed in degrees, 0..360 (0 = North, 90 = East).
 */
export function signedTurnDegrees(fromBearing: number, toBearing: number): number {
  const f = normalize360(fromBearing);
  const t = normalize360(toBearing);
  // Compute difference and move into (-180, 180]
  const diff = ((t - f + 540) % 360) - 180;
  // For the rare case diff === -180, we prefer +180 (consistent minimal turn).
  return diff === -180 ? 180 : diff;
}

/**
 * Returns a structured result:
 * - signed: signed minimal turn in degrees (-180..180], positive => right/clockwise
 * - abs: absolute degrees to turn (0..180)
 * - direction: 'right' | 'left' | 'none'
 * - clockwise: degrees to rotate clockwise (0..360)
 * - counterClockwise: degrees to rotate counterclockwise (0..360)
 */
export function turnInfo(fromBearing: number, toBearing: number) {
  const signed = signedTurnDegrees(fromBearing, toBearing);
  const abs = Math.abs(signed);
  const direction = abs === 0 ? 'none' : (signed > 0 ? 'right' : 'left');

  // Clockwise rotation degrees (0..360)
  const clockwise = normalize360(toBearing - fromBearing);
  // Counterclockwise rotation degrees (0..360)
  const counterClockwise = normalize360(fromBearing - toBearing);

  return {
    signed,               // -180..180 (positive = right)
    abs,                  // 0..180
    direction,            // 'right'|'left'|'none'
    clockwise,            // 0..360 (degrees turning right)
    counterClockwise,     // 0..360 (degrees turning left)
  };
}

/**
 * Given your bearing and two points (A,B), return the turn info.
 */
export function turnToEdge(
  myBearing: number,
  coord1: [number, number], coord2: [number, number]
) {
  const edgeBearing = calculateBearing(coord1, coord2, coord1);
  const signed = signedTurnDegrees(myBearing, edgeBearing[0]);
  const abs = Math.abs(signed);

  return {
    edgeBearing,          // Bearing A→B in degrees
    signedTurn: signed,   // -180..180, +right, -left
    absTurn: abs,         // Degrees to turn (0..180)
    direction: abs === 0 ? 'none' : signed > 0 ? 'right' : 'left',
  };
}