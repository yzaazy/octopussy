/**
 * BrickLink color ID → name + hex, for the colors used in the wanted lists.
 * Names and hex values taken from bricklink.com/catalogColors.asp.
 */
export const BL_COLORS: Record<number, { name: string; hex: string }> = {
  1: { name: 'White', hex: '#F9F7F1' },
  2: { name: 'Tan', hex: '#EED9A4' },
  3: { name: 'Yellow', hex: '#FFE001' },
  4: { name: 'Orange', hex: '#FF8901' },
  5: { name: 'Red', hex: '#DB2A1A' },
  7: { name: 'Blue', hex: '#0066CA' },
  9: { name: 'Light Gray', hex: '#C2BFB0' },
  10: { name: 'Dark Gray', hex: '#7E7563' },
  11: { name: 'Black', hex: '#212121' },
  12: { name: 'Trans-Clear', hex: '#EEEEEE' },
  14: { name: 'Trans-Dark Blue', hex: '#00296B' },
  15: { name: 'Trans-Light Blue', hex: '#68BCC5' },
  16: { name: 'Trans-Neon Green', hex: '#C0F500' },
  17: { name: 'Trans-Red', hex: '#9C0010' },
  18: { name: 'Trans-Neon Orange', hex: '#FF4231' },
  19: { name: 'Trans-Yellow', hex: '#EBF72D' },
  34: { name: 'Lime', hex: '#C4E000' },
  36: { name: 'Bright Green', hex: '#10CB31' },
  47: { name: 'Dark Pink', hex: '#EF5BB3' },
  50: { name: 'Trans-Dark Pink', hex: '#CE1D9B' },
  63: { name: 'Dark Blue', hex: '#243757' },
  71: { name: 'Magenta', hex: '#B72276' },
  85: { name: 'Dark Bluish Gray', hex: '#7D7C78' },
  86: { name: 'Light Bluish Gray', hex: '#BFBEBA' },
  88: { name: 'Reddish Brown', hex: '#82422A' },
  98: { name: 'Trans-Orange', hex: '#E96F01' },
  110: { name: 'Bright Light Orange', hex: '#FFC700' },
  115: { name: 'Pearl Gold', hex: '#E79E1D' },
  150: { name: 'Medium Nougat', hex: '#E3A05B' },
  153: { name: 'Dark Azure', hex: '#009FE0' },
  156: { name: 'Medium Azure', hex: '#6ACEE0' },
};

export function colorName(id: number): string {
  return BL_COLORS[id]?.name ?? `Color ${id}`;
}

export function colorHex(id: number): string {
  return BL_COLORS[id]?.hex ?? '#CCCCCC';
}
