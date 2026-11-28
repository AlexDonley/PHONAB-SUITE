export function mapKeysToFunctions(dict) {
    window.addEventListener('keydown', (e) => {
        const action = dict[e.key];
        if (action) {
            e.preventDefault();
            action(e);
        }
    });
}