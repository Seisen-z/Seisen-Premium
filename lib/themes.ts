export interface Theme {
  id: string;
  name: string;
  accent: string;
  accentHover: string;
  swatches: string[]; // 3 color swatches for preview
}

// Simple theme system - only changes the accent color
// Everything else stays the same dark theme
export const themes: Theme[] = [
  {
    id: 'cream',
    name: 'Default Dark',
    accent: '#c9a97a',
    accentHover: '#b89060',
    swatches: ['#c9a97a', '#b89060', '#9a7d58'],
  },
  {
    id: 'blue',
    name: 'Midnight Blue',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    swatches: ['#3b82f6', '#1d4ed8', '#1e40af'],
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    accent: '#a855f7',
    accentHover: '#9333ea',
    swatches: ['#a855f7', '#9333ea', '#7e22ce'],
  },
  {
    id: 'green',
    name: 'Forest Green',
    accent: '#22c55e',
    accentHover: '#16a34a',
    swatches: ['#22c55e', '#16a34a', '#15803d'],
  },
  {
    id: 'red',
    name: 'Crimson Night',
    accent: '#ef4444',
    accentHover: '#dc2626',
    swatches: ['#ef4444', '#dc2626', '#b91c1c'],
  },
  {
    id: 'cyan',
    name: 'Ocean Deep',
    accent: '#06b6d4',
    accentHover: '#0891b2',
    swatches: ['#06b6d4', '#0891b2', '#0e7490'],
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    accent: '#f97316',
    accentHover: '#ea580c',
    swatches: ['#f97316', '#ea580c', '#c2410c'],
  },
  {
    id: 'pink',
    name: 'Royal Purple',
    accent: '#d946ef',
    accentHover: '#c026d3',
    swatches: ['#d946ef', '#c026d3', '#a21caf'],
  },
];

export function getThemeById(id: string): Theme | undefined {
  return themes.find(theme => theme.id === id);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-hover', theme.accentHover);
  
  // Convert hex to RGB for rgba() usage
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  };
  
  root.style.setProperty('--accent-rgb', hexToRgb(theme.accent));
}
