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

    const [startNode, setStartNode] = useState<String>("");
    const [endNode, setEndNode] = useState<String>("");

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
                data: blindPeoplePath as FeatureCollection
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
                    'line-color': '#000',
                    'line-width': 3
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
            
                const id = e.feature?.properties?.id as string;

                // Populate the popup and set its coordinates based on the feature found.
                popup
                    .setLngLat(e.lngLat)
                    .setHTML(id)
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

            map.addInteraction('places-click-interaction', {
                type: 'click',
                target: { layerId: 'nodes' },
                handler: (e) => {
                    // Copy coordinates array.
                    const id = e.feature?.properties?.id as string;
                    console.log("Clicked");
                    setEndNode(startNode)
                    setStartNode(id);

                    console.log(startNode);
                    console.log(endNode);

                    if(startNode != "" && endNode != ""){
                        console.log("Send request to get Route");
                    }
                }
                
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
                // buildOverviewBounds(map, miniMap);
            }
        });
    };

    // Put the over bounds on the mini box.
    // const buildOverviewBounds = (map: mapboxgl.Map | null, miniMap: mapboxgl.Map) => {
    //     if (miniMap && map) {
    //         // REMOVE OLD BOUNDS
    //         if (miniMap.getSource('parentOutline')) {
    //             miniMap.removeLayer('parentOutlineOutline');
    //             miniMap.removeLayer('parentOutlineFill');
    //             miniMap.removeSource('parentOutline');
    //         }

    //         // GENERATE NEW BOUNDS
    //         if (map.getZoom() > 5.25) {
    //             const bounds = [];
    //             const parentMapBounds = map.getBounds();
    //             const ne = [parentMapBounds._ne.lng, parentMapBounds._ne.lat];
    //             const se = [parentMapBounds._ne.lng, parentMapBounds._sw.lat];
    //             const sw = [parentMapBounds._sw.lng, parentMapBounds._sw.lat];
    //             const nw = [parentMapBounds._sw.lng, parentMapBounds._ne.lat];
    //             bounds.push(ne, se, sw, nw, ne);
    //             // CREATE GEONJSON FEATURES ON OVERVIEW MAP LINKED TO BOUND
    //             miniMap.addSource('parentOutline', {
    //                 type: 'geojson',
    //                 data: {
    //                     type: 'Feature',
    //                     geometry: {
    //                         type: 'Polygon',
    //                         coordinates: [bounds],
    //                     },
    //                     properties: {},
    //                 },
    //             });

    //             // ADD FILL TO POLYGON LAYER
    //             miniMap.addLayer({
    //                 id: 'parentOutlineFill',
    //                 type: 'fill',
    //                 source: 'parentOutline', // reference the data source
    //                 layout: {},
    //                 paint: {
    //                     'fill-color': '#0080ff', // blue color fill
    //                     'fill-opacity': 0.3,
    //                 },
    //             });

    //             // ADD OUTLINE TO POLYGON LAYER
    //             miniMap.addLayer({
    //                 id: 'parentOutlineOutline',
    //                 type: 'line',
    //                 source: 'parentOutline',
    //                 layout: {},
    //                 paint: {
    //                     'line-color': '#0080ff',
    //                     'line-width': 1,
    //                 },
    //             });
    //         }
    //     }
    // };


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
        height: '100%',
        position: 'absolute',
        top: '0px',
        zIndex: -1,
    };

    return (
        <>
            <div style={mapStyles} ref={(el) => {mapContainer.current = el}} />
            <div style={miniMapStyles} ref={(el) => {miniMapContainer.current = el}} />
        </>
    );
};

export default MapBoxContainer;