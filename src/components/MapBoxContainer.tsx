import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import {blindPeoplePath} from '../resorces/edges';
import { FeatureCollection, LineString } from "geojson";
import {nodes} from '../resorces/nodes';
import image from '../resorces/triangle.png';
import { calculateBearing } from '../functions/bearing';

import { useAppSelector } from '../store';
import { getOnEdgePosition } from '../functions/getOnEdgePosition';
import { orderEdgesOnSequence } from '../functions/orderEdgesInSequence';
import { getNaVigationCommandBasedonTrianglePosition } from '../functions/getNaVigationCommandBasedonTrianglePosition';
import * as THREE from 'three';
import { mainMapOnLoad } from '../mapsInitialization/mainMap/mainMapOnLoad';
import { miniMapStyles } from '../mapsInitialization/miniMap/miniMapStyles';
import { mapStyles } from '../mapsInitialization/mainMap/mapStyles';
import { initMainMap } from '../mapsInitialization/mainMap/initMainMap';
import { initMiniMap } from '../mapsInitialization/miniMap/initMiniMap';
import { clearMapSourceAndLayer } from '../mapsInitialization/mapClearence';
import { blindPeopleRouteDelft } from '../mapsInitialization/mainMap/mainMapData/blindPeopleNetworkDelft';
import { blindPeoplePathDelftLayer } from '../mapsInitialization/mainMap/mainMapData/blindPeoplePathDelftLayer';
import { imageLoader } from '../functions/imageLoader';
import { pointSource } from '../mapsInitialization/miniMap/pointSource';
import { miniTriangleLayer } from '../mapsInitialization/miniMap/miniTriangleLayer';
import { personShadowLayer } from '../mapsInitialization/mainMap/mainMapData/personShadowLayer';
import { getShortestPath } from '../functions/restClient';
import { add3DPersonLayer } from '../3dInitialization';
import { updatePosition } from '../functions/positionUpdate';
import { speakCommand } from '../functions/speakCommand';
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
    const [followMode, setFollowMode] = useState(false);

    const personModelRef = useRef<THREE.Object3D | null>(null);

    // const selectedRouteID = useAppSelector((state) => state.slice.selectedRoute);


    /**
     * First initialization of map called on first render.
     */

    useEffect((): void => {
        if (true) {
            mapboxgl.accessToken = "pk.eyJ1IjoicmFkb3NsYXZzMjAwMSIsImEiOiJjbWV3dDk5bzIwcnAwMmtxeDFudGRxZzBhIn0.GWQEvmGKfV2crLdj0BP_CQ";
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

    /**
     * Initializaes the map with styles,
     * load the geoJSON for the public transport segments.
     * @param param0 setMap and mapContainer
     */

    const initializeMap = ({ setMap, mapContainer }: MapAndContainer): void => {
        const map = initMainMap(lng, lat, mapStyle, zoom, mapContainer);
        const miniMap = initMiniMap(lng, lat, mapStyle, zoom, miniMapContainer);


        miniMap.on('load', async () => {
            setMiniMap(miniMap);
        });

        map.on('load', async () => {
            mainMapOnLoad(map, blindPeoplePath as FeatureCollection, nodes as FeatureCollection, startNodeIdRef, startNodeRef, endNodeIdRef, setStartNode, setStartNodeId, setEndNode, setEndNodeId);
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
                    zoom: miniMap.getZoom(),
                });
            }
        });
    };



    const navigate = async ()  => {

        const data = await getShortestPath(startNode, endNode);
        clearMapSourceAndLayer('blind-people-route-delft', 'route', map);
        clearMapSourceAndLayer(triangleSourceId, 'triangle-layer', map);
        clearMapSourceAndLayer('mini-triangle', 'mini-triangle-layer', miniMap);
        clearMapSourceAndLayer('person-shadow', 'person-shadow-layer', map);


        const coordinates = nodes.features[startNodeId-1].geometry.coordinates;
        data.features = orderEdgesOnSequence(data.features, coordinates);
                

        map?.addSource('blind-people-route-delft', blindPeopleRouteDelft(data));
        map?.addLayer(blindPeoplePathDelftLayer);

        miniMap?.addSource('blind-people-route-delft', blindPeopleRouteDelft(data));
        miniMap?.addLayer(blindPeoplePathDelftLayer);

        map?.setFeatureState(
            { source: 'nodes-blind-people-network-delft', id: endNodeId },
            { clicked: false }
        );

        map?.setFeatureState(
            { source: 'nodes-blind-people-network-delft', id: startNodeId },
            { clicked: false }
        );

        map?.loadImage(image, (error, loadedImage) => imageLoader(error, loadedImage, 'custom-triangle', map));

        setNavigationPath(data);
        
        const startingEdge = getOnEdgePosition(data.features, coordinates);
        const [bearing, edgeCoordinates] = calculateBearing(startingEdge?.geometry.coordinates[0] as [number, number], startingEdge?.geometry.coordinates[1] as [number, number], coordinates as [number, number]);
        setCurrentEdgeGeometry(edgeCoordinates);
        setCurrEdgeIndex(0);

        await initPersonLayer(coordinates as [number, number], bearing)
        
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

        miniMap?.addSource('mini-triangle', pointSource(data));
        miniMap?.loadImage(image, (error, loadedImage) => imageLoader(error, loadedImage, 'mini-triangle-icon', miniMap));
        miniMap?.addLayer(miniTriangleLayer(bearing));

        map?.addSource('person-shadow', pointSource(coordinates as [number, number]));
        map?.addLayer(personShadowLayer, "3d-person");
    }

    const initPersonLayer = async (coordinates: [number, number], bearing: number) => {
            if(map!=null && coordinates.at(0) != undefined ){
            await addPersonLayer(map, coordinates.at(0) as number, coordinates.at(1) as number);
            setFollowMode(true); // 👈 enable follow mode
            followPerson(coordinates.at(0) as number, coordinates.at(1) as number, bearing);
        }
    }

    const addPersonLayer = async (map: mapboxgl.Map, lng: number, lat: number) => {
        personModelRef.current = await add3DPersonLayer(map, lng, lat);
    };

    const updatePositions = (lng: number, lat: number, bearing: number) => {
        updatePosition.person3DPosition(lng, lat, bearing, personModelRef);
        updatePosition.miniMapTriangle(miniMap, lng, lat, bearing);
        updatePosition.shadow3DPerson(map, lng, lat)
        map?.triggerRepaint();
    };

    const followPerson = (lng: number, lat: number, bearing: number) => {
        if (!map || !followMode) return;

        map.easeTo({
            center: [lng, lat],
            zoom: 30,          // closer view
            bearing: bearing,  // rotate with the person
            pitch: 75,         // tilt for 3D
            duration: 500,     // smooth transition
            essential: true
        });
    };

    const nextPositionOfMovement = (direction: 'up' | 'down' | 'left' | 'right') => {
        const [newLng, newLat, rotation, edgeIndex, edgeCoordinates] = updatePosition.nextPosition(triangleState, direction, currEdgeIndex, navigationPath, currentEdgeGeometry);
        setCurrEdgeIndex(edgeIndex)
        setCurrentEdgeGeometry(edgeCoordinates)
        setTriangleState({ coordinates: [newLng, newLat], rotation });
        updatePositions(newLng, newLat, rotation);
        followPerson(newLng, newLat, rotation);
        navigationPath.features[edgeIndex].geometry.coordinates = edgeCoordinates
        let newNavigationCommand:string;
        if(edgeIndex+1<navigationPath.features.length){
            newNavigationCommand = getNaVigationCommandBasedonTrianglePosition(triangleState.coordinates, navigationPath.features[edgeIndex], navigationPath.features[edgeIndex+1]);
            if(newNavigationCommand != navigationCommand){
                speakCommand(newNavigationCommand);
            }
            setNavigationCommand(newNavigationCommand);
            
        }else {
            newNavigationCommand = getNaVigationCommandBasedonTrianglePosition(triangleState.coordinates, navigationPath.features[edgeIndex], null);
            if(newNavigationCommand != navigationCommand){
                speakCommand(newNavigationCommand);
            }
            setNavigationCommand(newNavigationCommand);
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
                    <button onClick={() => nextPositionOfMovement('up')}>↑</button>

                    {/* Left + Right side by side */}
                    <div style={{ marginTop: "5px" }}>
                        <button onClick={() => nextPositionOfMovement('left')}>←</button>
                        <button style={{ marginLeft: "5px" }} onClick={() => nextPositionOfMovement('right')}>→</button>
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