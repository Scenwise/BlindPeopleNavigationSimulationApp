import { Feature, LineString } from "geojson";
import { isPointOnLineString } from "./getOnEdgePosition"

export const getNaVigationCommandBasedonTrianglePosition = (trianglePosition: number[], edge: [[number, number], [number, number]], nextEdge: Feature<LineString>|null):string => {
    if(isPointOnLineString(edge, trianglePosition, 1e-5)){
        if(isPointOnTheEnd(trianglePosition, edge)){

            if(nextEdge == null){
                return "You are at the end";
            }
            if(nextEdge!=null && isTurnLeft(edge, nextEdge)){
                return "Turn to the left and go forward";
            } else return "Turn to the right and go forward";

            
        }
        if(isPoint25MetersFromTheEnd(trianglePosition, edge)){

            if(nextEdge == null){
                return "You are almost at the end";
            }
            if(nextEdge!=null && isTurnLeft(edge, nextEdge)){
                return "In five meters turn left"
            }else return "In five meters turn right";
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

const isTurnLeft = (edge: [[number, number], [number, number]], nextEdge: Feature<LineString>): boolean => {
    const [A, B] = edge;
  const [P, Q] = nextEdge.geometry.coordinates;

  const v1 = [B[0] - A[0], B[1] - A[1]];
  const v2 = [Q[0] - P[0], Q[1] - P[1]];

  const cross = v1[0] * v2[1] - v1[1] * v2[0];
  return cross > 0 ? true : false;
}

const isPointOnTheEnd = (trianglePosition: number[], edge: [[number, number], [number, number]]):boolean => {
    if(distance(trianglePosition, edge[1])<1.5){
        return true
    }
    return false;
}



