import Store from 'electron-store';
const store = new Store();


export function get(itemKey, defaultValue) {
    return store.get(itemKey, defaultValue)
}
export function set(itemKey, data) {
    store.set(itemKey, data)
}
