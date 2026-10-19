// Debug script to check approval token status
// Usage: import and call in browser console or in a page load

export async function debugApprovalToken(orcamentoId: string) {
  const { supabase } = await import('@/integrations/supabase/client');

  console.log('=== DEBUGGING APPROVAL TOKEN ===');
  console.log('Orcamento ID:', orcamentoId);

  // 1. Check if token exists in orcamentos table
  const { data: orcamento, error: orcError } = await supabase
    .from('orcamentos')
    .select('id, numero_formatado, approval_token, approval_status')
    .eq('id', orcamentoId)
    .single();

  console.log('Orcamento data:', orcamento);
  if (orcError) console.error('Orcamento query error:', orcError);

  // 2. If token exists, try to retrieve via RPC
  if (orcamento?.approval_token) {
    console.log('Token found:', orcamento.approval_token);

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_orcamento_by_approval_token', { _token: orcamento.approval_token })
      .single();

    console.log('RPC result:', rpcResult);
    if (rpcError) console.error('RPC error:', rpcError);
  } else {
    console.warn('No approval_token in database');
  }

  // 3. Check approval_links table
  const { data: links, error: linksError } = await supabase
    .from('orcamento_approval_links')
    .select('*')
    .eq('orcamento_id', orcamentoId);

  console.log('Approval links:', links);
  if (linksError) console.error('Links query error:', linksError);

  console.log('=== END DEBUG ===');
}
