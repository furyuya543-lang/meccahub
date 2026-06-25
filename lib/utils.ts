export const MAPS = [
  'Hide-and-Seek Mansion',
  'Sewer',
  'Backrooms',
  'Indoor Country',
  'Penguin Hotel',
  'Sugar Land',
  'Osaka',
  'Apartment',
  'Art Gallery',
  'Swimming Pool',
  'Minecraft House',
  'Minecraft',
  'Simpsons Family House',
  'CS2 Mirage',
  'Meeting Room',
  'Bikini Bottom',
  'Minepops',
  'Restaurant Building',
  'Viking Dining',
  'The Market',
] as const;

export type MapName = (typeof MAPS)[number];
