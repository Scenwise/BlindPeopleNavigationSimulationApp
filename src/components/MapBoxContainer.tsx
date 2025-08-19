import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import {blindPeoplePath} from '../resorces/edges';
import { FeatureCollection, LineString } from "geojson";
import {nodes} from '../resorces/nodes';
import image from '../resorces/triangle.png';
import { calculateBearing } from '../functions/bearing';
import { moveForwardAlongLineByPositionBearingStep } from '../functions/moveForwardAlongLine';

import { useAppSelector } from '../store';
import { getOnEdgePosition, getOnEdgePosition2 } from '../functions/getOnEdgePosition';
import { orderEdgesOnSequence } from '../functions/orderEdgesInSequence';
import { getNaVigationCommandBasedonTrianglePosition } from '../functions/getNaVigationCommandBasedonTrianglePosition';
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

    const [currentEdgeGeometry, setCurrentEdgeGeometry] = useState<[[number, number], [number, number]]>([[0,0], [0,0]])

    const [triangleState, setTriangleState] = useState<{
        coordinates: [number, number];
        rotation: number;
        }>({
        coordinates: [0, 0],
        rotation: 0
    });

    const [navigationPath, setNavigationPath] = useState<FeatureCollection<LineString>>({} as FeatureCollection<LineString>)
    const [navigationCommand, setNavigationCommand] = useState<string>("");
    const [currEdgeIndex, setCurrEdgeIndex] = useState<number>(-1);
    const triangleSourceId = 'triangle-marker';

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
        startNodeRef.current = startNode;
        endNodeRef.current = endNode;

        startNodeIdRef.current = startNodeId;
        endNodeIdRef.current = endNodeId;
        
    }, [endNode, endNodeId, startNode, startNodeId]);

    const buildOverviewZoom = (zoomAmount: number) => {
        return Math.min(Math.max(zoomAmount - OVERVIEW_DIFFERENCE, OVERVIEW_MIN_ZOOM), OVERVIEW_MAX_ZOOM);
    };

    /**
     * Initializaes the map with styles,
     * load the geoJSON for the public transport segments.
     * @param param0 setMap and mapContainer
     */

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
                    .setHTML(`<span id=${idNode} >${idNode}, ${e.lngLat}</span>`)
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

        if(map?.getSource(triangleSourceId) && map?.isSourceLoaded(triangleSourceId)){
            map?.removeLayer('triangle-layer')
            map?.removeSource(triangleSourceId)
        }

        const coordinates = nodes.features[startNodeId-1].geometry.coordinates;
        data.features = orderEdgesOnSequence(data.features, coordinates);
                

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

        map?.loadImage(image, (error, loadedImage) => {
            if (error || !loadedImage) {
                console.error("Error loading triangle image:", error);
                return;
            }
            if (!map.hasImage('custom-triangle')) {
                map.addImage('custom-triangle', loadedImage);
            }
        });

        setNavigationPath(data);
        
        const startingEdge = getOnEdgePosition(data.features, coordinates);
        const [bearing, edgeCoordinates] = calculateBearing(startingEdge?.geometry.coordinates[0] as [number, number], startingEdge?.geometry.coordinates[1] as [number, number], coordinates as [number, number]);
        setCurrentEdgeGeometry(edgeCoordinates);
        setCurrEdgeIndex(0);
        map?.addSource(triangleSourceId, {
            type: 'geojson',
            data: {
            type: 'FeatureCollection',
            features: [
                {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                properties: { rotation: bearing }
                }
            ]
            }
        });

        map?.addLayer({
            id: 'triangle-layer',
            type: 'symbol',
            source: triangleSourceId,
            layout: {
            'icon-image': 'custom-triangle',
            'icon-size': 1.5,
            'icon-rotate': ['get', 'rotation'],
            'icon-allow-overlap': true
            }
        });

        // Set triangle state AFTER layer is added
        setTriangleState({
            coordinates: coordinates as [number, number],
            rotation: bearing
        });

        startNodeIdRef.current=0;
        endNodeIdRef.current = 0;
        setEndNodeId(endNodeIdRef.current);
        setStartNodeId(startNodeIdRef.current);

        startNodeRef.current="";
        endNodeRef.current = "";
        setEndNode(endNodeRef.current);
        setStartNode(startNodeRef.current);
    }

    const updateTrianglePosition = (lng: number, lat: number, rotation: number) => {
        const source = map?.getSource(triangleSourceId) as mapboxgl.GeoJSONSource;
        if (!source) return;

        const updatedData: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                properties: {
                    rotation
                }
            }
            ]
        };

        source.setData(updatedData);
    };

    const moveTriangle = (direction: 'up' | 'down' | 'left' | 'right') => {
        const [lng, lat] = triangleState.coordinates;
    
        let newLng = lng;
        let newLat = lat;
        let rotation = triangleState.rotation;

        let index = currEdgeIndex;
        moveForwardAlongLineByPositionBearingStep(triangleState.coordinates, triangleState.rotation, 1);
        switch (direction) {
            case 'up':
            [newLng, newLat] = moveForwardAlongLineByPositionBearingStep(triangleState.coordinates, triangleState.rotation, 1);
            const [edgePosition, edgeIndex] = getOnEdgePosition2(navigationPath.features, [newLng, newLat])
            if(edgePosition!=null){
                const [bearing, edgeCoordinates] = calculateBearing(edgePosition?.geometry.coordinates[0] as [number, number], edgePosition?.geometry.coordinates[1] as [number, number], [newLng, newLat]);
                setCurrentEdgeGeometry(edgeCoordinates)
                rotation = bearing;
                index = edgeIndex;
                setCurrEdgeIndex(edgeIndex)
            }
            break;
            case 'right':
            rotation+=10;
            break;
            case 'left':
            rotation-=10;
            break;
        }

        setTriangleState({ coordinates: [newLng, newLat], rotation });
        updateTrianglePosition(newLng, newLat, rotation);
        if(index+1<navigationPath.features.length){
            console.log(getNaVigationCommandBasedonTrianglePosition(triangleState.coordinates, currentEdgeGeometry, navigationPath.features[index+1]))
            setNavigationCommand(getNaVigationCommandBasedonTrianglePosition(triangleState.coordinates, currentEdgeGeometry, navigationPath.features[index+1]));
        }else {
            console.log(getNaVigationCommandBasedonTrianglePosition(triangleState.coordinates, currentEdgeGeometry, navigationPath.features[index+1]))
            setNavigationCommand(getNaVigationCommandBasedonTrianglePosition(triangleState.coordinates, currentEdgeGeometry, null));
        }
    };

    return (
        <>
        <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            width: "100%",
            padding: "10px"
        }}>
            {/* Left side */}
            <div>
                {endNode !== "" ? (
                    <div><span>{`From Node Id: ${startNode}, To Node Id: ${endNode}`}</span></div>
                ) : <div></div>}
                {endNode !== "" ? (
                    <div><button onClick={async ()=>await navigate()}>{`Navigate!`}</button></div>
                ) : <div></div>}
                </div>

                {/* Center */}
                <div>{navigationCommand}</div>

                {/* Right side */}
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    marginRight: "5%" 
                }}>
                {/* Up button */}
                    <button onClick={() => moveTriangle('up')}>↑</button>

                    {/* Left + Right side by side */}
                    <div style={{ marginTop: "5px" }}>
                        <button onClick={() => moveTriangle('left')}>←</button>
                        <button style={{ marginLeft: "5px" }} onClick={() => moveTriangle('right')}>→</button>
                    </div>
                </div>
            </div>

            {/* Map sections below */}
            <div style={mapStyles} ref={(el) => {mapContainer.current = el}} />
            <div style={miniMapStyles} ref={(el) => {miniMapContainer.current = el}} />
        </>
    );
};

export default MapBoxContainer;