import { Feature, LineString, Position } from "geojson";


export const getOnEdgePosition = (feature: Feature<LineString>[], position: number[]): Feature<LineString>|null => {
    const result = feature.filter((feature: Feature<LineString>)=>
            arePositionsEqual(feature.geometry.coordinates[0], position) || arePositionsEqual(feature.geometry.coordinates[1], position));
     if(result){
        return result[0]
    }
    return null;
}

function arePositionsEqual(p1: Position, p2: Position): boolean {
        return p1[0] === p2[0] && p1[1] === p2[1]
    }

export const getOnEdgePosition2 = (feature: Feature<LineString>[], position: number[], tolerance = 1e-9): [Feature<LineString>|null, number] => {
  let index = 0;
    for (const line of feature) {
    if (isPointOnLineString(line.geometry.coordinates, position, tolerance)) {
      return [line, index] // Found match
    }
    index+=1;
  }
  return [null, -1];
}

/**
 * Checks if a point is on the given LineString
 */
export const isPointOnLineString = (line: Position[], point: number[], tolerance: number): boolean => {
  for (let i = 0; i < line.length - 1; i++) {
    if (isPointOnSegment(line[i], line[i + 1], point, tolerance)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if point lies exactly on segment AB
 */
function isPointOnSegment(a: Position, b: Position, p: Position, tolerance: number): boolean {
  const [x, y] = p;
  const [x1, y1] = a;
  const [x2, y2] = b;

  // Bounding box check
  if (
    x < Math.min(x1, x2) - tolerance || x > Math.max(x1, x2) + tolerance ||
    y < Math.min(y1, y2) - tolerance || y > Math.max(y1, y2) + tolerance
  ) {
    return false;
  }

  // Colinearity check via cross product
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dxp = x - x1;
  const dyp = y - y1;
  const cross = dx * dyp - dy * dxp;
  
  return Math.abs(cross) <= tolerance;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

// Convert lat/lon differences to meters using equirectangular approximation
function latLonToXY(lat: number, lon: number, lat0: number): {x: number, y: number} {
    const R = 6371000; // Earth radius in meters
    const x = deg2rad(lon) * R * Math.cos(deg2rad(lat0));
    const y = deg2rad(lat) * R;
    return { x, y };
}

// Calculate distance from point P to segment AB
export function distancePointToEdge(P: [number, number], A: [number, number], B: [number, number]): number {
    // Use A.lat as reference for projection
    const lat0 = A[0];

    const pXY = latLonToXY(P[0], P[1], lat0);
    const aXY = latLonToXY(A[0], A[1], lat0);
    const bXY = latLonToXY(B[0], B[1], lat0);

    const dx = bXY.x - aXY.x;
    const dy = bXY.y - aXY.y;

    const t = ((pXY.x - aXY.x) * dx + (pXY.y - aXY.y) * dy) / (dx*dx + dy*dy);

    let closest: {x: number, y: number};
    if (t < 0) closest = aXY;
    else if (t > 1) closest = bXY;
    else closest = { x: aXY.x + t*dx, y: aXY.y + t*dy };

    const dist = Math.sqrt((pXY.x - closest.x)**2 + (pXY.y - closest.y)**2);
    return dist; // meters
}