export const calculateBearing = (coord1: [number, number], coord2: [number, number], startCoord: [number, number]): [number, [[number, number], [number, number]]] => {
    if(coord2 == startCoord){
        [coord1, coord2] = [coord2, coord1];
    }
    const toRadians = (deg: number) => deg * (Math.PI / 180);
    const toDegrees = (rad: number) => rad * (180 / Math.PI);

    const a = toRadians(coord1[1]);
    const b = toRadians(coord2[1]);
    const c = toRadians(coord2[0] - coord1[0]);

    const y = Math.sin(c) * Math.cos(b);
    const x = Math.cos(a) * Math.sin(b) -
              Math.sin(a) * Math.cos(b) * Math.cos(c);

    let θ = Math.atan2(y, x);
    θ = toDegrees(θ);
    return [(θ + 360) % 360, [coord1, coord2]];  // Normalize to 0–360
}
