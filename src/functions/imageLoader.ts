import { Map } from "mapbox-gl";

export const imageLoader = (error : Error | null | undefined, loadedImage : ImageBitmap | HTMLImageElement | ImageData | null | undefined, imageName: string, map: Map|null) => {
            if (error || !loadedImage) {
                console.error("Error loading triangle image:", error);
                return;
            }
            if (!map?.hasImage(imageName)) {
                map?.addImage(imageName, loadedImage);
            }
        }