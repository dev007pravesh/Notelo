export interface KeepColor {
  id: string;
  name: string;
  light: string;
  dark: string;
  borderLight: string;
  borderDark: string;
}

export const KEEP_COLORS: KeepColor[] = [
  {
    id: 'default',
    name: 'Default',
    light: '#FFFFFF',
    dark: '#202124',
    borderLight: '#E2E8F0',
    borderDark: '#334155',
  },
  {
    id: 'coral',
    name: 'Coral',
    light: '#FAAFA8',
    dark: '#77172E',
    borderLight: '#F5968F',
    borderDark: '#8F1E38',
  },
  {
    id: 'peach',
    name: 'Peach',
    light: '#F39F76',
    dark: '#692B17',
    borderLight: '#EE8858',
    borderDark: '#7F361E',
  },
  {
    id: 'sand',
    name: 'Sand',
    light: '#FFF8B8',
    dark: '#7C4A03',
    borderLight: '#F5EC9C',
    borderDark: '#935805',
  },
  {
    id: 'mint',
    name: 'Mint',
    light: '#E2F6D3',
    dark: '#264D3B',
    borderLight: '#CEECC0',
    borderDark: '#32604A',
  },
  {
    id: 'sage',
    name: 'Sage',
    light: '#B4DDD3',
    dark: '#0C625D',
    borderLight: '#9ECFC4',
    borderDark: '#12746E',
  },
  {
    id: 'fog',
    name: 'Fog',
    light: '#D4E4ED',
    dark: '#256377',
    borderLight: '#BFD7E3',
    borderDark: '#2E758D',
  },
  {
    id: 'storm',
    name: 'Storm',
    light: '#AECCDC',
    dark: '#284255',
    borderLight: '#97BCD0',
    borderDark: '#335269',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    light: '#D3BFDB',
    dark: '#472E5B',
    borderLight: '#C3ABD0',
    borderDark: '#56386E',
  },
  {
    id: 'blossom',
    name: 'Blossom',
    light: '#F6E2DD',
    dark: '#6C394F',
    borderLight: '#E8CEC7',
    borderDark: '#81455F',
  },
  {
    id: 'clay',
    name: 'Clay',
    light: '#E9E3D4',
    dark: '#4B443A',
    borderLight: '#D8D0BE',
    borderDark: '#5D5449',
  },
  {
    id: 'chalk',
    name: 'Chalk',
    light: '#EFEFF1',
    dark: '#28292D',
    borderLight: '#DDDDE1',
    borderDark: '#3A3C42',
  },
];

/**
 * Resolves the appropriate card and border background color based on current theme.
 */
export function resolveKeepColor(hexOrId: string | undefined, isDark: boolean): { bg: string; border: string } {
  if (!hexOrId) {
    return isDark
      ? { bg: KEEP_COLORS[0].dark, border: KEEP_COLORS[0].borderDark }
      : { bg: KEEP_COLORS[0].light, border: KEEP_COLORS[0].borderLight };
  }

  // Check matching by id or by light/dark hex
  const match = KEEP_COLORS.find(
    (c) =>
      c.id.toLowerCase() === hexOrId.toLowerCase() ||
      c.light.toLowerCase() === hexOrId.toLowerCase() ||
      c.dark.toLowerCase() === hexOrId.toLowerCase()
  );

  if (match) {
    return isDark
      ? { bg: match.dark, border: match.borderDark }
      : { bg: match.light, border: match.borderLight };
  }

  // Fallback to custom hex
  return {
    bg: hexOrId,
    border: isDark ? '#334155' : '#CBD5E1',
  };
}
