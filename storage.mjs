import Store from 'electron-store'

const store = new Store()

export function getItem(itemKey) {
    return store.get(itemKey)
}
export function setItem(itemKey, data) {
    store.set(itemKey, data)
}



//  runOnStartup?
//  autoUpdate?


// persistentWinBounds = {
//     "console": {
//         "maximized": true,
//         "bounds": {}
//     },
//     "feedWins": [
//         {
//             "maximized": true,
//             "bounds": {}
//         },
//         {
//             "maximized": true,
//             "bounds": {}
//         },
//         {
//             "maximized": true,
//             "bounds": {}
//         }
//     ]
// }