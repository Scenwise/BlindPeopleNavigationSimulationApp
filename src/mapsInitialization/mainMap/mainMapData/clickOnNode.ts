import { MapMouseEvent } from "mapbox-gl";
import { RefObject } from "react";

export const clickOnNode = (
    e: MapMouseEvent,
    map: mapboxgl.Map,
    startNodeIdRef: RefObject<number>,
    startNodeRef: RefObject<string>,
    endNodeIdRef: RefObject<number>,
    setStartNode: React.Dispatch<React.SetStateAction<string>>,
    setStartNodeId: React.Dispatch<React.SetStateAction<number>>,
    setEndNode: React.Dispatch<React.SetStateAction<string>>,
    setEndNodeId: React.Dispatch<React.SetStateAction<number>>
) => {
    const id = e.features?.[0]?.properties?.id as string;
    const nodeId = e.features?.[0]?.id as number;
    map?.setFeatureState(
        { source: 'nodes-blind-people-network-delft', id: endNodeIdRef.current },
        { clicked: false }
    );

    setEndNodeId(startNodeIdRef.current);
    setStartNodeId(nodeId)

    setEndNode(startNodeRef.current);
    setStartNode(id);

    map.getCanvas().style.cursor = 'pointer';

    map.setFeatureState({
        source: 'nodes-blind-people-network-delft',
        id: nodeId,
    }, {
        clicked: true
    });
}