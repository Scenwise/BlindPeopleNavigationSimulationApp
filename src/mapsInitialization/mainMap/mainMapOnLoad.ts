import { FeatureCollection } from "geojson";
import mapboxgl from "mapbox-gl";
import { RefObject } from "react";
import { blindPeopleNetworkDelft } from "./mainMapData/blindPeopleNetworkDelft";
import { networkLayer } from "./mainMapData/networkLayer";
import { nodeLayer } from "./mainMapData/nodeLayer";
import { d3BuildingsLayer } from "./mainMapData/d3BuildingsLayer";
import { clickOnNode } from "./mainMapData/clickOnNode";
import { mouseHoverEnter } from "./mainMapData/mouseHoverEnter";
import { mouseHoverLeave } from "./mainMapData/mapHoverLeave";


export const mainMapOnLoad = (
    map: mapboxgl.Map, 
    blindPeoplePath: FeatureCollection, 
    nodes: FeatureCollection,
    startNodeIdRef: RefObject<number>,
    startNodeRef: RefObject<string>,
    endNodeIdRef: RefObject<number>,
    setStartNode: React.Dispatch<React.SetStateAction<string>>,
    setStartNodeId: React.Dispatch<React.SetStateAction<number>>,
    setEndNode: React.Dispatch<React.SetStateAction<string>>,
    setEndNodeId: React.Dispatch<React.SetStateAction<number>>
) => {
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.addSource('blind-people-network-delft', blindPeopleNetworkDelft(blindPeoplePath));
    map.addLayer(networkLayer);
    map.addSource('nodes-blind-people-network-delft', {
        type: 'geojson',
        data: nodes
    });
    map.addLayer(nodeLayer);

    // 🔹 Add 3D building extrusions here
    const layers = map.getStyle().layers;
    let labelLayerId;
    for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
            labelLayerId = layer.id;
            break;
        }
    }

    map.addLayer(d3BuildingsLayer, labelLayerId);
    map.addInteraction('places-mouseenter-interaction', {
        type: 'mouseenter',
        target: { layerId: 'nodes' },
        handler: (e) => mouseHoverEnter(e, map, popup)
    });
    map.addInteraction('places-mouseleave-interaction', {
        type: 'mouseleave',
        target: { layerId: 'nodes' },
        handler: () => mouseHoverLeave(map, popup)
    });
    map.on('click', 'nodes', (e) => clickOnNode(e, map, startNodeIdRef, startNodeRef, endNodeIdRef, setStartNode, setStartNodeId, setEndNode, setEndNodeId));
    
}