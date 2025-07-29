export const moveForwardAlongLine = (current: [number, number], A: [number, number], B: [number, number], step: number): [number, number] => {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return current; // A and B are the same

  // Unit direction vector
  const ux = dx / length;
  const uy = dy / length;

  // Step in that direction
  const newLng = current[0] + ux * step;
  const newLat = current[1] + uy * step;

  return [newLng, newLat];
}