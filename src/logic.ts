import { COLOR_PAIRS, CVD_OPTIONS, FRICTION_QS } from './data';
import type { Answers, ResultSummary } from './types';

export function labelForArea(id: string | null) {
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

export function getTopFriction(friction: Record<string, number>) {
  const entries = Object.entries(friction);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export function inferResult(answers: Answers): ResultSummary {
  const reportedPattern = CVD_OPTIONS.find((option) => option.value === answers.cvd)?.label || 'Not reported';
  const pair = COLOR_PAIRS.find((option) => option.id === answers.pair);
  const topArea = getTopFriction(answers.friction);
  const observedPatterns = [
    pair ? `Selected difficult pair: ${pair.label} (${pair.pattern}).` : 'No colour-pair pattern selected.',
    topArea ? `Highest daily friction: ${labelForArea(topArea)}.` : 'Daily friction ratings are incomplete.',
  ];
  const selfReportMatchesPair =
    (answers.cvd === 'rg_d' || answers.cvd === 'rg_p') && ['rg', 'rb', 'og', 'bp'].includes(answers.pair || '');
  const tritanMatchesPair = answers.cvd === 'by' && ['by', 'bp'].includes(answers.pair || '');
  const limitedMatches = answers.cvd === 'total';
  const responseConsistency =
    selfReportMatchesPair || tritanMatchesPair || limitedMatches ? 'Moderate' : answers.cvd && answers.pair ? 'Mixed' : 'Limited';

  return {
    reportedPattern,
    observedPatterns,
    responseConsistency,
    topArea,
    limitations: [
      'This is not a calibrated clinical test.',
      'Screen brightness, display calibration, ambient lighting, night mode, and colour filters can change results.',
      'Chromiview cannot determine protanopia, deuteranopia, tritanopia, or achromatopsia clinically.',
    ],
  };
}

export function buildRecommendations(answers: Answers, result: ResultSummary) {
  const area = answers.worst || result.topArea;
  const base = [
    'Use labels, icons, patterns, and position instead of relying on colour alone.',
    'Increase contrast and brightness differences in charts, maps, buttons, and warnings.',
    'Use OS accessibility modes or colour naming tools for quick checks.',
  ];

  if (answers.cvd === 'rg_p') base.unshift('Treat red warnings and red-on-black combinations as high-risk and add text labels.');
  if (answers.cvd === 'rg_d') base.unshift('For red-green tasks, compare labels, position, brightness, and texture before deciding.');
  if (answers.cvd === 'by') base.unshift('Avoid blue-yellow-only legends; add labels and clear lightness contrast.');
  if (answers.cvd === 'total') base.unshift('Prioritise grayscale readability, strong borders, shapes, and text labels.');
  if (area === 'cooking') base.push('For food, use timers, thermometers, texture, smell, and labels rather than colour alone.');
  if (area === 'navigation') base.push('For maps, turn on route labels and high-contrast mode; avoid relying on line colour alone.');
  if (area === 'work') base.push('For school or work, ask for chart labels, direct annotations, and colour-safe palettes.');
  if (area === 'healthcare') base.push('For healthcare tasks, confirm medication colours, test-strip readings, and alerts with a professional or labelled reference.');

  return base.slice(0, 7);
}

export function buildPersonalSummary(answers: Answers, result: ResultSummary) {
  const area = labelForArea(answers.worst || result.topArea);
  const toolText =
    answers.tools.length === 0 || answers.tools.includes('nothing')
      ? 'You are mostly adapting without dedicated tools.'
      : `You already use ${answers.tools.length} support option${answers.tools.length === 1 ? '' : 's'}.`;
  return `${result.reportedPattern} is your reported pattern, and your responses point most strongly to ${area.toLowerCase()} as the area to improve first. ${toolText} Start with one repeatable adaptation and test whether it reduces mistakes or stress over a week.`;
}

export function validateStep(step: number, answers: Answers) {
  if (step === 1 && !answers.cvd) return 'Choose the option that best describes your current understanding.';
  if (step === 2 && !FRICTION_QS.every((q) => answers.friction[q.id])) return 'Rate every daily-life situation before continuing.';
  if (step === 3 && !answers.worst) return 'Choose the situation that causes the most stress.';
  if (step === 3 && answers.worst === 'other' && answers.worstOther.trim().length < 3) return 'Briefly describe the other situation.';
  if (step === 4 && !answers.pair) return 'Choose a colour pair, or choose “None of these”.';
  return '';
}

export function contrastRatio(hexA: string, hexB: string) {
  const lum = (hex: string) => {
    const clean = hex.replace('#', '');
    const parts = [0, 2, 4].map((start) => parseInt(clean.slice(start, start + 2), 16) / 255);
    const values = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function normaliseHex(value: string) {
  const clean = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(clean) ? clean : null;
}
