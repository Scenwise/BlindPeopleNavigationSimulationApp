import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import {blindPeoplePath} from '../resorces/edges';
import { Feature, FeatureCollection } from "geojson";
import {nodes} from '../resorces/nodes';

import { useAppSelector } from '../store';
import { LngLatLike } from 'mapbox-gl';

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
// mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

/**
 * Map and container used for initialization.
 */
type MapAndContainer = {
    setMap: React.Dispatch<React.SetStateAction<mapboxgl.Map | null>>;
    mapContainer: React.MutableRefObject<HTMLDivElement | null>;
};

const MapBoxContainer: React.FC = () => {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [miniMap, setMiniMap] = useState<mapboxgl.Map | null>(null);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const miniMapContainer = useRef<HTMLDivElement | null>(null);

    const mapStyle = useAppSelector((state) => state.slice.mapStyle);

    const [lng] = useState(4.3566763);
    const [lat] = useState(52.0070019);
    const [zoom, setZoom] = useState<number>(19);

    const [startNode, setStartNode] = useState<string>("");
    const [endNode, setEndNode] = useState<string>("");
    const startNodeRef = useRef<string>("");
    const endNodeRef = useRef<string>("");

    const [startNodeId, setStartNodeId] = useState<number>(0);
    const [endNodeId, setEndNodeId] = useState<number>(0);
    const startNodeIdRef = useRef<number>(0);
    const endNodeIdRef = useRef<number>(0);

    const OVERVIEW_DIFFERENCE = 4;
    const OVERVIEW_MIN_ZOOM = 5;
    const OVERVIEW_MAX_ZOOM = 10;

    // const selectedRouteID = useAppSelector((state) => state.slice.selectedRoute);


    /**
     * First initialization of map called on first render.
     */

    useEffect((): void => {
        if (true) {
            mapboxgl.accessToken = "pk.eyJ1IjoidHVkdGltMjEiLCJhIjoiY2tvYWQwczczMTJ6NTJwbXUydmVvbXFsZCJ9.ixIsrkMIvzJuWoGSMTKZmw";
        } else {
            throw new Error('Missing accesstoken for mapboxgl');
        }
        if (!map) initializeMap({ setMap, mapContainer });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    // Update the mini map style
    useEffect(() => {
        if (miniMap) {
            miniMap.setStyle('mapbox://styles/mapbox/' + mapStyle);
            // buildOverviewBounds(map, miniMap);
        }
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [mapStyle, miniMap]);

    useEffect(() => {
        console.log("StartNode useEffect:"+startNode);
        console.log("EndNode useEffect"+endNode);
        startNodeRef.current = startNode;
        endNodeRef.current = endNode;

        startNodeIdRef.current = startNodeId;
        endNodeIdRef.current = endNodeId;
        
    }, [startNode, endNode]);

    const buildOverviewZoom = (zoomAmount: number) => {
        return Math.min(Math.max(zoomAmount - OVERVIEW_DIFFERENCE, OVERVIEW_MIN_ZOOM), OVERVIEW_MAX_ZOOM);
    };

    /**
     * Initializaes the map with styles,
     * load the geoJSON for the public transport segments.
     * @param param0 setMap and mapContainer
     */
    //eslint-disable-next-line sonarjs/cognitive-complexity
    const initializeMap = ({ setMap, mapContainer }: MapAndContainer): void => {
        const map = new mapboxgl.Map({
            container: mapContainer.current as string | HTMLElement,
            style: 'mapbox://styles/mapbox/' + mapStyle,
            center: [lng, lat], //coordinates for Delft Station
            zoom: zoom,
        });

        const miniMap = new mapboxgl.Map({
            container: miniMapContainer.current as string | HTMLElement,
            style: 'mapbox://styles/mapbox/' + mapStyle,
            center: [lng, lat], //coordinates for Amsterdam
            zoom: buildOverviewZoom(zoom),
            maxZoom: 10,
            interactive: false,
            attributionControl: false,
        });


        miniMap.on('load', async () => {
            setMiniMap(miniMap);
            // buildOverviewBounds(map, miniMap);
        });

        map.on('load', async () => {

            map.addSource('blind-people-network-delft', {
                type: 'geojson',
                // Use a URL for the value for the `data` property.
                data: blindPeoplePath as FeatureCollection,
                generateId: true 
            });

            map.addLayer({
                'id': 'network',
                'type': 'line',
                'source': 'blind-people-network-delft',
                'layout': {},
                'paint': {
                    'line-color': '#000',
                    'line-width': 3
                }
            });


            map.addSource('nodes-blind-people-network-delft', {
                type: 'geojson',
                // Use a URL for the value for the `data` property.
                data: nodes as FeatureCollection
            });

            map.addLayer({
                'id': 'nodes',
                'type': 'circle',
                'source': 'nodes-blind-people-network-delft',
                'layout': {},
                'paint': {
                    'circle-radius': 6,
                    'circle-color': [
                        'case',
                        ['boolean', ['feature-state', 'clicked'], false],
                        '#007bff', // blue for clicked
                        '#000000'  // default color
                    ],
                    'circle-stroke-color': '#fff',
                    'circle-stroke-width': 1
                }
            });

            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            map.addInteraction('places-mouseenter-interaction', {
                type: 'mouseenter',
                target: { layerId: 'nodes' },
                handler: (e) => {
                map.getCanvas().style.cursor = 'pointer';

                // Copy the coordinates from the POI underneath the cursor
            
                const idNode = e.feature?.properties?.id as string;

                // Populate the popup and set its coordinates based on the feature found.
                popup
                    .setLngLat(e.lngLat)
                    .setHTML(`<span id=${idNode} >${idNode}</span>`)
                    .addTo(map);
                }
            });

            map.addInteraction('places-mouseleave-interaction', {
                type: 'mouseleave',
                target: { layerId: 'nodes' },
                handler: () => {
                    map.getCanvas().style.cursor = '';
                    popup.remove();
                }
            });

            map.on('click', 'nodes', (e) => {
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

                
                console.log(nodeId);
                map.setFeatureState({
                    source: 'nodes-blind-people-network-delft',
                    id: nodeId,
                }, {
                    clicked: true
                });
            });

            setMap(map);
            map.resize();
        });

        map.on('moveend', () => {
            const mapCenter = map.getCenter();
            const zoom = map.getZoom();
            setZoom(zoom);
            if (miniMap) {
                miniMap.flyTo({
                    center: [mapCenter.lng, mapCenter.lat],
                    zoom: buildOverviewZoom(zoom),
                });
            }
        });
    };

    const miniMapStyles: React.CSSProperties = {
        width: '20%',
        height: '20%',
        position: 'absolute',
        border: 'solid blue',
        bottom: `${0 + 5}px`, // Adjusted bottom property
        right: '3px',
        zIndex: 100,
        display: zoom >= 10 ? 'flex' : 'none',
    };
    const mapStyles: React.CSSProperties = {
        width: '100%',
        height: '90%',
        position: 'absolute',
        top: '10%',
        zIndex: -1,
    };

    const navigate = async ()  => {

        const response = await fetch(`http://159.223.223.232:8081/graphVertex/edgesShortestPath/159/${startNode}/${endNode}`, {
            method: "GET", // or "GET", "PUT", etc.
            headers: {
                "Content-Type": "application/geo+json",
                'Accept': '*/*'
            }
        });
        const data = await response.json();
        if(map?.getSource('blind-people-route-delft') && map?.isSourceLoaded('blind-people-route-delft')){
            map?.removeLayer('route')
            map?.removeSource('blind-people-route-delft')
        }
                

        map?.addSource('blind-people-route-delft', {
                type: 'geojson',
                // Use a URL for the value for the `data` property.
                data: data as FeatureCollection,
                generateId: true 
            });

        map?.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'blind-people-route-delft',
            'layout': {},
            'paint': {
                'line-color': '#F7455D',
                'line-width': 3
            }
        });

        map?.setFeatureState(
            { source: 'nodes-blind-people-network-delft', id: endNodeId },
            { clicked: false }
        );

        map?.setFeatureState(
            { source: 'nodes-blind-people-network-delft', id: startNodeId },
            { clicked: false }
        );

        startNodeIdRef.current=0;
        endNodeIdRef.current = 0;
        setEndNodeId(endNodeIdRef.current);
        setStartNodeId(startNodeIdRef.current);

        startNodeRef.current="";
        endNodeRef.current = "";
        setEndNode(endNodeRef.current);
        setStartNode(startNodeRef.current);
    }

    return (
        <>
            {
             endNode!=""?   <div><span>{`From Node Id: ${startNode}, To Node Id: ${endNode}`}</span></div>:<div></div>
            }
            {
             endNode!=""? <div><button onClick={async ()=>await navigate()}>{`Navigate!`}</button></div>:<div></div>
            }
            <div style={mapStyles} ref={(el) => {mapContainer.current = el}} />
            <div style={miniMapStyles} ref={(el) => {miniMapContainer.current = el}} />
        </>
    );
};

export default MapBoxContainer;