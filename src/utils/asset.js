// Turns a /public path ('/projects/kia/cover.jpg') into a URL that also works
// when the site is deployed under a sub-path (vite `base`).
export const assetUrl = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '')
