import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStatus } from '@/types/database';

const creatorFields =
  'id, full_name, role_title, avatar_url, github_verified, reliability_score, reliability_tier';
const applicantFields = '*';
const validStatuses: ProjectStatus[] = ['open', 'in_progress', 'closed'];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `*, creator:profiles!projects_creator_id_fkey(${creatorFields}), applications(*, applicant:profiles!applications_applicant_id_fkey(${applicantFields}))`
    )
    .eq('id', id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
  }

  const acceptedCount = (project.applications ?? []).filter(
    (application: { status: string }) => application.status === 'accepted'
  ).length;

  return NextResponse.json({
    data: { ...project, accepted_count: acceptedCount },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
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

  const allowedFields = [
    'title',
    'description',
    'category',
    'required_skills',
    'target_members',
    'deadline',
    'status',
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada data proyek yang dapat diperbarui.' }, { status: 400 });
  }
  for (const field of ['title', 'description', 'category'] as const) {
    if (field in updates && (typeof updates[field] !== 'string' || !updates[field].trim())) {
      return NextResponse.json({ error: `Kolom ${field} harus berupa teks.` }, { status: 400 });
    }
  }
  if (
    'status' in updates &&
    (typeof updates.status !== 'string' || !validStatuses.includes(updates.status as ProjectStatus))
  ) {
    return NextResponse.json({ error: 'Status proyek tidak valid.' }, { status: 400 });
  }
  if (
    'required_skills' in updates &&
    (!Array.isArray(updates.required_skills) ||
      !updates.required_skills.every((skill) => typeof skill === 'string'))
  ) {
    return NextResponse.json({ error: 'required_skills harus berupa daftar teks.' }, { status: 400 });
  }
  if (
    'target_members' in updates &&
    (!Number.isInteger(updates.target_members) || Number(updates.target_members) < 1)
  ) {
    return NextResponse.json({ error: 'target_members harus berupa bilangan bulat positif.' }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
  }
  if (project.creator_id !== user.id) {
    return NextResponse.json({ error: 'Hanya creator proyek yang dapat mengubahnya.' }, { status: 403 });
  }

  const { data, error: updateError } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('creator_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Gagal memperbarui proyek.' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  }

  const { data: project, error: lookupError } = await supabase
    .from('projects')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (lookupError || !project) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
  }
  if (project.creator_id !== user.id) {
    return NextResponse.json({ error: 'Hanya creator proyek yang dapat menghapusnya.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('creator_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus proyek.' }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
