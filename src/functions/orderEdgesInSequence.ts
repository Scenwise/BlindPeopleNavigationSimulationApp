import { Feature, LineString, Position } from "geojson";

export const orderEdgesOnSequence = (edges: Feature<LineString>[], startPoint: number[]):Feature<LineString>[] => {
    if (edges.length === 0) return [];

  const remaining = [...edges];
  const ordered: Feature<LineString>[] = [];
  let currentPoint = startPoint;

  while (remaining.length > 0) {
    const idx = remaining.findIndex(edge =>
      pointsEqual(edge.geometry.coordinates[0], currentPoint) || pointsEqual(edge.geometry.coordinates[edge.geometry.coordinates.length - 1], currentPoint)
    );

    if (idx === -1) {
      throw new Error(`No connected edge found from point ${currentPoint}`);
    }

    let nextEdge = remaining[idx];

    // Reverse edge if not starting from currentPoint
    if (!pointsEqual(nextEdge.geometry.coordinates[0], currentPoint)) {
      nextEdge.geometry.coordinates = [...nextEdge.geometry.coordinates].reverse();
    }

    ordered.push(nextEdge);
    currentPoint = nextEdge.geometry.coordinates[nextEdge.geometry.coordinates.length - 1];
    remaining.splice(idx, 1);
  }

  return ordered;

}


function pointsEqual(a: Position, b: Position, tol = 1e-9): boolean {
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
}

// function keyForPoint(p: Position): string {
//   return `${p[0].toFixed(9)},${p[1].toFixed(9)}`;
// }

// function parseKey(key: string): Position {
//   const [lng, lat] = key.split(",").map(Number);
//   return [lng, lat];
// }