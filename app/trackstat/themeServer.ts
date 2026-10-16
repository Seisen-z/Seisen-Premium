import { cookies } from 'next/headers';
import { themeCookie, type Theme } from './themeConfig';

export async function savedTheme(): Promise<Theme> {
  return (await cookies()).get(themeCookie)?.value === 'light' ? 'light' : 'dark';
}
