import mapboxgl, { Map } from "mapbox-gl";
import { moveForwardAlongLineByPositionBearingStep } from "./moveForwardAlongLine";
import { Object3D, Object3DEventMap } from "three";
import { FeatureCollection, GeoJsonProperties, LineString } from "geojson";
import { calculateBearing } from "./bearing";
import { getOnEdgePosition2 } from "./getOnEdgePosition";

export const updatePosition = {
    person3DPosition: (lng: number, lat: number, bearing: number, personModelRef: React.RefObject<Object3D<Object3DEventMap> | null>) => {
        if (!personModelRef.current) return;
        moveForwardAlongLineByPositionBearingStep([lng, lat], bearing, 1)
        const mercatorCoord = mapboxgl.MercatorCoordinate.fromLngLat(moveForwardAlongLineByPositionBearingStep([lng, lat], bearing, 5), 0);
        personModelRef.current.position.set(mercatorCoord.x, mercatorCoord.y, mercatorCoord.z);
        // personModelRef.current.rotation.y = bearing;
    },
    miniMapTriangle: (map: Map|null, lng: number, lat: number, bearing: number) => {
        if (map?.getSource('mini-triangle')) {
            const source = map.getSource('mini-triangle') as mapboxgl.GeoJSONSource;
            source.setData({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        properties: { bearing }
                    }
                ]
            });
            map.setLayoutProperty('mini-triangle-layer', 'icon-rotate', bearing);
        }
    },
    shadow3DPerson: (map: Map|null, lng: number, lat: number) => {
        if (map?.getSource("person-shadow")) {
            const source = map.getSource("person-shadow") as mapboxgl.GeoJSONSource;
            source.setData({
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [lng, lat]
                        },
                        properties:{}
                    }
                ]
            });
        }
    },
    nextPosition : (
        triangleState: {coordinates: [number, number];rotation: number;},
        direction: string,
        currEdgeIndex: number,
        navigationPath: FeatureCollection<LineString, GeoJsonProperties>,
        currentEdgeGeometry: [[number, number], [number, number]]
    ): [number, number, number, number, [[number, number], [number, number]]] => {
        const [lng, lat] = triangleState.coordinates;
            
        let newLng = lng;
        let newLat = lat;
        let rotation = triangleState.rotation;

        let index = currEdgeIndex;
        let edgeCoordinates = currentEdgeGeometry
        moveForwardAlongLineByPositionBearingStep(triangleState.coordinates, triangleState.rotation, 1);
        switch (direction) {
            case 'up':
            [newLng, newLat] = moveForwardAlongLineByPositionBearingStep(triangleState.coordinates, triangleState.rotation, 3/4);
            const [edgePosition, edgeIndex] = getOnEdgePosition2(navigationPath.features, [newLng, newLat])
            if(edgePosition!=null){
                const [bearing, edgeCoordinatesNew] = calculateBearing(edgePosition?.geometry.coordinates[0] as [number, number], edgePosition?.geometry.coordinates[1] as [number, number], [newLng, newLat]);
                edgeCoordinates = edgeCoordinatesNew;
                rotation = bearing;
                index = edgeIndex;
            }
            break;
            case 'right':
            rotation+=10;
            break;
            case 'left':
            rotation-=10;
            break;
        }

        return [newLng, newLat, rotation, index, edgeCoordinates]
    }
}