import { AGE_OPTIONS, COLOR_PAIRS, CVD_OPTIONS, FRICTION_QS, PLATE_QUESTIONS } from './data';
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

function inferLikelyType(answers: Answers, missedPlateIds: string[]) {
  const scores = {
    typical: 0,
    deutan: 0,
    protan: 0,
    tritan: 0,
    achromatopsia: 0,
  };
  const reasons: string[] = [];

  if (answers.cvd === 'none') {
    scores.typical += 3;
    reasons.push('You reported typical colour vision.');
  }
  if (answers.cvd === 'rg_d') {
    scores.deutan += 5;
    reasons.push('You reported a deutan-family red-green pattern.');
  }
  if (answers.cvd === 'rg_p') {
    scores.protan += 5;
    reasons.push('You reported a protan-family red-green pattern.');
  }
  if (answers.cvd === 'by') {
    scores.tritan += 5;
    reasons.push('You reported a blue-yellow/tritan-family pattern.');
  }
  if (answers.cvd === 'total') {
    scores.achromatopsia += 6;
    reasons.push('You reported very limited colour perception.');
  }

  if (answers.pair === 'rg') {
    scores.deutan += 3;
    scores.protan += 3;
    reasons.push('Red vs green was selected as the hardest colour pair.');
  }
  if (answers.pair === 'rb') {
    scores.protan += 3;
    scores.deutan += 1;
    reasons.push('Red vs black was selected, which can align with protan-family red darkening.');
  }
  if (answers.pair === 'og') {
    scores.deutan += 2;
    scores.protan += 2;
    reasons.push('Orange vs brown was selected, which often sits near red-green confusion.');
  }
  if (answers.pair === 'by') {
    scores.tritan += 3;
    reasons.push('Blue vs yellow was selected as the hardest colour pair.');
  }
  if (answers.pair === 'bp') {
    scores.tritan += 2;
    scores.deutan += 1;
    scores.protan += 1;
    reasons.push('Blue vs purple was selected, which can appear in tritan-like or red-green patterns.');
  }
  if (answers.pair === 'none') {
    scores.typical += 1;
    reasons.push('No listed colour pair was selected as difficult.');
  }

  if (missedPlateIds.includes('plate_star')) {
    scores.deutan += 2;
    scores.protan += 2;
    reasons.push('The red-green colour picture was marked maybe or no.');
  }
  if (missedPlateIds.includes('plate_circle')) {
    scores.tritan += 2;
    scores.deutan += 1;
    scores.protan += 1;
    reasons.push('The blue-purple colour picture was marked maybe or no.');
  }
  if (missedPlateIds.includes('plate_number')) {
    scores.tritan += 1;
    scores.deutan += 1;
    scores.protan += 1;
    reasons.push('The yellow-brown number picture was marked maybe or no.');
  }
  if (!missedPlateIds.length) scores.typical += 1;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = ranked[0];
  const [, secondScore] = ranked[1];
  const labels: Record<string, string> = {
    typical: 'Typical colour vision / no strong CVD pattern',
    deutan: 'Deutan-family red-green colour vision deficiency',
    protan: 'Protan-family red-green colour vision deficiency',
    tritan: 'Tritan-family blue-yellow colour vision deficiency',
    achromatopsia: 'Very limited colour perception / achromatopsia-like pattern',
  };

  if (topScore === 0) {
    return {
      likelyType: 'Not enough information yet',
      likelyReason: 'Chromiview needs completed colour-picture, colour-pair, and self-report answers before it can offer a useful indication.',
    };
  }

  const confidenceText = topScore === secondScore ? 'This is a close match, so treat it as low confidence.' : 'This was the strongest pattern in your answers.';
  return {
    likelyType: labels[topKey],
    likelyReason: `${confidenceText} ${reasons.slice(0, 3).join(' ')}`,
  };
}

export function inferResult(answers: Answers): ResultSummary {
  const reportedPattern = CVD_OPTIONS.find((option) => option.value === answers.cvd)?.label || 'Not reported';
  const pair = COLOR_PAIRS.find((option) => option.id === answers.pair);
  const topArea = getTopFriction(answers.friction);
  const missedPlates = PLATE_QUESTIONS.filter((plate) => ['no', 'maybe'].includes(answers.plateResponses[plate.id]));
  const likely = inferLikelyType(answers, missedPlates.map((plate) => plate.id));
  const observedPatterns = [
    answers.ageGroup ? `Age group: ${AGE_OPTIONS.find((option) => option.value === answers.ageGroup)?.label || answers.ageGroup}.` : 'Age group was skipped.',
    pair ? `Selected difficult pair: ${pair.label} (${pair.pattern}).` : 'No colour-pair pattern selected.',
    topArea ? `Highest daily friction: ${labelForArea(topArea)}.` : 'Daily friction ratings are incomplete.',
  ];
  if (missedPlates.length) {
    observedPatterns.push(`Colour picture activity: ${missedPlates.length} of ${PLATE_QUESTIONS.length} cards were marked “maybe” or “no”.`);
  }
  const selfReportMatchesPair =
    (answers.cvd === 'rg_d' || answers.cvd === 'rg_p') && ['rg', 'rb', 'og', 'bp'].includes(answers.pair || '');
  const tritanMatchesPair = answers.cvd === 'by' && ['by', 'bp'].includes(answers.pair || '');
  const limitedMatches = answers.cvd === 'total';
  const responseConsistency =
    selfReportMatchesPair || tritanMatchesPair || limitedMatches ? 'Moderate' : answers.cvd && answers.pair ? 'Mixed' : 'Limited';

  return {
    likelyType: likely.likelyType,
    likelyReason: likely.likelyReason,
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
  return `${result.likelyType} is the strongest indication from your answers, and ${result.reportedPattern} is your reported pattern. Your responses point most strongly to ${area.toLowerCase()} as the area to improve first. ${toolText} Start with one repeatable adaptation and test whether it reduces mistakes or stress over a week.`;
}

export function validateStep(step: number, answers: Answers) {
  if (step === 1 && !answers.ageGroup) return 'Choose an age group, or choose “Prefer not to say”.';
  if (step === 2 && !answers.cvd) return 'Choose the option that best describes your current understanding.';
  if (step === 3 && !PLATE_QUESTIONS.every((plate) => answers.plateResponses[plate.id])) return 'Answer each colour picture question before continuing.';
  if (step === 4 && !FRICTION_QS.every((q) => answers.friction[q.id])) return 'Rate every daily-life situation before continuing.';
  if (step === 5 && !answers.worst) return 'Choose the situation that causes the most stress.';
  if (step === 5 && answers.worst === 'other' && answers.worstOther.trim().length < 3) return 'Briefly describe the other situation.';
  if (step === 6 && !answers.pair) return 'Choose a colour pair, or choose “None of these”.';
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
