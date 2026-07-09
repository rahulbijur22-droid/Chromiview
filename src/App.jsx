import { useMemo, useState } from 'react';

// Chromiview - screening + citizen science questionnaire
// StackBlitz setup:
// 1. Replace src/App.tsx with this file.
// 2. Add your logo image to public/chromiview-logo.png.
// 3. Optional later: move submit() and buildAiInsight() to Supabase Edge Functions.

type CvdValue = 'none' | 'rg_d' | 'rg_p' | 'by' | 'total' | 'unsure';
type Confidence = 'Low' | 'Medium' | 'High';

const C = {
  primary: '#5528D8',
  primary2: '#6B3FEA',
  primaryLt: '#F2EDFF',
  blue: '#1297F4',
  blueLt: '#EAF6FF',
  navy: '#07143F',
  ink: '#101426',
  gray: '#667085',
  muted: '#F8FAFF',
  border: '#D8DCE8',
  white: '#FFFFFF',
  success: '#0E9384',
  successLt: '#E7F8F5',
  warning: '#F79009',
  warningLt: '#FFF4E5',
  danger: '#C0392B',
};

const S: any = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, #EAF6FF 0, rgba(234,246,255,0) 34%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)',
    color: C.ink,
  },
  wrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '1.25rem 1rem 2.5rem',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: {
    background: 'rgba(255,255,255,0.92)',
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '1.15rem',
    boxShadow: '0 18px 50px rgba(7, 20, 63, 0.08)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: '1.25rem',
  },
  logoImg: {
    width: 46,
    height: 46,
    objectFit: 'contain',
    borderRadius: 10,
    background: C.white,
  },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: `conic-gradient(from 18deg, ${C.blue}, ${C.primary}, ${C.blue}, ${C.primary})`,
    display: 'grid',
    placeItems: 'center',
    color: C.white,
    fontWeight: 800,
    fontSize: 22,
  },
  logoName: { fontSize: 22, fontWeight: 800, color: C.navy, lineHeight: 1.05 },
  logoTag: { fontSize: 12, color: C.gray, marginTop: 3 },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: '1rem',
  },
  modePill: {
    border: `1px solid ${C.border}`,
    background: C.white,
    color: C.gray,
    borderRadius: 999,
    padding: '0.45rem 0.7rem',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  progBar: {
    height: 6,
    background: '#E8ECF5',
    borderRadius: 999,
    marginBottom: '1.5rem',
    overflow: 'hidden',
  },
  progFill: (pct: number) => ({
    height: '100%',
    background: `linear-gradient(90deg, ${C.blue}, ${C.primary})`,
    borderRadius: 999,
    width: pct + '%',
    transition: 'width 0.35s ease',
  }),
  stepLabel: {
    fontSize: 12,
    color: C.primary,
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '0.45rem',
  },
  h1: {
    fontSize: 30,
    fontWeight: 850,
    color: C.navy,
    margin: '0 0 0.65rem',
    lineHeight: 1.16,
    letterSpacing: 0,
  },
  h2: {
    fontSize: 24,
    fontWeight: 800,
    color: C.navy,
    margin: '0 0 0.55rem',
    lineHeight: 1.24,
    letterSpacing: 0,
  },
  h3: {
    fontSize: 16,
    fontWeight: 800,
    color: C.navy,
    margin: '0 0 0.55rem',
    lineHeight: 1.3,
  },
  sub: { fontSize: 15, color: C.gray, margin: '0 0 1.35rem', lineHeight: 1.7 },
  card: (sel: boolean) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '0.95rem 1rem',
    border: `1.5px solid ${sel ? C.primary : C.border}`,
    borderRadius: 12,
    background: sel ? C.primaryLt : C.white,
    cursor: 'pointer',
    marginBottom: 10,
    transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
    boxShadow: sel ? '0 10px 24px rgba(85, 40, 216, 0.10)' : 'none',
  }),
  cardLabel: { fontSize: 15, color: C.ink, lineHeight: 1.45, fontWeight: 650 },
  cardSub: { fontSize: 13, color: C.gray, marginTop: 3, lineHeight: 1.5 },
  callout: (tone = 'primary') => {
    const isWarn = tone === 'warning';
    const isOk = tone === 'success';
    return {
      background: isWarn ? C.warningLt : isOk ? C.successLt : C.primaryLt,
      border: `1.5px solid ${
        isWarn ? '#FFD59A' : isOk ? '#A6E7DA' : '#D6C9FF'
      }`,
      borderRadius: 12,
      padding: '1rem',
      marginBottom: '1.1rem',
      fontSize: 14,
      color: isWarn ? '#7A4B00' : isOk ? '#07594F' : '#351B8E',
      lineHeight: 1.65,
    };
  },
  calloutTitle: { fontWeight: 850, marginBottom: 4 },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    margin: '1rem 0 1.35rem',
  },
  feature: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '0.85rem',
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: C.blueLt,
    color: C.blue,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900,
    marginBottom: 8,
  },
  featureText: { fontSize: 13, color: C.gray, lineHeight: 1.5 },
  scaleWrap: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '0.9rem',
    marginBottom: 12,
  },
  scaleQuestion: {
    fontSize: 14,
    fontWeight: 750,
    color: C.ink,
    marginBottom: 9,
    lineHeight: 1.45,
  },
  scaleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(42px, 1fr))',
    gap: 8,
    marginBottom: 7,
  },
  scaleBtn: (sel: boolean) => ({
    minHeight: 42,
    border: `1.5px solid ${sel ? C.primary : C.border}`,
    borderRadius: 10,
    background: sel
      ? `linear-gradient(135deg, ${C.blue}, ${C.primary})`
      : C.white,
    color: sel ? C.white : C.ink,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 800,
  }),
  scaleLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: C.gray,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 850,
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: '1.1rem 0 0.7rem',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: '0.75rem 0.85rem',
    fontSize: 14,
    fontFamily: 'inherit',
    color: C.ink,
    background: C.white,
    marginBottom: '0.75rem',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: '0.75rem 0.85rem',
    fontSize: 14,
    fontFamily: 'inherit',
    color: C.ink,
    background: C.white,
    marginBottom: '0.75rem',
    resize: 'vertical' as const,
    minHeight: 90,
    outline: 'none',
  },
  btnRow: { display: 'flex', gap: 10, marginTop: '1.35rem' },
  btnPrimary: (dis: boolean) => ({
    flex: 1,
    padding: '13px 14px',
    background: dis
      ? '#B8C2D6'
      : `linear-gradient(135deg, ${C.blue}, ${C.primary})`,
    color: C.white,
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 850,
    cursor: dis ? 'not-allowed' : 'pointer',
    boxShadow: dis ? 'none' : '0 12px 24px rgba(18, 151, 244, 0.20)',
  }),
  btnBack: {
    minWidth: 48,
    padding: '13px 15px',
    background: C.white,
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 15,
    color: C.gray,
    cursor: 'pointer',
    fontWeight: 800,
  },
  btnGhost: {
    padding: '12px 14px',
    background: C.white,
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 14,
    color: C.navy,
    cursor: 'pointer',
    fontWeight: 800,
  },
  pairGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: '1rem',
  },
  pairCard: (sel: boolean) => ({
    border: `2px solid ${sel ? C.primary : C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    background: C.white,
    outline: sel ? `3px solid rgba(85, 40, 216, 0.16)` : 'none',
  }),
  pairSwatch: (c1: string, c2: string) => ({
    height: 74,
    background: `linear-gradient(90deg, ${c1} 50%, ${c2} 50%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  swatchTag: {
    background: 'rgba(7,20,63,0.76)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    padding: '4px 8px',
    borderRadius: 6,
  },
  pairLabel: {
    padding: '9px 10px',
    fontSize: 13,
    color: C.ink,
    textAlign: 'center' as const,
    fontWeight: 750,
  },
  consentBox: {
    background: C.primaryLt,
    border: `1.5px solid #D6C9FF`,
    borderRadius: 12,
    padding: '1rem',
    marginBottom: '1rem',
    fontSize: 14,
    color: '#351B8E',
    lineHeight: 1.65,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: '0.75rem',
    cursor: 'pointer',
  },
  checkLabel: { fontSize: 14, color: C.ink, lineHeight: 1.5 },
  notice: {
    fontSize: 12,
    color: C.gray,
    background: C.muted,
    borderRadius: 10,
    padding: '0.7rem 0.85rem',
    marginTop: '0.15rem',
    lineHeight: 1.6,
  },
  resultHeader: {
    background: `linear-gradient(135deg, ${C.navy}, ${C.primary})`,
    color: C.white,
    borderRadius: 16,
    padding: '1.2rem',
    marginBottom: '1rem',
  },
  resultType: {
    fontSize: 25,
    fontWeight: 900,
    marginBottom: 6,
    lineHeight: 1.2,
  },
  resultMeta: { fontSize: 13, opacity: 0.86, lineHeight: 1.5 },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    margin: '1rem 0',
  },
  miniCard: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '0.95rem',
  },
  miniLabel: {
    fontSize: 12,
    color: C.gray,
    fontWeight: 850,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 5,
  },
  miniValue: { fontSize: 18, color: C.navy, fontWeight: 900, lineHeight: 1.25 },
  list: {
    margin: '0.5rem 0 0',
    paddingLeft: '1.1rem',
    color: C.gray,
    lineHeight: 1.7,
  },
  errorBanner: {
    background: '#FDE8E8',
    border: `1.5px solid ${C.danger}`,
    borderRadius: 10,
    padding: '0.75rem 1rem',
    fontSize: 13,
    color: '#8B1A1A',
    marginTop: '1rem',
  },
};

const CVD_OPTIONS: { value: CvdValue; label: string; sub?: string }[] = [
  {
    value: 'none',
    label: 'No - I have typical color vision',
    sub: "I'm completing this as an ally, designer, student, or researcher.",
  },
  {
    value: 'rg_d',
    label: 'Red-green CVD - deuteranopia / deuteranomaly',
    sub: 'Greens, reds, oranges, and browns can become hard to separate.',
  },
  {
    value: 'rg_p',
    label: 'Red-green CVD - protanopia / protanomaly',
    sub: 'Reds can look darker, muted, or easier to miss.',
  },
  {
    value: 'by',
    label: 'Blue-yellow CVD - tritanopia / tritanomaly',
    sub: 'Blue, green, yellow, and violet distinctions can be difficult.',
  },
  {
    value: 'total',
    label: 'Very limited color vision / achromatopsia',
    sub: 'Color is absent or extremely reduced.',
  },
  { value: 'unsure', label: "I have CVD but I'm not sure of the type" },
];

const FRICTION_QS = [
  {
    id: 'cooking',
    label: 'Cooking - judging ripeness, doneness, or freshness',
  },
  { id: 'dressing', label: 'Dressing - matching or choosing clothing colors' },
  {
    id: 'navigation',
    label: 'Navigation - maps, transit lines, or road signs',
  },
  {
    id: 'work',
    label: 'Work or school - charts, slides, spreadsheets, diagrams',
  },
  {
    id: 'healthcare',
    label: 'Healthcare - medication labels, test strips, charts',
  },
  {
    id: 'social',
    label: 'Social situations - color jokes, questions, or mistakes',
  },
];

const WORST_OPTIONS = [
  { value: 'cooking', label: 'Cooking - food safety, ripeness, or freshness' },
  { value: 'dressing', label: 'Dressing - matching or choosing colors' },
  { value: 'navigation', label: 'Navigation - maps, routes, transit, signs' },
  { value: 'work', label: 'Work or school - charts, presentations, documents' },
  { value: 'healthcare', label: 'Healthcare - labels, strips, test results' },
  {
    value: 'social',
    label: "Social situations - being asked 'what color is that?'",
  },
  { value: 'other', label: 'Something else' },
];

const COLOR_PAIRS = [
  {
    id: 'rg',
    label: 'Red vs green',
    c1: '#C43C32',
    c2: '#2CA85D',
    t: 'Red / Green',
  },
  {
    id: 'rb',
    label: 'Red vs black',
    c1: '#AE2F34',
    c2: '#1C2433',
    t: 'Red / Black',
  },
  {
    id: 'by',
    label: 'Blue vs yellow',
    c1: '#1C83D4',
    c2: '#E9B949',
    t: 'Blue / Yellow',
  },
  {
    id: 'bp',
    label: 'Blue vs purple',
    c1: '#1297F4',
    c2: '#7048E8',
    t: 'Blue / Purple',
  },
  {
    id: 'og',
    label: 'Orange vs brown',
    c1: '#E67E22',
    c2: '#795548',
    t: 'Orange / Brown',
  },
  {
    id: 'none',
    label: 'None of these',
    c1: '#A7B0C4',
    c2: '#E8ECF5',
    t: 'No clear pair',
  },
];

const TOOL_OPTIONS = [
  { value: 'nothing', label: 'Nothing - I just adapt' },
  { value: 'glasses', label: 'Color-correcting glasses' },
  { value: 'phone', label: 'Phone camera or accessibility mode' },
  { value: 'colornaming', label: 'A color-naming app' },
  { value: 'askothers', label: 'Asking friends, family, or colleagues' },
  { value: 'osfeatures', label: 'OS accessibility features or high contrast' },
];

const TOTAL_STEPS = 6;

function Logo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div style={S.logoMark}>C</div>;
  }

  return (
    <img
      src="/chromiview-logo.png"
      alt="Chromiview logo"
      style={S.logoImg}
      onError={() => setFailed(true)}
    />
  );
}

function getTopFriction(friction: Record<string, number>) {
  const entries = Object.entries(friction);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function labelForArea(id: string | null) {
  const labels: Record<string, string> = {
    cooking: 'Cooking',
    dressing: 'Dressing',
    navigation: 'Navigation',
    work: 'Work or school',
    healthcare: 'Healthcare',
    social: 'Social situations',
    other: 'Something else',
  };
  return id ? labels[id] || id : 'Not enough data';
}

function inferResult(
  cvd: CvdValue | null,
  pair: string | null,
  friction: Record<string, number>
) {
  const top = getTopFriction(friction);
  let type = 'No clear CVD pattern';
  let confidence: Confidence = 'Low';
  let explanation =
    'Your answers do not point strongly toward one color vision deficiency pattern. This can happen with typical color vision, mild CVD, screen differences, or incomplete answers.';

  if (cvd === 'rg_d') {
    type = 'Likely deutan pattern';
    confidence =
      pair === 'rg' || pair === 'og' || pair === 'bp' ? 'High' : 'Medium';
    explanation =
      'Your answers fit a deutan red-green pattern, where greens, reds, oranges, browns, blues, and purples may be easier to confuse.';
  } else if (cvd === 'rg_p') {
    type = 'Likely protan pattern';
    confidence =
      pair === 'rg' || pair === 'rb' || pair === 'og' ? 'High' : 'Medium';
    explanation =
      'Your answers fit a protan red-green pattern, where reds can appear darker or less noticeable and may be confused with greens, browns, or black.';
  } else if (cvd === 'by') {
    type = 'Possible tritan pattern';
    confidence = pair === 'by' || pair === 'bp' ? 'High' : 'Medium';
    explanation =
      'Your answers fit a blue-yellow pattern, where blues, greens, yellows, and violet shades may be harder to tell apart.';
  } else if (cvd === 'total') {
    type = 'Very limited color perception';
    confidence = 'Medium';
    explanation =
      'Your self-report suggests color is absent or extremely reduced. Chromiview can help with adaptations, but formal clinical testing is important for this pattern.';
  } else if (cvd === 'unsure') {
    if (pair === 'rg' || pair === 'rb' || pair === 'og') {
      type = 'Possible red-green CVD';
      confidence = 'Medium';
      explanation =
        'Your hardest color pair points toward a red-green difficulty, but this screening cannot separate protan from deutan reliably by itself.';
    } else if (pair === 'by' || pair === 'bp') {
      type = 'Possible blue-yellow CVD';
      confidence = 'Low';
      explanation =
        'Your hardest color pair may involve blue-yellow or blue-purple confusion. A calibrated test would be needed to check this properly.';
    }
  } else if (cvd === 'none' && pair !== 'none') {
    type = 'Typical vision with situational color friction';
    confidence = 'Low';
    explanation =
      'You reported typical color vision, but some color pairs or daily contexts may still create friction because of design, lighting, contrast, or display quality.';
  }

  return {
    type,
    confidence,
    explanation,
    topArea: top || null,
  };
}

function buildRecommendations(
  result: ReturnType<typeof inferResult>,
  worst: string | null
) {
  const area = worst || result.topArea;
  const base = [
    'Use labels, icons, patterns, and position instead of relying on color alone.',
    'Increase contrast and brightness differences when reading charts, maps, or status indicators.',
    'Try phone color filters or color naming tools for quick checks in daily situations.',
  ];

  if (result.type.includes('protan')) {
    base.unshift(
      'Be extra careful with red warnings, red text, and red-on-black combinations.'
    );
  }

  if (result.type.includes('deutan')) {
    base.unshift(
      'For red-green tasks, compare brightness, texture, labels, and location before deciding.'
    );
  }

  if (result.type.includes('tritan') || result.type.includes('blue-yellow')) {
    base.unshift(
      'Avoid blue-yellow-only legends; use labels and clear lightness differences.'
    );
  }

  if (area === 'cooking') {
    base.push(
      'For food, use timers, thermometers, texture, smell, and labels rather than color alone.'
    );
  }

  if (area === 'navigation') {
    base.push(
      'For maps, turn on route labels, high contrast mode, and avoid depending on line color alone.'
    );
  }

  if (area === 'work') {
    base.push(
      'For school or work, ask for chart labels, direct annotations, and CVD-safe palettes.'
    );
  }

  if (area === 'healthcare') {
    base.push(
      'For healthcare tasks, confirm medication colors, test-strip readings, and alerts with a professional or labeled reference.'
    );
  }

  return base.slice(0, 6);
}

function buildAiInsight(args: {
  result: ReturnType<typeof inferResult>;
  worst: string | null;
  tools: string[];
  wishlist: string;
}) {
  const { result, worst, tools, wishlist } = args;
  const area = labelForArea(worst || result.topArea);
  const currentTools =
    tools.length === 0 || tools.includes('nothing')
      ? 'You are mostly adapting without dedicated tools.'
      : `You already use ${tools.length} support option${
          tools.length === 1 ? '' : 's'
        }, so the next best step is making those tools easier to use in the moments that matter.`;
  const wish = wishlist.trim()
    ? `Your wishlist points toward this product idea: "${wishlist.trim()}".`
    : 'Your wishlist is blank, so Chromiview should suggest practical defaults instead of assuming what you need.';

  return `${
    result.type
  } appears to affect ${area.toLowerCase()} most. ${currentTools} ${wish} A good next action is to create one repeatable strategy for your hardest situation, then test whether it reduces mistakes or stress over a week.`;
}

function buildReportExport(args: {
  result: ReturnType<typeof inferResult>;
  recommendations: string[];
  aiInsight: string;
  pair: string | null;
  worst: string | null;
  tools: string[];
  wishlist: string;
}) {
  const { result, recommendations, aiInsight, pair, worst, tools, wishlist } =
    args;
  const pairLabel =
    COLOR_PAIRS.find((p) => p.id === pair)?.label || 'Not selected';
  const toolLabels =
    tools.length > 0
      ? tools
          .map(
            (tool) =>
              TOOL_OPTIONS.find((option) => option.value === tool)?.label ||
              tool
          )
          .join(', ')
      : 'None selected';

  return [
    'Chromiview Color Vision Report',
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    `Screening result: ${result.type}`,
    `Confidence: ${result.confidence}`,
    `Explanation: ${result.explanation}`,
    '',
    `Main friction area: ${labelForArea(result.topArea)}`,
    `Most stressful situation: ${labelForArea(worst)}`,
    `Hardest color pair: ${pairLabel}`,
    `Support tools used: ${toolLabels}`,
    '',
    'Personalized summary',
    aiInsight,
    '',
    'Recommended next steps',
    ...recommendations.map((item, index) => `${index + 1}. ${item}`),
    '',
    wishlist.trim() ? `Wishlist: ${wishlist.trim()}` : 'Wishlist: Not provided',
    '',
    'Important: Chromiview is an educational screening tool, not a medical diagnosis. Confirm important results with a qualified eye-care professional.',
  ].join('\n');
}

export default function App() {
  const [step, setStep] = useState(1);
  const [cvd, setCvd] = useState<CvdValue | null>(null);
  const [friction, setFriction] = useState<Record<string, number>>({});
  const [worst, setWorst] = useState<string | null>(null);
  const [worstOther, setWorstOther] = useState('');
  const [pair, setPair] = useState<string | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState('');
  const [email, setEmail] = useState('');
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(
    () => inferResult(cvd, pair, friction),
    [cvd, pair, friction]
  );
  const recommendations = useMemo(
    () => buildRecommendations(result, worst),
    [result, worst]
  );
  const aiInsight = useMemo(
    () => buildAiInsight({ result, worst, tools, wishlist }),
    [result, worst, tools, wishlist]
  );

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pct = Math.round((Math.min(step - 1, TOTAL_STEPS) / TOTAL_STEPS) * 100);

  const toggleTool = (val: string) => {
    setTools((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    const payload = {
      cvd,
      friction,
      worst,
      worstOther,
      pair,
      tools,
      wishlist,
      email,
      screeningResult: result,
      recommendations,
      createdAt: new Date().toISOString(),
    };

    try {
      // Replace this with a Supabase insert or Edge Function call.
      console.log('Chromiview response:', payload);
      await new Promise((resolve) => setTimeout(resolve, 650));
      go(8);
    } catch {
      setError('Something went wrong while saving. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const frictionComplete = FRICTION_QS.every((q) => friction[q.id]);

  const exportReport = () => {
    const text = buildReportExport({
      result,
      recommendations,
      aiInsight,
      pair,
      worst,
      tools,
      wishlist,
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chromiview-report-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={S.page}>
      <style>
        {`
          @media print {
            body { background: #fff !important; }
            button { display: none !important; }
            main { background: #fff !important; }
          }
        `}
      </style>
      <div style={S.wrap}>
        <div style={S.topRow}>
          <div style={S.logo}>
            <Logo />
            <div>
              <div style={S.logoName}>Chromiview</div>
              <div style={S.logoTag}>Seeing the world in full color</div>
            </div>
          </div>
          <div style={S.modePill}>Educational screening</div>
        </div>

        <section style={S.shell}>
          <div style={S.progBar}>
            <div style={S.progFill(step === 8 ? 100 : pct)} />
          </div>

          {step === 1 && (
            <div>
              <div style={S.stepLabel}>Start</div>
              <h1 style={S.h1}>
                Understand your color vision pattern and what to do next
              </h1>
              <p style={S.sub}>
                Chromiview combines a short questionnaire, a quick color-pair
                screening task, and personalized guidance for everyday
                situations like maps, cooking, school, clothing, and healthcare.
              </p>

              <div style={S.callout('warning')}>
                <div style={S.calloutTitle}>Important note</div>
                This is an educational screening tool, not a medical diagnosis.
                For school, work, driving, aviation, or health decisions,
                confirm results with a qualified eye-care professional.
              </div>

              <div style={S.featureGrid}>
                <div style={S.feature}>
                  <div style={S.featureIcon}>1</div>
                  <div style={S.h3}>Screen</div>
                  <div style={S.featureText}>
                    Answer targeted questions and choose difficult color pairs.
                  </div>
                </div>
                <div style={S.feature}>
                  <div style={S.featureIcon}>2</div>
                  <div style={S.h3}>Learn</div>
                  <div style={S.featureText}>
                    Get a likely pattern, confidence level, and explanation.
                  </div>
                </div>
                <div style={S.feature}>
                  <div style={S.featureIcon}>3</div>
                  <div style={S.h3}>Act</div>
                  <div style={S.featureText}>
                    Receive practical adaptations and an AI-style summary.
                  </div>
                </div>
              </div>

              <div style={S.btnRow}>
                <button style={S.btnPrimary(false)} onClick={() => go(2)}>
                  Start screening
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={S.stepLabel}>Step 1 of {TOTAL_STEPS}</div>
              <h2 style={S.h2}>
                What do you already know about your color vision?
              </h2>
              <p style={S.sub}>
                Choose the option that best matches your current understanding.
              </p>
              {CVD_OPTIONS.map((o) => (
                <label key={o.value} style={S.card(cvd === o.value)}>
                  <input
                    type="radio"
                    name="cvd"
                    checked={cvd === o.value}
                    onChange={() => setCvd(o.value)}
                    style={{
                      accentColor: C.primary,
                      marginTop: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    <span style={S.cardLabel}>{o.label}</span>
                    {o.sub && <span style={S.cardSub}>{o.sub}</span>}
                  </span>
                </label>
              ))}
              <div style={S.btnRow}>
                <button style={S.btnBack} onClick={() => go(1)}>
                  Back
                </button>
                <button
                  style={S.btnPrimary(!cvd)}
                  disabled={!cvd}
                  onClick={() => go(3)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={S.stepLabel}>Step 2 of {TOTAL_STEPS}</div>
              <h2 style={S.h2}>
                How much friction do colors create in daily life?
              </h2>
              <p style={S.sub}>
                Rate each situation from 1 for no friction to 5 for significant
                friction.
              </p>
              {FRICTION_QS.map((q) => (
                <div key={q.id} style={S.scaleWrap}>
                  <div style={S.scaleQuestion}>{q.label}</div>
                  <div style={S.scaleGrid}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        style={S.scaleBtn(friction[q.id] === n)}
                        onClick={() =>
                          setFriction((f) => ({ ...f, [q.id]: n }))
                        }
                        aria-label={`${n} out of 5 for ${q.label}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div style={S.scaleLabels}>
                    <span>No friction</span>
                    <span>Significant friction</span>
                  </div>
                </div>
              ))}
              <div style={S.btnRow}>
                <button style={S.btnBack} onClick={() => go(2)}>
                  Back
                </button>
                <button
                  style={S.btnPrimary(!frictionComplete)}
                  disabled={!frictionComplete}
                  onClick={() => go(4)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={S.stepLabel}>Step 3 of {TOTAL_STEPS}</div>
              <h2 style={S.h2}>Which one situation causes the most stress?</h2>
              <p style={S.sub}>
                Pick the situation where better support would make the biggest
                difference.
              </p>
              {WORST_OPTIONS.map((o) => (
                <label key={o.value} style={S.card(worst === o.value)}>
                  <input
                    type="radio"
                    name="worst"
                    checked={worst === o.value}
                    onChange={() => setWorst(o.value)}
                    style={{
                      accentColor: C.primary,
                      marginTop: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span style={S.cardLabel}>{o.label}</span>
                </label>
              ))}
              {worst === 'other' && (
                <textarea
                  style={S.textarea}
                  value={worstOther}
                  onChange={(e) => setWorstOther(e.target.value)}
                  placeholder="Tell us briefly what that situation is."
                />
              )}
              <div style={S.btnRow}>
                <button style={S.btnBack} onClick={() => go(3)}>
                  Back
                </button>
                <button
                  style={S.btnPrimary(!worst)}
                  disabled={!worst}
                  onClick={() => go(5)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={S.stepLabel}>Step 4 of {TOTAL_STEPS}</div>
              <h2 style={S.h2}>Quick color-pair screening</h2>
              <p style={S.sub}>
                Which pair is hardest for you to distinguish? This is not a
                calibrated clinical test, but it helps Chromiview personalize
                your result.
              </p>
              <div style={S.pairGrid}>
                {COLOR_PAIRS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    style={S.pairCard(pair === p.id)}
                    onClick={() => setPair(p.id)}
                    aria-label={`Color pair: ${p.label}`}
                  >
                    <div style={S.pairSwatch(p.c1, p.c2)}>
                      <span style={S.swatchTag}>{p.t}</span>
                    </div>
                    <div style={S.pairLabel}>{p.label}</div>
                  </button>
                ))}
              </div>
              <div style={S.btnRow}>
                <button style={S.btnBack} onClick={() => go(4)}>
                  Back
                </button>
                <button
                  style={S.btnPrimary(!pair)}
                  disabled={!pair}
                  onClick={() => go(6)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <div style={S.stepLabel}>Step 5 of {TOTAL_STEPS}</div>
              <h2 style={S.h2}>What support do you use today?</h2>
              <p style={S.sub}>
                This helps Chromiview recommend realistic next steps, not
                fantasy features.
              </p>
              {TOOL_OPTIONS.map((o) => (
                <label key={o.value} style={S.card(tools.includes(o.value))}>
                  <input
                    type="checkbox"
                    checked={tools.includes(o.value)}
                    onChange={() => toggleTool(o.value)}
                    style={{
                      accentColor: C.primary,
                      marginTop: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span style={S.cardLabel}>{o.label}</span>
                </label>
              ))}
              <div style={S.sectionTitle}>What would help you most?</div>
              <textarea
                style={S.textarea}
                value={wishlist}
                onChange={(e) => setWishlist(e.target.value)}
                placeholder="Example: a camera tool that labels colors in real time, or a map mode that labels transit lines."
              />
              <div style={S.btnRow}>
                <button style={S.btnBack} onClick={() => go(5)}>
                  Back
                </button>
                <button style={S.btnPrimary(false)} onClick={() => go(7)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <div style={S.stepLabel}>Step 6 of {TOTAL_STEPS}</div>
              <h2 style={S.h2}>Before you submit</h2>
              <p style={S.sub}>
                Please confirm consent if you want your anonymous response
                included in the citizen science dataset.
              </p>

              <div style={S.consentBox}>
                <strong>What happens with your data:</strong> Your questionnaire
                answers are stored anonymously unless you choose to add an
                email. Aggregate findings can be used for Chromiview reports,
                design research, and accessibility education.
              </div>

              <label style={S.checkRow}>
                <input
                  type="checkbox"
                  checked={consent1}
                  onChange={(e) => setConsent1(e.target.checked)}
                  style={{
                    accentColor: C.primary,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <span style={S.checkLabel}>
                  I understand this is an educational screening tool and that my
                  anonymous answers may be used for color vision research and
                  product improvement.
                </span>
              </label>

              <label style={S.checkRow}>
                <input
                  type="checkbox"
                  checked={consent2}
                  onChange={(e) => setConsent2(e.target.checked)}
                  style={{
                    accentColor: C.primary,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <span style={S.checkLabel}>
                  I confirm I am 16 years of age or older.
                </span>
              </label>

              <div style={S.sectionTitle}>
                Follow the research updates (optional)
              </div>
              <input
                type="email"
                style={S.input}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div style={S.notice}>
                Email is optional and should be stored separately from anonymous
                research answers in a real database.
              </div>

              {error && <div style={S.errorBanner}>{error}</div>}

              <div style={S.btnRow}>
                <button style={S.btnBack} onClick={() => go(6)}>
                  Back
                </button>
                <button
                  style={S.btnPrimary(!consent1 || !consent2 || submitting)}
                  disabled={!consent1 || !consent2 || submitting}
                  onClick={submit}
                >
                  {submitting ? 'Saving...' : 'Submit and finish'}
                </button>
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <div style={S.stepLabel}>Your report</div>
              <div style={S.resultHeader}>
                <div style={S.resultType}>{result.type}</div>
                <div style={S.resultMeta}>
                  Confidence: {result.confidence}. This result is educational
                  and should be confirmed with formal color vision testing if it
                  matters for health, school, work, or licensing.
                </div>
              </div>

              <div style={S.callout('success')}>
                <div style={S.calloutTitle}>Personalized summary</div>
                {aiInsight}
              </div>

              <div style={S.resultGrid}>
                <div style={S.miniCard}>
                  <div style={S.miniLabel}>Pattern</div>
                  <div style={S.miniValue}>{result.type}</div>
                </div>
                <div style={S.miniCard}>
                  <div style={S.miniLabel}>Main friction</div>
                  <div style={S.miniValue}>{labelForArea(result.topArea)}</div>
                </div>
                <div style={S.miniCard}>
                  <div style={S.miniLabel}>Confidence</div>
                  <div style={S.miniValue}>{result.confidence}</div>
                </div>
              </div>

              <div style={S.miniCard}>
                <h3 style={S.h3}>What to do next</h3>
                <ul style={S.list}>
                  {recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>

              <div style={{ ...S.callout('warning'), marginTop: '1rem' }}>
                <div style={S.calloutTitle}>Future AI upgrade</div>
                Connect this screen to a Supabase Edge Function that sends the
                anonymous answers to an AI model and returns a stricter JSON
                report with summary, risks, adaptations, and product ideas.
              </div>

              <div style={S.btnRow}>
                <button
                  style={S.btnPrimary(false)}
                  onClick={() => window.print()}
                >
                  Save as PDF
                </button>
                <button style={S.btnGhost} onClick={exportReport}>
                  Export report
                </button>
                <button style={S.btnGhost} onClick={() => go(1)}>
                  Start over
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
