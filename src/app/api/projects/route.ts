import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStatus } from '@/types/database';

const creatorFields =
  'id, full_name, role_title, avatar_url, github_verified, reliability_score, reliability_tier';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  let query = supabase
    .from('projects')
    .select(`*, creator:profiles!projects_creator_id_fkey(${creatorFields})`)
    .order('created_at', { ascending: false });

  const category = searchParams.get('category');
  const search = searchParams.get('search');
  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data: projects, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil daftar proyek.' }, { status: 500 });
  }

  const projectIds = (projects ?? []).map((project) => project.id);
  let acceptedCounts = new Map<string, number>();
  if (projectIds.length > 0) {
    const { data: acceptedApplications, error: countError } = await supabase
      .from('applications')
      .select('project_id')
      .in('project_id', projectIds)
      .eq('status', 'accepted');

    if (countError) {
      return NextResponse.json({ error: 'Gagal menghitung anggota proyek.' }, { status: 500 });
    }

    acceptedCounts = new Map<string, number>();
    for (const application of acceptedApplications ?? []) {
      acceptedCounts.set(
        application.project_id,
        (acceptedCounts.get(application.project_id) ?? 0) + 1
      );
    }
  }

  const data = (projects ?? []).map((project) => ({
    ...project,
    accepted_count: acceptedCounts.get(project.id) ?? 0,
  }));
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

  for (const field of ['title', 'description', 'category'] as const) {
    if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
      return NextResponse.json({ error: `Kolom ${field} wajib diisi.` }, { status: 400 });
    }
  }

  const allowedFields = [
    'title',
    'description',
    'category',
    'required_skills',
    'target_members',
    'deadline',
    'status',
  ] as const;
  const projectData: Record<string, unknown> = { creator_id: user.id };
  for (const field of allowedFields) {
    if (field in body) projectData[field] = body[field];
  }

  if (
    'required_skills' in projectData &&
    (!Array.isArray(projectData.required_skills) ||
      !projectData.required_skills.every((skill) => typeof skill === 'string'))
  ) {
    return NextResponse.json({ error: 'required_skills harus berupa daftar teks.' }, { status: 400 });
  }
  if (
    'target_members' in projectData &&
    (!Number.isInteger(projectData.target_members) || Number(projectData.target_members) < 1)
  ) {
    return NextResponse.json({ error: 'target_members harus berupa bilangan bulat positif.' }, { status: 400 });
  }
  if (
    'status' in projectData &&
    !(['open', 'in_progress', 'closed'] satisfies ProjectStatus[]).includes(
      projectData.status as ProjectStatus
    )
  ) {
    return NextResponse.json({ error: 'Status proyek tidak valid.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Gagal membuat proyek.' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
