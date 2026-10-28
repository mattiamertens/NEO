import { assetUrl } from '@/utils/asset'

// Lab projects (opened at /lab/:slug). Each entry = one folder: public/projects/lab/<slug>/
// - slug: unique, lowercase, same as the folder name
// - cover: thumbnail in the Lab grid
// - hero: big image on the project page (falls back to cover)
// - gallery: rendered in order, 2 per row; any length works (odd count → last image goes full width)
// `index` ([01], [02]…) comes from the order of this list.
const dir = (slug) => `/projects/lab/${slug}/`

export const labProjects = [
  {
    slug: 'nike',
    brand: 'NIKE',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    cover: 'cover.png',
    gallery: ['05.png', '06.png', '07.png'],
  },
  { slug: 'prism', brand: 'PRISM', description: '', cover: 'cover.jpg', gallery: [] },
  { slug: 'echo', brand: 'ECHO', description: '', cover: 'cover.png', gallery: [] },
  { slug: 'test', brand: 'TEST', description: '', cover: 'cover.jpg', gallery: [] },
  {
    slug: 'long-name',
    brand: 'VERY LONG BRAND NAME TO TEST CONSTRAINTS',
    description: '',
    cover: 'cover.png',
    gallery: [],
  },
  { slug: 'adidas', brand: 'ADIDAS', description: '', cover: 'cover.png', gallery: [] },
  { slug: 'dollynoire', brand: 'DOLLYNOIRE', description: '', cover: 'cover.png', gallery: [] },
].map((p, i) => ({
  ...p,
  index: String(i + 1).padStart(2, '0'),
  image: dir(p.slug) + p.cover, // same field ProjectCard reads for Home projects
}))

// Full URL of a file inside a project's folder, e.g. labAsset(project, '01.jpg')
export const labAsset = (project, file) => assetUrl(dir(project.slug) + file)
