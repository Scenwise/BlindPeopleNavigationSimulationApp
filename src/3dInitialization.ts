import { CustomLayerInterface, Map, MercatorCoordinate } from "mapbox-gl";
import * as THREE from 'three';

export const createPersonModel = (
    texture: THREE.Texture,
    lng: number,
    lat: number
): THREE.Object3D => {
    const mercatorCoord = MercatorCoordinate.fromLngLat([lng, lat], 0);
    const scale = mercatorCoord.meterInMercatorCoordinateUnits();

    const personHeight = 3; // meters
    const personWidth = 1.2; // meters

    const geometry = new THREE.PlaneGeometry(
        personWidth * scale,
        personHeight * scale
    );

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
    });

    const personModel = new THREE.Mesh(geometry, material);

    // Position so feet are on the ground
    personModel.position.set(
        mercatorCoord.x,
        mercatorCoord.y,
        mercatorCoord.z + (personHeight * scale) / 2
    );

    // ✅ Stand it upright (green plane was correct)
    personModel.rotation.x = Math.PI / 2;

    return personModel;
};

export const addLight = (): THREE.DirectionalLight => {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, -70, 100).normalize();
    return light;
}

export const custom3DLayerInterface = (map: Map, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, personModel: THREE.Object3D): CustomLayerInterface => {
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

            if (personModel) {
                personModel.up.set(0, 0, 1);
                personModel.lookAt(camera.position);
            }

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
    lat: number
): Promise<THREE.Object3D> => {
    return new Promise((resolve, reject) => {
        const camera = new THREE.Camera();
        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: (map).painter.context.gl,
            antialias: true,
        });
        renderer.autoClear = false;

        const loader = new THREE.TextureLoader();
        loader.load(
            "https://my-3d-person-model.netlify.app/transparent_man.png",
            (texture) => {
                const personModel = createPersonModel(texture, lng, lat);

                // Add light + model
                scene.add(addLight());
                scene.add(personModel);

                // Attach custom layer
                map.addLayer(
                    custom3DLayerInterface(map, scene, camera, renderer, personModel),
                    "3d-buildings"
                );
                resolve(personModel);
            },
            undefined,
            (error) => reject(error)
        );
    });
};

export const addAxisPlanes = (
  scene: THREE.Scene,
  mercatorCoord: mapboxgl.MercatorCoordinate,
  scale: number
) => {
  const size = 3 * scale;

  // Red = XY plane (default THREE.PlaneGeometry)
  const xy = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  xy.position.set(mercatorCoord.x, mercatorCoord.y, mercatorCoord.z + size / 2);
  scene.add(xy);

  // Green = XZ plane (rotated upright)
  const xz = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  xz.rotation.x = Math.PI / 2;
  xz.position.set(mercatorCoord.x + 2 * scale, mercatorCoord.y, mercatorCoord.z + size / 2);
  scene.add(xz);

  // Blue = YZ plane (rotated upright other way)
  const yz = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  yz.rotation.y = Math.PI / 2;
  yz.position.set(mercatorCoord.x - 2 * scale, mercatorCoord.y, mercatorCoord.z + size / 2);
  scene.add(yz);
};