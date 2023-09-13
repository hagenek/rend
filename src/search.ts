import { HierarcicalObjectReference, Scene } from "@novorender/webgl-api";

async function getSearchResult(scene: Scene, query: string, abortSignal: AbortSignal): Promise<HierarcicalObjectReference[]> {
    const iterator = scene.search({ searchPattern: query }, abortSignal);
    const result: HierarcicalObjectReference[] = [];

    for await (const obj of iterator) {
        result.push(obj);
    }
    return result;
}

export async function initSearch(
    scene: Scene,
    callback: (result: HierarcicalObjectReference[]) => void
): Promise<void> {
    let loading = false;
    let abortController = new AbortController();
    const form = document.getElementById("search_panel") as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;

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
            const result: HierarcicalObjectReference[] = await getSearchResult(scene, query, abortSignal);
            loading = false;
            callback(result);
        } catch (error) {
            console.warn(error);
            throw error;
        }
    });
}