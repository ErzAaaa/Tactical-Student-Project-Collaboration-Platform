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
    .from('applications')
    .select(
      '*, project:projects!applications_project_id_fkey(id, title, category, status, deadline)'
    )
    .eq('applicant_id', user.id)
    .order('applied_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil daftar lamaran.' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
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
  if (
    typeof body.project_id !== 'string' ||
    !body.project_id ||
    typeof body.cover_letter !== 'string' ||
    !body.cover_letter.trim() ||
    (body.github_repo_link !== undefined &&
      body.github_repo_link !== null &&
      typeof body.github_repo_link !== 'string')
  ) {
    return NextResponse.json(
      { error: 'project_id dan cover_letter wajib diisi; github_repo_link harus berupa teks.' },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('creator_id, status')
    .eq('id', body.project_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
  }
  if (project.creator_id === user.id) {
    return NextResponse.json({ error: 'Anda tidak dapat melamar proyek sendiri.' }, { status: 403 });
  }
  if (project.status !== 'open') {
    return NextResponse.json({ error: 'Proyek ini tidak sedang menerima lamaran.' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      project_id: body.project_id,
      applicant_id: user.id,
      cover_letter: body.cover_letter.trim(),
      github_repo_link: body.github_repo_link ?? null,
    })
    .select('*')
    .single();

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Anda sudah pernah melamar proyek ini.' }, { status: 409 });
  }
  if (error) {
    return NextResponse.json({ error: 'Gagal mengirim lamaran.' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
