import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Scale,
  ShieldCheck,
  TrendingUp,
  Heart,
  Users,
  Clock3,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type KznLandingPageProps = {
  onRegisterClick: () => void;
};

const TARGET_DATE = new Date('2026-05-09T08:00:00+02:00');

const LEADERS = [
  {
    image: '',
    name: 'Dr. NJ Makhubu',
    role: 'Corporate Business Executive, Incoming SARS Commissioner',
    quote:
      'Compliance from the ground up is the foundation of every resilient business...',
    border: 'border-[#C9A035]',
  },
  {
    image: '',
    name: 'Eustace Mashimbye',
    role: 'CEO: Proudly South African, Market Access Specialist',
    quote:
      'Access to South African markets begins with understanding who you are as a business...',
    border: 'border-[#C9A035]',
  },
  {
    image: '',
    name: 'Dr. Mashudu Bidzha',
    role: 'Acting Chief Director: Public Finance, National Treasury',
    quote:
      'Government and small business must work together to unlock inclusive economic growth...',
    border: 'border-[#C9A035]',
  },
];

const AGENDA_CARDS = [
  {
    icon: FileText,
    title: 'Funding & Market Access',
    points: [
      'How to access funding as a SMME',
      'Access to South African markets',
      'Advantages of complying from grassroots',
      'Micro-enterprise growth pathways',
    ],
    highlight: false,
  },
  {
    icon: Scale,
    title: 'Compliance & Governance',
    points: [
      'Resilience from a risk compliance standpoint',
      'Advantages of complying from grassroots',
      'B-BBEE and regulatory requirements',
      'Legal frameworks for small business',
    ],
    highlight: true,
  },
  {
    icon: ShieldCheck,
    title: 'Security & Operational Risk',
    points: [
      'Trading under threat: Security, Theft and Fraud',
      'Beyond Load Shedding: The Real Cost of Energy',
      'Business continuity planning',
      'Risk management frameworks',
    ],
    highlight: false,
  },
  {
    icon: TrendingUp,
    title: 'Digital Innovation',
    points: [
      'Digital Innovation for your business',
      'Township economy and digital platforms',
      'Leveraging technology for growth',
      'E-commerce and online market access',
    ],
    highlight: false,
  },
  {
    icon: Heart,
    title: 'People & Capability',
    points: [
      'Skills, hiring and capability failures',
      'Leadership and team development',
      'How to compete when customers spend less',
      'Building a high-performance culture',
    ],
    highlight: false,
  },
  {
    icon: Users,
    title: 'Financial Resilience',
    points: [
      'Addressing the crisis of cashflow',
      'Cost management strategies',
      'Revenue diversification',
      'SMME funding and investment readiness',
    ],
    highlight: false,
  },
];

const SPEAKERS = [
  {
    name: 'Dr. NJ Makhubu',
    title: 'Corporate Business Executive | Incoming SARS Commissioner',
  },
  {
    name: 'Dr. Maanda Tshifularo',
    title:
      'Lecturer, GIBS | Business Turnaround Strategist | Published Author & Leadership Coach',
  },
  {
    name: 'Dr. Mashudu Bidzha',
    title: 'Acting Chief Director: Public Finance | National Treasury',
  },
  {
    name: 'Eustace Mashimbye',
    title: 'CEO: Proudly South African | Market Access Specialist',
  },
  {
    name: 'Julia Ramitshana',
    title: 'Chairperson & CEO | International Partnerships & Industry Collaboration',
  },
  {
    name: 'Rhulani Nyiko Maluleke',
    title: 'Senior Manager, Nedbank Digital Innovation | Township Economy Ambassador',
  },
  {
    name: 'Xolani Ngazimbi',
    title: 'Executive Director | Transformation & Diversity Strategist',
  },
  {
    name: 'Luncedo Mtwentwe',
    title: 'Managing Director, SMME Funding Advisor | Sunday Times Business Columnist',
  },
  {
    name: 'Stanley Bezuidenhout',
    title: 'Brand Development | Compliance & Growth Specialist',
  },
];

const PARTNERS = [
  { name: 'Kingdom Faith Worship Centre', logo: '/kfwc-logo.png' },
  { name: 'SA Corp Group', logo: '/Prestige.png' },
  { name: 'Prestige Catering', logo: '/prestige2.png' },
];

const getTimeParts = () => {
  const now = new Date().getTime();
  const diff = TARGET_DATE.getTime() - now;
  const remaining = Math.max(diff, 0);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  return { days, hours, minutes, seconds };
};

const pad = (value: number) => String(value).padStart(2, '0');

export default function KznLandingPage({ onRegisterClick }: KznLandingPageProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeParts);
  const [showProgrammePreview, setShowProgrammePreview] = useState(false);
  const [programmePreviewFailed, setProgrammePreviewFailed] = useState(false);
  const [showHeroFallback, setShowHeroFallback] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeParts());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const qrValue = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?register=1`;
    }
    return '/?register=1';
  }, []);

  const programmeFilePath = '/KZN_Liquor_Indaba_Programme.pdf';
  const programmeFileHref = encodeURI(programmeFilePath);

  const downloadQrCode = () => {
    const svg = document.getElementById('kzn-qr-svg');
    if (!(svg instanceof SVGSVGElement)) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 40, 40, 620, 620);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'KFWC-Resilient-Business-2026-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-[#1C2B3A] text-white font-sans">
      <section className="grid grid-cols-1 lg:grid-cols-[56%_44%] min-h-[90vh]">
        <div className="bg-[#243447] px-6 sm:px-10 lg:px-14 py-10 flex flex-col justify-center">
          <img
            src="/favin.png"
            alt="Kingdom Faith Worship Centre"
            className="mb-8 h-auto w-[170px] max-w-full object-contain object-left"
          />
          <p className="text-xs font-normal text-white">
            Kingdom Faith Worship Centre in collaboration with SA Corp Group
          </p>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035]">
            FUNDRAISING BUSINESS SEMINAR
          </p>
          <div className="mt-3 bg-[#1C2B3A] text-white px-5 py-4 rounded-md border border-[#C9A035]">
            <p className="text-sm font-bold uppercase tracking-wide">
              TOP 10 SMME PAIN POINTS IN SA:
              <br />
              THE 2026 SURVIVAL AGENDA FOR SMALL BUSINESS
            </p>
          </div>

          <h1 className="mt-8 font-display font-black uppercase leading-[0.9] text-4xl sm:text-6xl lg:text-7xl text-white">
            Building a
            <br />
            Resilient
            <br />
            <span className="text-[#C9A035]">Business</span>
          </h1>

          <div className="w-20 h-1.5 bg-[#C9A035] mt-8" />

          <div className="mt-6 text-sm text-[#B0BEC5] space-y-1">
            <p>9th May 2026</p>
            <p>Olifantsfontein Community Hall, Pearce Road, Clayville</p>
          </div>
          <div className="mt-4 space-y-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A035]">
              <Clock3 className="h-4 w-4" />
              08:00 AM - 16:00 PM
            </p>
            <p className="inline-flex w-fit rounded-full bg-[#b91c1c] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              ⚠ Seats are Limited
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="border border-[#C9A035] rounded-md p-3 bg-[#1C2B3A] text-center">
                <p className="font-display font-black text-2xl text-white">
                  {pad(item.value)}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A035]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRegisterClick}
              className="inline-flex items-center justify-center bg-[#C9A035] text-[#1C2B3A] px-8 py-4 text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#A07E25] transition-colors w-fit"
            >
              Register Now
            </button>
          </div>
        </div>

        <div className="relative min-h-[420px] lg:min-h-full overflow-hidden bg-[#1C2B3A] p-6 flex items-center justify-center">
          {showHeroFallback ? (
            <div className="w-full max-w-lg rounded-2xl border border-[#C9A035] bg-[#243447] p-6 shadow-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9A035]">
                Event Details
              </p>
              <div className="mt-4 space-y-3 text-white">
                <p className="text-lg font-bold">Saturday | 9 May 2026</p>
                <p className="text-sm text-[#B0BEC5]">08:00 - 16:00</p>
                <p className="text-sm text-[#B0BEC5]">Olifantsfontein Community Hall</p>
                <p className="text-sm text-[#B0BEC5]">Pearce Road, Clayville</p>
                <p className="text-sm text-[#B0BEC5]">Tickets: R1550pp</p>
                <p className="text-sm text-[#B0BEC5]">Includes light breakfast & lunch</p>
              </div>
            </div>
          ) : (
            <img
              src="/h1.png"
              alt="Building a Resilient Business visual"
              className="h-full w-full rounded-xl object-contain lg:object-cover"
              onError={() => setShowHeroFallback(true)}
            />
          )}
        </div>
      </section>

      {showProgrammePreview ? (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[#C9A035]/20 bg-[#243447] shadow-2xl overflow-hidden">
            <div className="bg-[#1C2B3A] px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A035]">
                  Programme Preview
                </p>
                <h3 className="text-lg font-display font-black uppercase text-white">
                  Building a Resilient Business Programme Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProgrammePreview(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/30 text-white hover:bg-white/10 transition-colors"
                aria-label="Close programme preview"
              >
                ×
              </button>
            </div>
            <div className="bg-[#243447] p-4 md:p-6">
              {programmePreviewFailed ? (
                <div className="rounded-xl border border-[#C9A035] bg-[#1C2B3A] overflow-hidden shadow-sm p-6 text-center">
                  <p className="text-sm font-semibold text-white">
                    Preview unavailable - please download the programme.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#C9A035] bg-white overflow-hidden shadow-sm">
                  <iframe
                    src="/KZN_Liquor_Indaba_Programme.pdf"
                    width="100%"
                    height="100%"
                    style={{ border: 'none', minHeight: '500px' }}
                    title="KZN Liquor Indaba Programme"
                    onError={() => setProgrammePreviewFailed(true)}
                  />
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <a
                  href={programmeFileHref}
                  download="KZN_Liquor_Indaba_Programme.pdf"
                  className="inline-flex items-center justify-center bg-[#C9A035] text-[#1C2B3A] px-6 py-3 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-[#A07E25] transition-colors"
                >
                  Download Programme
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="max-w-7xl mx-auto px-6 mt-4 text-sm text-[#B0BEC5] leading-relaxed">
        Tickets are R1550pp — includes light breakfast and lunch | Available at
        www.webtickets.co.za | Exhibition stalls &amp; partnerships: info@kfwc.org.za | 078-044-3373
      </p>

      <section className="bg-[#243447] py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035]">
              Background &amp; Rationale
            </p>
            <h2 className="mt-3 font-display font-black text-4xl md:text-5xl text-white uppercase leading-tight">
              Why Build a Resilient Business in SA?
            </h2>
            <p className="mt-6 text-[#B0BEC5] leading-relaxed">
              South Africa&apos;s small business landscape faces mounting pressure. This seminar
              brings together government leaders, industry experts, and SMME champions to tackle
              the top 10 pain points facing small businesses in 2026.
            </p>
            <ul className="mt-6 space-y-3 text-white">
              <li>Streamline access to markets and funding opportunities</li>
              <li>Address compliance, governance and regulatory challenges</li>
              <li>Equip SMMEs with digital innovation strategies</li>
              <li>Build resilience against economic and operational threats</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#C9A035] bg-[#243447] p-8 shadow-xl">
            <p className="text-5xl leading-none text-[#C9A035]">❝</p>
            <p className="mt-4 text-base leading-relaxed text-white">
              South Africa&apos;s SMME sector employs over 60% of the workforce - yet faces its
              greatest challenges in access to capital, compliance, and market entry.
            </p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9A035]">
              BUILDING A RESILIENT BUSINESS | 9 May 2026
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#1C2B3A] py-20">
        <div className="max-w-7xl mx-auto px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035] text-center">
            Leadership
          </p>
          <h2 className="mt-3 font-display font-black text-4xl md:text-5xl text-white uppercase text-center">
            Welcome Messages
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {LEADERS.map((leader) => (
              <article key={leader.name} className="bg-[#243447] rounded-2xl shadow-md border border-[#C9A035]/30 p-7 text-center">
                <div
                  className={`h-24 w-24 rounded-full border-4 ${leader.border} mx-auto bg-[#1C2B3A]`}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-display font-black text-xl text-white">{leader.name}</h3>
                <p className="mt-2 text-sm text-[#B0BEC5]">{leader.role}</p>
                <p className="mt-4 text-sm text-white italic">"{leader.quote}"</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#243447] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035] text-center">
            SPEAKERS
          </p>
          <h2 className="mt-3 font-display font-black text-4xl md:text-5xl text-white uppercase text-center">
            MEET THE SPEAKERS
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SPEAKERS.map((speaker) => (
              <article key={speaker.name} className="bg-[#243447] rounded-2xl shadow-md border border-[#C9A035]/30 p-7 text-center">
                <div className="h-24 w-24 rounded-full border-4 border-[#C9A035] mx-auto bg-[#1C2B3A]" aria-hidden="true" />
                <h3 className="mt-5 font-display font-black text-xl text-white">{speaker.name}</h3>
                <p className="mt-2 text-sm text-[#B0BEC5]">{speaker.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#243447] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035]">
            Focus Areas
          </p>
          <h2 className="mt-3 font-display font-black text-4xl md:text-6xl text-white uppercase leading-none">
            Session Topics
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENDA_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`bg-[#1C2B3A] text-white rounded-2xl border border-[#C9A035]/25 p-6 ${
                    card.highlight ? 'border-l-4 border-l-[#C9A035]' : ''
                  }`}
                >
                  <Icon className="w-7 h-7 text-[#C9A035]" />
                  <h3 className="mt-4 font-display font-bold uppercase text-lg">{card.title}</h3>
                  <ul className="mt-4 space-y-2 text-sm text-[#B0BEC5]">
                    {card.points.map((point) => (
                      <li key={point}>- {point}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#243447] py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035]">
            Scan To Register
          </p>
          <h2 className="mt-3 font-display font-black text-4xl md:text-5xl text-white uppercase">
            Join the Seminar
          </h2>
          <p className="mt-3 text-[#B0BEC5]">Scan the QR code or click below to secure your seat</p>

          <div className="mt-8 inline-flex bg-white border border-[#C9A035] shadow-xl rounded-2xl p-6">
            <QRCodeSVG
              id="kzn-qr-svg"
              value={qrValue}
              size={220}
              fgColor="#1C2B3A"
              bgColor="#ffffff"
              level="H"
              includeMargin
            />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={downloadQrCode}
              className="inline-flex items-center justify-center bg-[#1C2B3A] text-[#C9A035] border border-[#C9A035] px-8 py-3 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-[#3D3020] transition-colors"
            >
              Download QR Code
            </button>
            <button
              type="button"
              onClick={onRegisterClick}
              className="inline-flex items-center justify-center bg-[#C9A035] text-[#1C2B3A] px-8 py-3 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-[#A07E25] transition-colors"
            >
              Open Registration Form
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#243447] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A035] text-center">
            Collaborators
          </p>
          <h2 className="mt-3 font-display font-black text-4xl md:text-5xl text-white uppercase text-center">
            Our Partners
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="bg-[#1C2B3A] rounded-xl border border-[#C9A035]/40 shadow-sm hover:-translate-y-0.5 transition-transform p-5 flex flex-col items-center justify-center min-h-[120px]"
              >
                {partner.logo ? (
                  <div className="rounded-lg bg-white px-4 py-3 min-h-[64px] w-full max-w-[180px] flex items-center justify-center">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-12 max-w-[120px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="font-display font-black text-lg uppercase text-[#C9A035] text-center">
                    {partner.name}
                  </p>
                )}
                {partner.logo ? (
                  <p className="mt-3 text-xs text-[#B0BEC5] text-center">{partner.name}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#1C2B3A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-display font-black text-3xl uppercase">Contact Us</h3>
            <div className="mt-6 space-y-2 text-sm text-[#B0BEC5] leading-relaxed">
              <p>Phone: 078-044-3373</p>
              <p>Email: info@kfwc.org.za</p>
              <p>Website: www.webtickets.co.za</p>
              <p>Venue: Olifantsfontein Community Hall, Pearce Road, Clayville</p>
            </div>
          </div>
          <div className="bg-[#243447] rounded-2xl p-8 border border-[#C9A035]/20">
            <h3 className="font-display font-black text-3xl uppercase">Ready to Register?</h3>
            <p className="mt-4 text-sm text-[#B0BEC5] leading-relaxed">
              Join us on 9 May 2026 for a landmark SMME seminar empowering South Africa&apos;s
              small business community.
            </p>
            <button
              type="button"
              onClick={onRegisterClick}
              className="mt-8 inline-flex items-center justify-center bg-[#C9A035] text-[#1C2B3A] px-8 py-4 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-[#A07E25] transition-colors"
            >
              Secure Your Delegate Spot
            </button>
          </div>
        </div>
        <div className="bg-[#243447]">
          <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-[#B0BEC5]">
            © 2026 Building a Resilient Business | Kingdom Faith Worship Centre &amp; SA Corp Group.
            All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
