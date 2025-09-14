/**
 * Compute the distance (in meters) from a start position along a heading bearing
 * to the intersection with an edge segment defined by two points A→B.
 * 
 * All coordinates use [lon, lat] order (GeoJSON style).
 * 
 * @param pos       Start position as [lon, lat]
 * @param bearing   Heading bearing in degrees (0°=North, 90°=East, clockwise)
 * @param A         First endpoint of edge [lon, lat]
 * @param B         Second endpoint of edge [lon, lat]
 * @param options   Optional: { reverse?: boolean, allowInfiniteLine?: boolean }
 * 
 * @returns         null if no forward intersection, otherwise:
 *                   {
 *                     distance: number (meters),
 *                     intersection: [lon, lat],
 *                     tRay: number,   // same as distance
 *                     uSeg: number,   // parameter along A→B segment (0..1)
 *                     edgeBearing: number // bearing A→B in degrees
 *                   }
 */

export type LonLat = [number, number];
export type Result = {
  distance: number;
  intersection: LonLat;
  tRay: number;
  uSeg: number;
  edgeBearing: number;
};

const R_EARTH = 6_371_000; // meters
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

/** Project [lon,lat] -> local tangent plane (meters) using a reference [lon,lat] */
function lonLatToXY(lon: number, lat: number, refLon: number, refLat: number) {
  const φ = deg2rad(lat);
  const λ = deg2rad(lon);
  const φ0 = deg2rad(refLat);
  const λ0 = deg2rad(refLon);
  const x = R_EARTH * (λ - λ0) * Math.cos(φ0); // east
  const y = R_EARTH * (φ - φ0);                // north
  return { x, y };
}

/** Inverse projection back to [lon,lat] */
function xyToLonLat(x: number, y: number, refLon: number, refLat: number): LonLat {
  const φ0 = deg2rad(refLat);
  const λ0 = deg2rad(refLon);
  const φ = φ0 + y / R_EARTH;
  const λ = λ0 + x / (R_EARTH * Math.cos(φ0));
  return [rad2deg(λ), rad2deg(φ)];
}

/** Convert bearing (deg) to unit vector in local east/north coordinates */
function bearingToUnitVector(bearingDeg: number) {
  const b = deg2rad(bearingDeg);
  const dx = Math.sin(b); // east
  const dy = Math.cos(b); // north
  return { dx, dy };
}

/** Bearing from point A→B ([lon,lat]) */
function bearingFromLonLat(A: LonLat, B: LonLat): number {
  const φ1 = deg2rad(A[1]);
  const φ2 = deg2rad(B[1]);
  const Δλ = deg2rad(B[0] - A[0]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (rad2deg(Math.atan2(y, x)) + 360) % 360;
}

export function distanceAlongHeadingToEdgeLonLat(
  pos: [number, number],
  bearing: number,
  A: [number, number],
  B: [number, number],
  options?: { reverse?: boolean; allowInfiniteLine?: boolean }
): Result | null {
  const reverse = !!options?.reverse;
  const allowInfinite = !!options?.allowInfiniteLine;

  // Reverse heading if requested
  const heading = ((bearing + (reverse ? 180 : 0)) % 360 + 360) % 360;

  const [posLon, posLat] = pos;
  const [ALon, ALat] = A;
  const [BLon, BLat] = B;

  // Use observer position as projection reference
  const P = lonLatToXY(posLon, posLat, posLon, posLat);
  const Axy = lonLatToXY(ALon, ALat, posLon, posLat);
  const Bxy = lonLatToXY(BLon, BLat, posLon, posLat);

  const { dx: vx, dy: vy } = bearingToUnitVector(heading);

  // Segment vector s = B - A
  const sx = Bxy.x - Axy.x;
  const sy = Bxy.y - Axy.y;

  // Solve for t,u: P + t*v = A + u*s
  const det = vy * sx - vx * sy;
  if (Math.abs(det) < 1e-12) return null; // parallel or collinear

  const wx = Axy.x - P.x;
  const wy = Axy.y - P.y;

  const t = (wy * sx - wx * sy) / det;
  const u = (vx * wy - vy * wx) / det;

  if (t >= 0 && (allowInfinite || (u >= 0 && u <= 1))) {
    const ix = P.x + t * vx;
    const iy = P.y + t * vy;
    const intersection = xyToLonLat(ix, iy, posLon, posLat);
    const edgeBearing = bearingFromLonLat(A, B);

    return {
      distance: t,
      intersection,
      tRay: t,
      uSeg: u,
      edgeBearing
    };
  }
  return null;
}
