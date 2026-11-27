import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

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

  let body: { withdraw_reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON tidak valid.' }, { status: 400 });
  }
  if (
    body.withdraw_reason !== undefined &&
    body.withdraw_reason !== null &&
    typeof body.withdraw_reason !== 'string'
  ) {
    return NextResponse.json({ error: 'withdraw_reason harus berupa teks.' }, { status: 400 });
  }

  const { data: application, error } = await supabase
    .from('applications')
    .update({
      status: 'withdrawn',
      withdraw_reason:
        typeof body.withdraw_reason === 'string' ? body.withdraw_reason.trim() || null : null,
    })
    .eq('id', id)
    .eq('applicant_id', user.id)
    .select('*')
    .single();

  if (error || !application) {
    return NextResponse.json({ error: 'Lamaran tidak ditemukan atau tidak dapat diperbarui.' }, { status: 404 });
  }

  const { error: rpcError } = await supabase.rpc('recalculate_reliability', {
    target_user_id: user.id,
  });
  if (rpcError) {
    return NextResponse.json({ error: 'Lamaran telah ditarik, tetapi gagal menghitung ulang skor reliabilitas.' }, { status: 500 });
  }

  return NextResponse.json({ data: application });
}
