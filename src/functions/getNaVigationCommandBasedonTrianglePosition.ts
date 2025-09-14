import { Feature, LineString } from "geojson";
import { distancePointToEdge } from "./getOnEdgePosition"
import { distanceAlongHeadingToEdgeLonLat } from "./distanceToEdgeBasedOnBearing";
import { turnToEdge } from "./turnInfoData";

export const getNaVigationCommandBasedonTrianglePosition = (bearing: number, trianglePosition: number[], current: Feature<LineString>, nextEdge: Feature<LineString>|null):string => {
    
    let roadTypeMessage = "";
    if(current.properties?.imaginery_content != nextEdge?.properties?.imaginery_content){
        if(nextEdge?.properties?.imaginery_content == "yes"){
            roadTypeMessage = ". You will step on imaginery tactile"
        } else{
            roadTypeMessage = ". You will back on real tactile"
        }
    }

    if(distancePointToEdge(trianglePosition as [number, number], current.geometry.coordinates[0] as [number, number], current.geometry.coordinates[1] as [number, number])<2){
        if(isPointOnTheEnd(trianglePosition, current.geometry.coordinates as [[number, number], [number, number]])){

            if(nextEdge == null){
                return "You are at the end";
            }
            if(!isPoint25MetersFromTheEnd(trianglePosition, current.geometry.coordinates as [[number, number], [number, number]])){
                return "Go forward";
            }
            const [direction, angleDeg] = isTurnLeftOrRight(current.geometry.coordinates as [[number, number], [number, number]], nextEdge);
            switch (direction) {
                case -1: 
                    return "Turn to the right by "+Math.abs(Math.round(angleDeg))+" degrees and go forward" + roadTypeMessage;
                case 0:
                    return "Go forward" + roadTypeMessage;
                case 1: return "Turn to the left by "+Math.abs(Math.round(angleDeg))+" degrees and go forward" + roadTypeMessage;
            }            
        }
        if(isPoint25MetersFromTheEnd(trianglePosition, current.geometry.coordinates as [[number, number], [number, number]])){

            if(nextEdge == null){
                return "You are almost at the end";
            }
            const [direction, angleDeg] = isTurnLeftOrRight(current.geometry.coordinates as [[number, number], [number, number]], nextEdge);
            switch (direction) {
                case -1: 
                    return "In five meters turn right by "+ Math.abs(Math.round(angleDeg)) + " degrees" + roadTypeMessage;
                case 0:
                    return "Go forward" + roadTypeMessage;
                case 1: return "In five meters turn left by "+ Math.abs(Math.round(angleDeg)) + " degrees" + roadTypeMessage;
            }    
        }
        
        return "Go forward";
    }
    
    const result = distanceAlongHeadingToEdgeLonLat(
        trianglePosition as [number, number], 
        (bearing + 180) % 360, 
        current.geometry.coordinates[0] as [number, number], 
        current.geometry.coordinates[1] as [number, number]);

    const turn = turnToEdge(
        (bearing + 180) % 360, 
        current.geometry.coordinates[0] as [number, number], 
        current.geometry.coordinates[1] as [number, number])
    if(result){
        return "Make U-turn and get back on the path, walk back "+Math.round(result?.distance*10) + " meters and then turn by "+turn.absTurn+" degrees to the "+turn.direction;
    }
    return "";

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

const isTurnLeftOrRight = (edge: [[number, number], [number, number]], nextEdge: Feature<LineString>): [number, number] => {
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
    if (angleDeg > -5 && angleDeg < 5) {
        return [0, 0]; // straight
    }

    return angleDeg > 0 ? [1, angleDeg] : [-1, angleDeg]; 
}

const isPointOnTheEnd = (trianglePosition: number[], edge: [[number, number], [number, number]]):boolean => {
    if(distance(trianglePosition, edge[1])<1.5){
        return true
    }
    return false;
}

