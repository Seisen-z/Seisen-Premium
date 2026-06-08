import { NextResponse } from 'next/server';
import { getRecentTestimonials } from '@/lib/testimonials';

export const revalidate = 300;

export async function GET() {
  try {
    const testimonials = await getRecentTestimonials();
    return NextResponse.json({ testimonials });
  } catch {
    return NextResponse.json({ testimonials: [] });
  }
}
