import mapboxgl, { Map } from "mapbox-gl"

export const initMainMap = (lng: number, lat: number, mapStyle: string, zoom: number, mapContainer: React.MutableRefObject<HTMLDivElement | null>): Map => {
    return new mapboxgl.Map({
            container: mapContainer.current as string | HTMLElement,
            style: 'mapbox://styles/mapbox/' + mapStyle,
            center: [lng, lat], //coordinates for Delft Station
            zoom: zoom,
            pitch: 30,
            bearing: -20,
        })
}