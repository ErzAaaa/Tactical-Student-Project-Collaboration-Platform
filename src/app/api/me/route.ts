import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil profil.' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON tidak valid.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const field of ['full_name', 'role_title', 'bio'] as const) {
    if (field in body) {
      if (body[field] !== null && typeof body[field] !== 'string') {
        return NextResponse.json({ error: `Kolom ${field} harus berupa teks.` }, { status: 400 });
      }
      updates[field] = body[field];
    }
  }

  if ('skills' in body) {
    if (!Array.isArray(body.skills) || !body.skills.every((skill) => typeof skill === 'string')) {
      return NextResponse.json({ error: 'Kolom skills harus berupa daftar teks.' }, { status: 400 });
    }
    updates.skills = body.skills;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada data profil yang dapat diperbarui.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Gagal memperbarui profil.' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
