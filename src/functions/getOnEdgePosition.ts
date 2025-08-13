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
        return p1[0] === p2[0] && p1[1] === p2[1];
    };

export const getOnEdgePosition2 = (feature: Feature<LineString>[], position: number[], tolerance = 1e-9): [Feature<LineString>|null, number] => {
  let index = 0;
    for (const line of feature) {
    if (isPointOnLineString(line.geometry.coordinates, position, tolerance)) {
      return [line, index]; // Found match
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