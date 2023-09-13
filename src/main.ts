import {
  API,
  createAPI,
  HierarcicalObjectReference,
  Scene,
  View
} from "@novorender/webgl-api";
import { createAPI as createDataAPI } from "@novorender/data-js-api";
import { vec3, quat } from 'gl-matrix';

import "../index.css";
import "./main.css";
import { initSearch } from "./search";

interface StoredCameraState {
  position: number[],
  rotation: number[]
}

const storedCameraStates: StoredCameraState[] = [];

interface ButtonData {
  buttonIndex: number,
  event: MouseEvent
}

function attachEventToButton(view: View, storedCameraStates: StoredCameraState[], { buttonIndex, event }: ButtonData) {
  const storedState = storedCameraStates[buttonIndex];
  if (event.shiftKey && event.button === 0) {
    storeCameraState(view, storedCameraStates, buttonIndex);
  } else if (event.button === 0) {
    storedState && moveCameraToStoredPosition(view, storedState)
  }
}

function storeCameraState(view: View, storedCameraStates: StoredCameraState[], index: number) {
  storedCameraStates[index] = { position: [...view.camera.position], rotation: [...view.camera.rotation] }
}

function moveCameraToStoredPosition(view: View, storedState: StoredCameraState) {
  const { position, rotation } = storedState;
  const moveToPosition = vec3.fromValues(...(position as [number, number, number]));
  const moveToRotation = quat.fromValues(...(rotation as [number, number, number, number]));

  view.camera.controller.moveTo(moveToPosition, moveToRotation);
}

function addClickHandlersToPositionButtons(view: View) {
  const positionButtonsContainer = document.querySelector('#position-buttons');

  if (!positionButtonsContainer) {
    return;
  }

  const positionButtons = positionButtonsContainer.children as HTMLCollectionOf<HTMLButtonElement>;

  Array.from(positionButtons).forEach((button, index) => {
    button.addEventListener('click', (event: MouseEvent) =>
      attachEventToButton(view, storedCameraStates, { buttonIndex: index, event }));
  });
}

function setupAPI() {
  return createAPI({
    scriptBaseUrl: window.location.origin + "/novorender/webgl-api/",
  });
}

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function initDataAPI(access_token: string | null) {
  return createDataAPI({
    serviceUrl: "https://data.novorender.com/api",
    authHeader: async () => ({
      header: "Authorization",
      value: access_token ?? "",
    }),
  });
}

function applyViewSettings(view: View) {
  view.applySettings({ quality: { resolution: { value: 1 } } });
}

function setViewCamera(view: View, api: any, cameraParams: any, canvas: HTMLCanvasElement) {
  const camera = cameraParams ?? ({ kind: "flight" } as any);
  view.camera.controller = api.createCameraController(camera, canvas);
}

async function initView(api: any, dataApi: any, canvas: HTMLCanvasElement) {
  const sceneData = await dataApi
    .loadScene("95a89d20dd084d9486e383e131242c4c") // Condos scene ID, can be changed to any scene ID
    .then((res: any) => {
      if ("error" in res) {
        throw res;
      } else {
        return res;
      }
    });

  const { url, db, settings, camera: cameraParams } = sceneData;
  const scene = await api.loadScene(url, db);
  const view = await api.createView(settings, canvas);

  applyViewSettings(view);
  setViewCamera(view, api, cameraParams, canvas);
  view.scene = scene;

  return view;
}

async function run(view: View, canvas: HTMLCanvasElement): Promise<void> {
  // Handle canvas resizes
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
      view.applySettings({
        display: { width: canvas.width, height: canvas.height },
      });
    }
  });

  resizeObserver.observe(canvas);

  // Create a bitmap context to display render output
  const ctx = canvas.getContext("bitmaprenderer");

  // Main render loop
  while (true) {
    // Render frame
    const output = await view.render();
    {
      // Finalize output image
      const image = await output.getImage();
      if (image) {
        // Display in canvas
        ctx?.transferFromImageBitmap(image);
        image.close();
      }
    }
  }
}

function initHighlighter(view: View, api: API, scene: Scene): (ids: number[]) => void {
  view.settings.objectHighlights = [
    api.createHighlight({ kind: "neutral" }),
    api.createHighlight({ kind: "color", color: [0, 0, 0, 0] }),
  ];

  return (ids) => {
    if (!ids.length) {
      scene.objectHighlighter.objectHighlightIndices.fill(0);
      scene.objectHighlighter.commit();
      return;
    }
    scene.objectHighlighter.objectHighlightIndices.fill(1);
    ids.forEach(
      (id) => (scene.objectHighlighter.objectHighlightIndices[id] = 0)
    );
    scene.objectHighlighter.commit();
  };
}

async function main(): Promise<void> {
  try {
    const api = setupAPI();
    const canvas = document.getElementById("3d_canvas") as HTMLCanvasElement;
    const access_token = getAccessToken();
    const dataApi = initDataAPI(access_token);
    const view = await initView(api, dataApi, canvas);
    const highlight = initHighlighter(view, api, view.scene!);

    addClickHandlersToPositionButtons(view);
    run(view, canvas);

    document.querySelector(".hud")?.classList.remove("hidden");
    initSearch(view.scene!, (result: HierarcicalObjectReference[]) => {
      const ids = result.map((obj) => obj.id);
      highlight(ids);
    });
  } catch (e: any) {
    console.error(e.message);
  }
}

main()