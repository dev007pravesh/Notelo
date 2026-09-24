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
    borderLight: '#E0E0E0',
    borderDark: '#3C4043',
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

export interface ResolvedColorStyle {
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  isDefault: boolean;
}

/**
 * Resolves the appropriate card and border background color based on current theme,
 * along with optimal contrasting text colors.
 */
export function resolveKeepColor(hexOrId: string | undefined, isDark: boolean): ResolvedColorStyle {
  if (!hexOrId) {
    return {
      bg: isDark ? KEEP_COLORS[0].dark : KEEP_COLORS[0].light,
      border: isDark ? KEEP_COLORS[0].borderDark : KEEP_COLORS[0].borderLight,
      textPrimary: isDark ? '#E8EAED' : '#202124',
      textSecondary: isDark ? '#9AA0A6' : '#5F6368',
      isDefault: true,
    };
  }

  // Check matching by id or by light/dark hex
  const match = KEEP_COLORS.find(
    (c) =>
      c.id.toLowerCase() === hexOrId.toLowerCase() ||
      c.light.toLowerCase() === hexOrId.toLowerCase() ||
      c.dark.toLowerCase() === hexOrId.toLowerCase()
  );

  if (match) {
    const isDef = match.id === 'default';
    return {
      bg: isDark ? match.dark : match.light,
      border: isDark ? match.borderDark : match.borderLight,
      textPrimary: isDark ? '#F8FAFC' : '#202124',
      textSecondary: isDark ? 'rgba(255, 255, 255, 0.78)' : '#3C4043',
      isDefault: isDef,
    };
  }

  // Fallback to custom hex
  return {
    bg: hexOrId,
    border: isDark ? '#3C4043' : '#E0E0E0',
    textPrimary: isDark ? '#E8EAED' : '#202124',
    textSecondary: isDark ? '#9AA0A6' : '#5F6368',
    isDefault: false,
  };
}
