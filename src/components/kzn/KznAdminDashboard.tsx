import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Download, Search, X, XCircle } from 'lucide-react';
import { kznSupabase } from '../../lib/kznSupabase';
import { QrScanner } from '../QrScanner';

type KznRegistrant = {
  id: string;
  reference: string | null;
  xs_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  organisation: string | null;
  phone_number: string | null;
  created_at: string | null;
  registration_complete: boolean | null;
  is_email_verified?: boolean | null;
  status?: 'Registered' | 'Confirmed';
  photo_consent?: boolean | null;
  headshot_path?: string | null;
  headshot_mime?: string | null;
  checked_in?: boolean | null;
  checked_in_at?: string | null;
};

type KznAdminDashboardProps = {
  onBack: () => void;
};

const formatRegisteredDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formattedDate} · ${formattedTime}`;
};

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default function KznAdminDashboard({ onBack }: KznAdminDashboardProps) {
  const [registrants, setRegistrants] = useState<KznRegistrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openActionForId, setOpenActionForId] = useState<string | null>(null);
  const [rowActionLoadingId, setRowActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; body: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewRegistrant, setPreviewRegistrant] = useState<KznRegistrant | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scanToast, setScanToast] = useState<{
    tone: 'success' | 'warning' | 'error';
    title: string;
    body: string;
  } | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const supabaseFunctionsBaseUrl = ((import.meta as any).env?.VITE_SUPABASE_FUNCTIONS_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();
  const conferenceCode = ((import.meta as any).env?.VITE_CONFERENCE_CODE || '').trim();

  const functionHeaders = {
    'Content-Type': 'application/json',
    ...(supabaseAnonKey
      ? {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        }
      : {}),
  };

  const showToast = (type: 'success' | 'error', title: string, body: string) => {
    setToast({ type, title, body });
  };

  const callEdge = async (endpoint: string, body: Record<string, any>) => {
    if (!supabaseFunctionsBaseUrl) throw new Error('Supabase functions URL is not configured.');
    const res = await fetch(`${supabaseFunctionsBaseUrl}/${endpoint}`, {
      method: 'POST',
      headers: functionHeaders,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({} as Record<string, any>));
    return { res, data };
  };

  const updateEmailVerifiedAcrossTables = async (registrantId: string, email: string) => {
    if (!kznSupabase) throw new Error('Supabase client is not configured.');
    const updatePayload = { is_email_verified: true, email_verified_at: new Date().toISOString() };
    let updated = false;

    const primary = await kznSupabase
      .from('kzn_indaba_registrants')
      .update(updatePayload)
      .eq('id', registrantId);
    if (!primary.error) updated = true;

    if (!updated) {
      const fallback = await kznSupabase
        .from('kfwc_registrants')
        .update(updatePayload)
        .eq('id', registrantId);
      if (!fallback.error) updated = true;
    }

    if (!updated) {
      await kznSupabase
        .from('kzn_indaba_registrants')
        .update(updatePayload)
        .ilike('email', email);
      await kznSupabase
        .from('kfwc_registrants')
        .update(updatePayload)
        .ilike('email', email);
    }
  };

  const fetchRegistrants = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!kznSupabase) {
        throw new Error('Supabase client is not configured.');
      }
      const { data, error: fetchError } = await kznSupabase
        .from('kfwc_registrants')
        .select(
          'id, reference, xs_user_id, first_name, last_name, email, organisation, phone_number, created_at, registration_complete, is_email_verified, photo_consent, headshot_path, headshot_mime, checked_in, checked_in_at',
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load registrants.');
      }

      setRegistrants((prev) => {
        const prevStatusById = new Map(prev.map((item) => [item.id, item.status]));
        return ((data ?? []) as KznRegistrant[]).map((row) => ({
          ...row,
          status: row.checked_in ? 'Confirmed' : row.status ?? prevStatusById.get(row.id) ?? 'Registered',
        }));
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error while loading registrants.';
      setError(message);
      setRegistrants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRegistrants();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!scanToast) return;
    const id = window.setTimeout(() => setScanToast(null), 3600);
    return () => window.clearTimeout(id);
  }, [scanToast]);

  useEffect(() => {
    const close = () => setOpenActionForId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      setScanProcessing(false);
      lastScanRef.current = null;
    }
  }, [scannerOpen]);

  const filteredRegistrants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return registrants;
    return registrants.filter((r) => {
      const fullName = `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase();
      const email = (r.email || '').toLowerCase();
      const organisation = (r.organisation || '').toLowerCase();
      return (
        fullName.includes(term) || email.includes(term) || organisation.includes(term)
      );
    });
  }, [registrants, search]);

  const downloadCsv = () => {
    const headers = [
      'Reference',
      'Name',
      'Email',
      'Organisation',
      'Phone Number',
      'XS User ID',
      'Registered At',
      'Complete',
      'Email Verified',
      'Status',
    ];

    const rows = filteredRegistrants.map((r) => [
      r.reference || '',
      `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      r.email || '',
      r.organisation || '',
      r.phone_number || '',
      r.xs_user_id || '',
      formatRegisteredDate(r.created_at),
      r.registration_complete ? 'Yes' : 'No',
      r.is_email_verified ? 'Yes' : 'No',
      r.status || 'Registered',
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
      .join('\n');

    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kfwc-registrants.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const findRegistrant = (id: string) => registrants.find((row) => row.id === id);

  const updateRegistrant = (id: string, patch: Partial<KznRegistrant>) => {
    setRegistrants((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const extractUserIdFromScan = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return null;
    try {
      const url = new URL(cleaned);
      const fromUid = url.searchParams.get('uid');
      if (fromUid) return fromUid.trim();
      const fromUserId = url.searchParams.get('userId');
      if (fromUserId) return fromUserId.trim();
    } catch {
      // not a URL; continue
    }
    if (/^[a-zA-Z0-9_-]{6,}$/.test(cleaned)) return cleaned;
    return null;
  };

  const verifyEmail = async (registrant: KznRegistrant) => {
    if (!registrant.email || registrant.is_email_verified) return;
    setRowActionLoadingId(registrant.id);
    setOpenActionForId(null);
    try {
      const { res, data } = await callEdge('mark-email-verified', {
        email: registrant.email,
        conferenceCode,
      });
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Unable to verify email.');
      }

      await updateEmailVerifiedAcrossTables(registrant.id, registrant.email);

      const { data: refetchById } = await kznSupabase!
        .from('kfwc_registrants')
        .select('id, is_email_verified')
        .eq('id', registrant.id)
        .maybeSingle();
      let persisted = refetchById;
      if (!persisted?.is_email_verified) {
        const { data: byIdPrimary } = await kznSupabase!
          .from('kzn_indaba_registrants')
          .select('id, is_email_verified')
          .eq('id', registrant.id)
          .maybeSingle();
        if (byIdPrimary?.is_email_verified) persisted = byIdPrimary;
      }
      if (!persisted?.is_email_verified) {
        const { data: refetchByEmail } = await kznSupabase!
          .from('kfwc_registrants')
          .select('id, is_email_verified')
          .ilike('email', registrant.email)
          .limit(1)
          .maybeSingle();
        persisted = refetchByEmail ?? persisted;
      }
      if (!persisted?.is_email_verified) {
        const { data: fallbackByEmailPrimary } = await kznSupabase!
          .from('kzn_indaba_registrants')
          .select('id, is_email_verified')
          .ilike('email', registrant.email)
          .limit(1)
          .maybeSingle();
        persisted = fallbackByEmailPrimary ?? persisted;
      }

      updateRegistrant(registrant.id, { is_email_verified: Boolean(persisted?.is_email_verified) });
      showToast('success', 'Email Verified', 'Email verification was marked successfully.');
      await fetchRegistrants();
    } catch (err) {
      showToast('error', 'Verify Failed', err instanceof Error ? err.message : 'Could not verify email.');
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const checkInRegistrant = async (registrant: KznRegistrant) => {
    if (!registrant.xs_user_id || registrant.status === 'Confirmed' || registrant.is_email_verified !== true) return;
    setRowActionLoadingId(registrant.id);
    setOpenActionForId(null);
    try {
      const callCheckIn = async () =>
        callEdge('checkin-attendee', {
          uid: registrant.xs_user_id,
          email: registrant.email,
          conferenceCode,
        });

      let { res, data } = await callCheckIn();

      if (!res.ok && data?.reason === 'registration_not_found') {
        await callEdge('mirror-registration', {
          uid: registrant.xs_user_id,
          email: registrant.email,
          conferenceCode,
        });
        ({ res, data } = await callCheckIn());
      }

      if (!res.ok && data?.reason === 'email_not_verified') {
        await callEdge('mark-email-verified', {
          email: registrant.email,
          conferenceCode,
        });
        await updateEmailVerifiedAcrossTables(registrant.id, registrant.email);
        ({ res, data } = await callCheckIn());
      }

      if (!res.ok) {
        throw new Error(data?.message || 'Check-in failed.');
      }

      const checkinPatch = {
        status: 'Confirmed' as const,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        registration_complete: true,
      };
      updateRegistrant(registrant.id, checkinPatch);
      await kznSupabase!
        .from('kfwc_registrants')
        .update({
          checked_in: true,
          checked_in_at: checkinPatch.checked_in_at,
          registration_complete: true,
        })
        .eq('id', registrant.id);
      showToast('success', 'Checked In', 'Delegate has been checked in successfully.');
      await fetchRegistrants();
    } catch (err) {
      showToast('error', 'Check-In Failed', err instanceof Error ? err.message : 'Could not check in delegate.');
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const openPreview = async (registrant: KznRegistrant) => {
    setOpenActionForId(null);
    setPreviewRegistrant(registrant);
    setShowPreviewModal(true);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
    if (!registrant.photo_consent || !registrant.headshot_path) return;

    setPreviewLoading(true);
    try {
      if (!supabaseFunctionsBaseUrl) throw new Error('Supabase functions URL is not configured.');
      const url = new URL(`${supabaseFunctionsBaseUrl}/preview-headshot`);
      url.searchParams.set('id', registrant.id);
      if (conferenceCode) url.searchParams.set('conferenceCode', conferenceCode);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          ...(supabaseAnonKey
            ? {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
              }
            : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.message || 'Could not load headshot preview.');
      }
      const blob = await res.blob();
      setPreviewImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      showToast('error', 'Preview Failed', err instanceof Error ? err.message : 'Could not load preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C2B3A] flex items-start justify-center p-6 md:p-10 font-sans">
      <div className="w-full max-w-[96rem] bg-[#243447] rounded-[1.5rem] shadow-2xl border border-[#C9A035] p-6 md:p-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white border border-[#C9A035] px-3 py-2 rounded-md hover:bg-[#1C2B3A] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A035] mb-2">
              Internal Tool
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-black uppercase text-white">
              Kingdom Faith Worship Centre Registrants
            </h1>
            <p className="text-xs text-[#B0BEC5] mt-2 max-w-xl">
              View and export Kingdom Faith Worship Centre registrations from Supabase.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#C9A035] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#A07E25] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A035]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or organisation"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-[#C9A035] bg-[#243447] text-sm font-medium text-white outline-none focus:border-[#C9A035] transition-colors"
            />
          </div>
          <p className="text-[11px] text-[#B0BEC5] font-medium">
            Showing <span className="font-bold text-white">{filteredRegistrants.length}</span>{' '}
            of <span className="font-bold text-white">{registrants.length}</span> registrants
          </p>
        </div>
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              setScanToast(null);
              setScanProcessing(false);
              setScannerOpen(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#C9A035] bg-[#1C2B3A] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#243447] transition-colors"
          >
            <Camera className="w-4 h-4" />
            Open Scanner
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#a85555] bg-[#3f1f1f] px-4 py-3 text-xs text-[#fca5a5] font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-[#C9A035]/20">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#1C2B3A] border-b border-[#C9A035]">
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                <th className="px-4 py-3 min-w-[170px]">Reference</th>
                <th className="px-4 py-3 min-w-[180px]">Name</th>
                <th className="px-4 py-3 min-w-[220px]">Email</th>
                <th className="px-4 py-3 min-w-[180px]">Organisation</th>
                <th className="px-4 py-3 min-w-[140px]">Phone Number</th>
                <th className="px-4 py-3 min-w-[130px] text-center">Verified / Not verified</th>
                <th className="px-4 py-3 min-w-[90px] text-center">Complete</th>
                <th className="px-4 py-3 min-w-[110px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-[#B0BEC5]">
                    Loading registrants...
                  </td>
                </tr>
              ) : filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-[#B0BEC5]">
                    No registrants found.
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/10 odd:bg-[#243447] even:bg-[#1C2B3A] hover:bg-[#1C2B3A] transition-colors"
                  >
                    <td className="px-4 py-3 text-[11px] font-semibold text-white whitespace-nowrap">
                      {r.reference || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white break-words">
                      {`${r.first_name || ''} ${r.last_name || ''}`.trim() || '-'}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white break-all">{r.email || '-'}</td>
                    <td className="px-4 py-3 text-[11px] text-white break-all">{r.organisation || '-'}</td>
                    <td className="px-4 py-3 text-[11px] text-white whitespace-nowrap">{r.phone_number || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                          r.registration_complete ? 'bg-[#C9A035]/20 text-[#C9A035]' : 'bg-white/10 text-[#B0BEC5]'
                        }`}
                      >
                        {r.registration_complete ? 'Verified' : 'Not verified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.checked_in ? (
                        <span className="inline-flex rounded-md bg-[#C9A035]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#C9A035]">
                          Complete
                        </span>
                      ) : r.registration_complete ? (
                        <CheckCircle2 className="w-5 h-5 text-[#C9A035] mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#fca5a5] mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-[#1C2B3A] text-white hover:bg-[#243447]"
                          onClick={() => setOpenActionForId((prev) => (prev === r.id ? null : r.id))}
                        >
                          ⋯
                        </button>
                        {openActionForId === r.id ? (
                          <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-white/20 bg-[#1C2B3A] shadow-xl overflow-hidden">
                            <button
                              type="button"
                              disabled={!r.xs_user_id || r.checked_in === true || r.status === 'Confirmed' || r.is_email_verified !== true || rowActionLoadingId === r.id}
                              onClick={() => void checkInRegistrant(r)}
                              className={`w-full px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.16em] ${
                                !r.xs_user_id || r.checked_in === true || r.status === 'Confirmed' || r.is_email_verified !== true || rowActionLoadingId === r.id
                                  ? 'text-[#6b7280] bg-[#243447] cursor-default'
                                  : 'text-white hover:bg-[#243447]'
                              }`}
                            >
                              Check In
                            </button>
                            <button
                              type="button"
                              disabled={!r.email || r.is_email_verified === true || rowActionLoadingId === r.id}
                              onClick={() => void verifyEmail(r)}
                              className={`w-full px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.16em] border-t border-white/10 ${
                                !r.email || r.is_email_verified === true || rowActionLoadingId === r.id
                                  ? 'text-[#6b7280] bg-[#243447] cursor-default'
                                  : 'text-white hover:bg-[#243447]'
                              }`}
                            >
                              Verify Email
                            </button>
                            <button
                              type="button"
                              disabled={previewLoading}
                              onClick={() => void openPreview(r)}
                              className={`w-full px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.16em] border-t border-white/10 ${
                                previewLoading ? 'text-[#6b7280] bg-[#243447] cursor-default' : 'text-white hover:bg-[#243447]'
                              }`}
                            >
                              {previewLoading && previewRegistrant?.id === r.id ? 'Loading...' : 'Preview'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {scannerOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#243447] p-6 shadow-2xl border border-white/20 relative text-white">
            <button
              type="button"
              onClick={() => setScannerOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A035]">Check-in</p>
              <h2 className="mt-1 text-2xl font-display font-black uppercase">Scan Delegate QR</h2>
              <p className="mt-2 text-xs text-[#B0BEC5]">
                Scan the attendee QR code to process event check-in.
              </p>
            </div>
            <QrScanner
              onResult={(value) => {
                if (scanProcessing) return;
                const cleaned = value.trim();
                const now = Date.now();
                if (
                  lastScanRef.current &&
                  lastScanRef.current.value === cleaned &&
                  now - lastScanRef.current.at < 3000
                ) {
                  return;
                }
                lastScanRef.current = { value: cleaned, at: now };

                (async () => {
                  try {
                    setScanProcessing(true);
                    const uid = extractUserIdFromScan(cleaned);
                    if (!uid) {
                      setScanToast({
                        tone: 'error',
                        title: 'Attendee Not Found',
                        body: 'QR code is not registered',
                      });
                      return;
                    }

                    const registrant = registrants.find((r) => (r.xs_user_id || '').trim() === uid.trim());
                    if (!registrant) {
                      setScanToast({
                        tone: 'error',
                        title: 'Attendee Not Found',
                        body: 'QR code is not linked to this event list',
                      });
                      return;
                    }

                    if (registrant.checked_in || registrant.status === 'Confirmed') {
                      setScanToast({
                        tone: 'warning',
                        title: `${registrant.first_name} ${registrant.last_name}`.trim() || 'Attendee',
                        body: 'Already Checked In',
                      });
                      return;
                    }

                    if (registrant.is_email_verified !== true) {
                      await verifyEmail(registrant);
                    }
                    await checkInRegistrant(registrant);
                    setScanToast({
                      tone: 'success',
                      title: `${registrant.first_name} ${registrant.last_name}`.trim() || 'Attendee',
                      body: 'QR Code Successfully Scanned',
                    });
                  } catch (err) {
                    setScanToast({
                      tone: 'error',
                      title: 'Check-in Error',
                      body: err instanceof Error ? err.message : 'Could not check in attendee',
                    });
                  } finally {
                    window.setTimeout(() => setScanProcessing(false), 1200);
                  }
                })();
              }}
              onError={(message) => {
                setScanToast({
                  tone: 'error',
                  title: 'Camera Unavailable',
                  body: message || 'Unable to access camera.',
                });
              }}
              onCheckInComplete={() => {}}
            />
            {scanToast ? (
              <div
                className={`mt-4 rounded-2xl px-4 py-3 text-white shadow-lg ${
                  scanToast.tone === 'success'
                    ? 'bg-green-600'
                    : scanToast.tone === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-red-600'
                }`}
              >
                <p className="text-base font-black uppercase tracking-[0.06em]">{scanToast.title}</p>
                <p className="text-xs font-semibold mt-1">{scanToast.body}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPreviewModal && previewRegistrant ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-[#243447] p-6 text-white relative">
            <button
              type="button"
              onClick={() => {
                setShowPreviewModal(false);
                if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
                setPreviewImageUrl(null);
              }}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-display font-black uppercase">Registrant Preview</h2>
            <p className="mt-1 text-xs text-[#B0BEC5]">{`${previewRegistrant.first_name} ${previewRegistrant.last_name}`.trim()}</p>
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
              <p><span className="font-black">Email:</span> {previewRegistrant.email || '—'}</p>
              <p><span className="font-black">Organisation:</span> {previewRegistrant.organisation || '—'}</p>
              <p><span className="font-black">Phone:</span> {previewRegistrant.phone_number || '—'}</p>
              <p><span className="font-black">Reference:</span> {previewRegistrant.reference || '—'}</p>
            </div>
            <div className="mt-6 rounded-xl border border-white/20 bg-[#1C2B3A] p-4 min-h-[220px] flex items-center justify-center">
              {previewLoading ? (
                <p className="text-sm text-[#B0BEC5]">Loading...</p>
              ) : previewImageUrl ? (
                <img src={previewImageUrl} alt="Registrant headshot preview" className="max-h-[320px] w-auto object-contain rounded-md" />
              ) : (
                <p className="text-sm text-[#B0BEC5]">No headshot available (missing consent or uploaded image).</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <div className="rounded-2xl border border-white/20 bg-[#243447] p-5 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setToast(null)}
              className="absolute right-6 top-6 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-[#C9A035]/30 text-[#C9A035]' : 'bg-[#3f1f1f] text-[#fca5a5]'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em]">{toast.title}</h3>
            <p className="mt-1 text-xs text-[#B0BEC5]">{toast.body}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
