import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApplicationStatus } from '@/types/database';

type RouteContext = { params: Promise<{ id: string }> };
type CreatorDecision = Extract<ApplicationStatus, 'shortlisted' | 'accepted' | 'rejected'>;
const decisionStatuses: CreatorDecision[] = ['shortlisted', 'accepted', 'rejected'];

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

  let body: { status?: unknown; rejection_reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON tidak valid.' }, { status: 400 });
  }
  if (typeof body.status !== 'string' || !decisionStatuses.includes(body.status as CreatorDecision)) {
    return NextResponse.json({ error: 'Status lamaran tidak valid.' }, { status: 400 });
  }
  if (
    body.rejection_reason !== undefined &&
    body.rejection_reason !== null &&
    typeof body.rejection_reason !== 'string'
  ) {
    return NextResponse.json({ error: 'rejection_reason harus berupa teks.' }, { status: 400 });
  }
  const status = body.status as CreatorDecision;

  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .select('id, project_id, status')
    .eq('id', id)
    .single();
  if (applicationError || !application) {
    return NextResponse.json({ error: 'Lamaran tidak ditemukan.' }, { status: 404 });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, creator_id, title, target_members')
    .eq('id', application.project_id)
    .single();
  if (projectError || !project) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
  }
  if (project.creator_id !== user.id) {
    return NextResponse.json({ error: 'Hanya creator proyek yang dapat memutuskan lamaran.' }, { status: 403 });
  }

  const rejectionReason =
    status === 'rejected'
      ? typeof body.rejection_reason === 'string' && body.rejection_reason.trim()
        ? body.rejection_reason.trim()
        : `Terima kasih telah melamar proyek "${project.title}". Untuk saat ini, kami belum dapat menerima lamaran Anda.`
      : null;

  const { data, error: updateError } = await supabase
    .from('applications')
    .update({ status, rejection_reason: rejectionReason })
    .eq('id', id)
    .eq('project_id', project.id)
    .select('*')
    .single();
  if (updateError) {
    return NextResponse.json({ error: 'Gagal memperbarui status lamaran.' }, { status: 500 });
  }

  let quotaReached = false;
  if (status === 'accepted') {
    const { count, error: countError } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('status', 'accepted');

    if (countError) {
      return NextResponse.json({ error: 'Lamaran diterima, tetapi gagal memeriksa kuota proyek.' }, { status: 500 });
    }

    quotaReached = (count ?? 0) >= project.target_members;
    if (quotaReached) {
      const { error: closeError } = await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', project.id);
      if (closeError) {
        return NextResponse.json({ error: 'Lamaran diterima, tetapi gagal memperbarui status proyek.' }, { status: 500 });
      }

      const { error: rejectError } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          rejection_reason: `Terima kasih telah melamar proyek "${project.title}". Kuota anggota tim telah terpenuhi.`,
        })
        .eq('project_id', project.id)
        .in('status', ['pending', 'shortlisted'])
        .neq('id', id);
      if (rejectError) {
        return NextResponse.json({ error: 'Kuota proyek terpenuhi, tetapi gagal menolak lamaran lainnya.' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ data: { ...data, quota_reached: quotaReached } });
}
