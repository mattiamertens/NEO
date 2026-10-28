// Team members shown in About → "OUR TEAM". One object = one TeamCard.
// - photo: file inside public/team/ (square works best)
// - instagram: handle without the @
// `index` ([01], [02]…) comes from the order of this list.
const dir = '/team/'

export const team = [
  {
    name: 'SARA MARIA MASSARO',
    role: 'Graphic & Product designer',
    photo: 'sara.jpg',
    instagram: 'ssarammass',
    email: 'sara.mariamassaro@gmail.com',
  },
  {
    name: 'MATTIA MERTENS',
    role: 'Creative developer',
    photo: 'mattia.webp',
    instagram: 'maats__',
    email: 'mattianc@hotmail.it',
  },
].map((m, i) => ({
  ...m,
  index: String(i + 1).padStart(2, '0'),
  photo: m.photo ? dir + m.photo : null,
}))
