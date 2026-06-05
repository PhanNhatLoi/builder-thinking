export const iconAssets = [
  {
    id: 'home',
    label: 'Home',
    paths: [
      'm3 11 9-8 9 8',
      'M5 10v10h14V10',
      'M9 20v-6h6v6',
    ],
  },
  {
    id: 'phone',
    label: 'Phone',
    paths: [
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.58 2.63a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.45-1.1a2 2 0 0 1 2.11-.45c.86.26 1.73.46 2.63.58A2 2 0 0 1 22 16.92Z',
    ],
  },
  {
    id: 'mail',
    label: 'Mail',
    paths: [
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
      'm22 6-10 7L2 6',
    ],
  },
  {
    id: 'user',
    label: 'User',
    paths: [
      'M20 21a8 8 0 0 0-16 0',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    ],
  },
  {
    id: 'search',
    label: 'Search',
    paths: [
      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
      'm21 21-4.35-4.35',
    ],
  },
  {
    id: 'star',
    label: 'Star',
    paths: ['m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z'],
  },
  {
    id: 'heart',
    label: 'Heart',
    paths: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z'],
  },
  {
    id: 'check',
    label: 'Check',
    paths: ['M20 6 9 17l-5-5'],
  },
  {
    id: 'map-pin',
    label: 'Map pin',
    paths: [
      'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z',
      'M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    paths: [
      'M8 2v4',
      'M16 2v4',
      'M3 10h18',
      'M5 4h14a2 2 0 0 1 2 2v16H3V6a2 2 0 0 1 2-2Z',
    ],
  },
]

export function findIconAsset(assetId) {
  return iconAssets.find((asset) => asset.id === assetId) || iconAssets[0]
}
