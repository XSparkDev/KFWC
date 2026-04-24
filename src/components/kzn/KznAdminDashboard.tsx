import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, Search, XCircle } from 'lucide-react';
import { kznSupabase } from '../../lib/kznSupabase';

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
          'id, reference, xs_user_id, first_name, last_name, email, organisation, phone_number, created_at, registration_complete',
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load registrants.');
      }

      setRegistrants((data ?? []) as KznRegistrant[]);
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
                <th className="px-4 py-3 min-w-[170px]">XS User ID</th>
                <th className="px-4 py-3 min-w-[180px]">Registered At</th>
                <th className="px-4 py-3 min-w-[90px] text-center">Complete</th>
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
                    <td className="px-4 py-3 text-[11px] text-white break-all">{r.xs_user_id || '-'}</td>
                    <td className="px-4 py-3 text-[11px] text-[#B0BEC5]">{formatRegisteredDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {r.registration_complete ? (
                        <CheckCircle2 className="w-5 h-5 text-[#C9A035] mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#fca5a5] mx-auto" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
