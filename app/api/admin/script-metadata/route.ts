import { supabase } from '@/lib/server/db';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/server/adminSession';

function isAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  return verifyAdminSession(authHeader.replace('Bearer ', ''));
}

export async function GET() {
  try {
    
    const { data, error } = await supabase
      .from('script_metadata')
      .select('*')
      .order('script_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching script metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    const { script_name, description, features } = body;

    if (!script_name) {
      return NextResponse.json({ error: 'Script name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('script_metadata')
      .insert([{ 
        script_name, 
        description: description || '', 
        features: features || [] 
      }])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/scripts');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating script metadata:', error);
    return NextResponse.json({ error: 'Failed to create metadata' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    const { id, script_name, description, features } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('script_metadata')
      .update({ 
        script_name,
        description: description || '', 
        features: features || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/scripts');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating script metadata:', error);
    return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('script_metadata')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/scripts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting script metadata:', error);
    return NextResponse.json({ error: 'Failed to delete metadata' }, { status: 500 });
  }
}
