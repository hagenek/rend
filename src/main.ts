import {
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
import { initProperties } from "./properties";

function addClickHandlers(view: View) {
  const storedCameraStates: Array<{ position: number[], rotation: number[] }> = [];

  const positionButtons = [
    document.getElementById("position-one"),
    document.getElementById("position-two"),
    document.getElementById("position-three")
  ];

  positionButtons.forEach((button, index) => {
    if (!button) return;

    button.addEventListener("click", async (event: MouseEvent) => {
      if (event.shiftKey && event.button === 0) {
        storedCameraStates[index] = {
          position: [...view.camera.position],
          rotation: [...view.camera.rotation]
        };
        console.log(`Saved position for button ${index + 1}`);
      } else if (event.button === 0) {
        const storedState = storedCameraStates[index];
        if (storedState) {
          const moveToPosition = vec3.fromValues(...storedState.position);
          const moveToRotation = quat.fromValues(...storedState.rotation);

          view.camera.controller.moveTo(moveToPosition, moveToRotation);

          console.log(`Moved to stored position for button ${index + 1}`);
        } else {
          console.log(`No stored position for button ${index + 1}`);
        }
      }
    });
  });
}


const api = createAPI({
  scriptBaseUrl: window.location.origin + "/novorender/webgl-api/",
});
const canvas = document.getElementById("3d_canvas") as HTMLCanvasElement;
const access_token = localStorage.getItem("access_token");
// Initialize the data API with the Novorender data server service
const dataApi = createDataAPI({
  serviceUrl: "https://data.novorender.com/api",
  authHeader: async () => ({
    header: "Authorization",
    value: access_token ?? "",
  }),
});

function initHighlighter(view: View, scene: Scene): (ids: number[]) => void {
  // Init highlights with green as highlight color
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
    // Reset highlight of all objects
    scene.objectHighlighter.objectHighlightIndices.fill(1);
    // Set new highlight on selected objects
    ids.forEach(
      (id) => (scene.objectHighlighter.objectHighlightIndices[id] = 0)
    );
    scene.objectHighlighter.commit();
  };
}



async function main(): Promise<void> {
  try {
    const view = await initView();
    addClickHandlers(view);
    const scene = view.scene!;
    run(view, canvas);

    // Show HUD and init the extra functionality
    document.querySelector(".hud")?.classList.remove("hidden");
    const displayProperties = initProperties(scene);
    const highlight = initHighlighter(view, scene);

    initSearch(scene, (result: HierarcicalObjectReference[]) => {
      const ids = result.map((obj) => obj.id);
      highlight(ids);
      displayProperties(ids.at(-1));
    });

  } catch (e) {
    // Handle errors however you like
    // Here we just redirect to login page if user is not autorized to acces scene
    const isNotAuthorized =
      e &&
      typeof e === "object" &&
      "error" in e &&
      typeof e.error === "string" &&
      e.error.toLowerCase() === "not authorized";

    if (isNotAuthorized) {
      localStorage.removeItem("access_token");
      window.location.replace("/login/index.html");
    } else {
      console.warn(e);
    }
  }
}

// Load scene and initialize the 3D view
async function initView() {
  // Load scene metadata
  const sceneData = await dataApi
    // Condos scene ID, but can be changed to any scene ID
    .loadScene("95a89d20dd084d9486e383e131242c4c")
    .then((res) => {
      if ("error" in res) {
        throw res;
      } else {
        return res;
      }
    });

  // Destructure relevant properties into variables
  const { url, db, settings, camera: cameraParams } = sceneData;

  // Load scene
  const scene = await api.loadScene(url, db);

  // Create a view with the scene's saved settings
  const view = await api.createView(settings, canvas);

  // Set resolution scale to 1
  view.applySettings({ quality: { resolution: { value: 1 } } });

  // Create a camera controller with the saved parameters with turntable as fallback
  const camera = cameraParams ?? ({ kind: "flight" } as any);
  view.camera.controller = api.createCameraController(camera, canvas);

  // Assign the scene to the view
  view.scene = scene;

  return view;
}

// Run render loop
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

main();