import { CustomLayerInterface, Map, MercatorCoordinate } from "mapbox-gl";
import * as THREE from 'three';
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export const createPersonModel = (gltf: GLTF, lng: number, lat: number, bearing: number): THREE.Object3D => {
    const mercatorCoord = MercatorCoordinate.fromLngLat([lng, lat], 0);
    const scale = mercatorCoord.meterInMercatorCoordinateUnits();
    const personModel: THREE.Object3D = gltf.scene;
    const box = new THREE.Box3().setFromObject(personModel);
    const size = new THREE.Vector3();
    box.getSize(size); // size.y = height in model units

    const desiredHeight = 3; // meters
    const scaleFactor = (scale * desiredHeight) / size.y;
    console.log(scaleFactor)
    personModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
    personModel.rotation.x = Math.PI / 2;
    personModel.rotation.y = Math.PI;
    personModel.position.set(mercatorCoord.x, mercatorCoord.y, mercatorCoord.z);
    personModel.rotation.y = bearing;
    
    return personModel
}

export const addLight = (): THREE.DirectionalLight => {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, -70, 100).normalize();
    return light;
}

export const custom3DLayerInterface = (map: Map, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): CustomLayerInterface => {
    return {
        id: "3d-person",
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map: mapboxgl.Map, gl: WebGLRenderingContext) {
            renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
            });
            renderer.autoClear = false;
        },

        render: function (_gl: WebGLRenderingContext, matrix: number[]) {
            const m = new THREE.Matrix4().fromArray(matrix);
            camera.projectionMatrix = m;
            renderer.resetState();
            renderer.render(scene, camera);
            // tell mapbox the layer has been updated
            map.triggerRepaint();
        },
    };
}

export const add3DPersonLayer = async (
    map: mapboxgl.Map,
    lng: number,
    lat: number,
    bearing: number
): Promise<THREE.Object3D> => {
    return new Promise((resolve, reject) => {
        const camera = new THREE.Camera();
        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: map.painter.context.gl,
            antialias: true,
        });
        renderer.autoClear = false;

        const loader = new GLTFLoader();
        loader.load(
            "https://my-3d-person-model.netlify.app/some_random_shape.glb",
            (gltf) => {
                const personModel = createPersonModel(gltf, lng, lat, bearing);

                // Add light + model to scene
                scene.add(addLight());
                scene.add(personModel);

                // Add custom 3D layer to Mapbox
                map.addLayer(
                    custom3DLayerInterface(map, scene, camera, renderer),
                    "3d-buildings"
                );

                resolve(personModel); // ✅ model ready
            },
            undefined,
            (error) => reject(error) // handle load error
        );
    });
};