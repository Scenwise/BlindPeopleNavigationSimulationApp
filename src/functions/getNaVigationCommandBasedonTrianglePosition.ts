import { Feature, LineString } from "geojson";
import { isPointOnLineString } from "./getOnEdgePosition"

export const getNaVigationCommandBasedonTrianglePosition = (trianglePosition: number[], edge: [[number, number], [number, number]], nextEdge: Feature<LineString>|null):string => {
    if(isPointOnLineString(edge, trianglePosition, 1e-5)){
        if(isPointOnTheEnd(trianglePosition, edge)){

            if(nextEdge == null){
                return "You are at the end";
            }
            if(!isPoint25MetersFromTheEnd(trianglePosition, edge)){
                return "Go forward";
            }
            const direction = isTurnLeftOrRight(edge, nextEdge);
            switch (direction) {
                case -1: 
                    return "Turn to the right and go forward";
                case 0:
                    return "Go forward";
                case 1: return "Turn to the left and go forward";
            }            
        }
        if(isPoint25MetersFromTheEnd(trianglePosition, edge)){

            if(nextEdge == null){
                return "You are almost at the end";
            }
            const direction = isTurnLeftOrRight(edge, nextEdge);
            switch (direction) {
                case -1: 
                    return "In five meters turn right";
                case 0:
                    return "Go forward";
                case 1: return "In five meters turn left";
            }    
        }
        
        return "Go forward";
    }
    return "Make U-turn and get back on the path";

}

const isPoint25MetersFromTheEnd = (trianglePosition: number[], edge: [[number, number], [number, number]]):boolean => {
    const distanceM = distance(trianglePosition, edge[1]);
    console.log(distanceM)
    if(distanceM < 5 ){
        return true
    }
    return false;
}

const distance = (trianglePosition: number[], arg1: [number, number]):number => {
    return Math.sqrt(Math.pow(trianglePosition[0]-arg1[0], 2)+Math.pow(trianglePosition[1]-arg1[1], 2))*100000;
}

const isTurnLeftOrRight = (edge: [[number, number], [number, number]], nextEdge: Feature<LineString>): number => {
    const [A, B] = edge;
    const [P, Q] = nextEdge.geometry.coordinates;

    // direction vectors
    const v1 = [B[0] - A[0], B[1] - A[1]];
    const v2 = [Q[0] - P[0], Q[1] - P[1]];

    // dot and cross
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const cross = v1[0] * v2[1] - v1[1] * v2[0];

    // signed angle in radians
    const angle = Math.atan2(cross, dot); 

    // convert to degrees
    const angleDeg = (angle * 180) / Math.PI;
    console.log(angleDeg)
    // Threshold for "straight"
    if (angleDeg > -20 && angleDeg < 20) {
        return 0; // straight
    }

    return angleDeg > 0 ? 1 : -1; 
}

const isPointOnTheEnd = (trianglePosition: number[], edge: [[number, number], [number, number]]):boolean => {
    if(distance(trianglePosition, edge[1])<1.5){
        return true
    }
    return false;
}



