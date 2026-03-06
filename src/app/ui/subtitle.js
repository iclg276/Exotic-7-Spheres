/**
 * M(h, j) subtitle text for the current bundle params.
 */
export function createSubtitleUpdater(params) {
    return function updateSubtitle() {
        const subtitle = document.getElementById('subtitle');
        if (!subtitle) return;
        const j = params.trivialBundle ? (1 - params.i) : (2 - params.i);
        subtitle.textContent = `M(${params.i - 1}, ${j})`;
    };
}
