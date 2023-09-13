import { HierarcicalObjectReference, Scene } from "@novorender/webgl-api";

export async function initSearch(
    scene: Scene,
    callback: (result: HierarcicalObjectReference[]) => void
): Promise<void> {
    let loading = false;
    let active = true;
    let abortController = new AbortController();
    const form = document.getElementById("search_panel") as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    const searchButton = document.getElementById("search_button")!;

    // Toggle UI
    searchButton.addEventListener("click", async () => {
        active = !active;

        if (active) {
            searchButton.classList.add("active");
            form.classList.remove("hidden");
        } else {
            searchButton.classList.remove("active");
            form.classList.add("hidden");
        }
    });

    // Handle search
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const query = input.value;
        if (!query) {
            return;
        }

        // Abort last search if called again before it has finished
        if (loading) {
            abortController.abort();
            abortController = new AbortController();
        }

        const abortSignal = abortController.signal;
        loading = true;

        try {
            const iterator = scene.search({ searchPattern: query }, abortSignal);
            const result: HierarcicalObjectReference[] = [];

            for await (const obj of iterator) {
                result.push(obj);
            }

            loading = false;

            callback(result);
        } catch (e) {
            console.warn(e);
        }
    });
}
