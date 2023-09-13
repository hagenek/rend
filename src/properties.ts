import { Scene } from "@novorender/webgl-api";

export function initProperties(scene: Scene): (id?: number) => Promise<void> {
    let active = true;
    const propertiesPanel = document.getElementById(
        "properties_panel"
    ) as HTMLPreElement;
    const propertiesButton = document.getElementById("properties_button")!;

    // Toggle UI
    propertiesButton.addEventListener("click", async () => {
        active = !active;

        if (active) {
            propertiesButton.classList.add("active");
            propertiesPanel.classList.remove("hidden");
        } else {
            propertiesButton.classList.remove("active");
            propertiesPanel.classList.add("hidden");
        }
    });

    // Load metadata and display in panel
    return async (id) => {
        if (!id) {
            propertiesPanel.innerText = "";
        } else {
            try {
                const objectData = await scene.getObjectReference(id).loadMetaData();
                propertiesPanel.innerText = JSON.stringify(objectData, undefined, 2);
            } catch (e) {
                propertiesPanel.innerText = "An error occured while loading properties";
            }
        }
    };
};