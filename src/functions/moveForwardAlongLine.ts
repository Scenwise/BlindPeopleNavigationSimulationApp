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
  console.log([newLng, newLat]);
  return [newLng, newLat];
}

export const moveForwardAlongLineByPositionBearingStep = (start: [number, number], bearingDeg: number, step: number): [number, number] => {
  const R = 6371000; // mean Earth radius in meters

  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  const [lng1, lat1] = start;
  const φ1 = toRad(lat1);
  const λ1 = toRad(lng1);
  const θ = toRad(bearingDeg);
  const δ = step / R; // angular distance in radians

  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(Math.min(1, Math.max(-1, sinφ2))); // clamp for numeric safety

  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2);
  const λ2 = λ1 + Math.atan2(y, x);

  // normalize lon to -180..+180
  let lng2 = toDeg(λ2);
  lng2 = ((lng2 + 540) % 360) - 180; // normalize

  const lat2 = toDeg(φ2);
  return [lng2, lat2];
}