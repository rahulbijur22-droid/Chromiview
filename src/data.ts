import type { CvdValue } from './types';

export const DISCLAIMER =
  'Chromiview provides an informal, screen-based indication and cannot diagnose a colour-vision deficiency. Results may be affected by your device, display calibration, brightness, ambient lighting, and software colour filters. Consult a qualified eye-care professional for a clinical assessment.';

export const EMPTY_ANSWERS = {
  cvd: null,
  friction: {},
  worst: null,
  worstOther: '',
  pair: null,
  tools: [],
  wishlist: '',
  researchConsent: false,
  emailConsent: false,
  email: '',
};

export const CVD_OPTIONS: { value: CvdValue; label: string; sub: string }[] = [
  { value: 'none', label: 'No - I have typical colour vision', sub: "I'm completing this as an ally, designer, student, or researcher." },
  { value: 'rg_d', label: 'Red-green CVD - deutan family', sub: 'Greens, reds, oranges, browns, blues, and purples may be harder to separate.' },
  { value: 'rg_p', label: 'Red-green CVD - protan family', sub: 'Reds may appear darker, muted, or easier to miss.' },
  { value: 'by', label: 'Blue-yellow CVD - tritan family', sub: 'Blue, green, yellow, and violet distinctions may be difficult.' },
  { value: 'total', label: 'Very limited colour perception', sub: 'Colour is absent or extremely reduced.' },
  { value: 'unsure', label: "I have CVD but I'm not sure of the type", sub: 'Chromiview will describe patterns without assigning a diagnosis.' },
];

export const FRICTION_QS = [
  { id: 'cooking', label: 'Cooking - judging ripeness, doneness, or freshness' },
  { id: 'dressing', label: 'Dressing - matching or choosing clothing colours' },
  { id: 'navigation', label: 'Navigation - maps, transit lines, or road signs' },
  { id: 'work', label: 'Work or school - charts, slides, spreadsheets, diagrams' },
  { id: 'healthcare', label: 'Healthcare - medication labels, test strips, charts' },
  { id: 'social', label: 'Social situations - colour jokes, questions, or mistakes' },
];

export const WORST_OPTIONS = [
  { value: 'cooking', label: 'Cooking - food safety, ripeness, or freshness' },
  { value: 'dressing', label: 'Dressing - matching or choosing colours' },
  { value: 'navigation', label: 'Navigation - maps, routes, transit, signs' },
  { value: 'work', label: 'Work or school - charts, presentations, documents' },
  { value: 'healthcare', label: 'Healthcare - labels, strips, test results' },
  { value: 'social', label: "Social situations - being asked 'what colour is that?'" },
  { value: 'other', label: 'Something else' },
];

export const COLOR_PAIRS = [
  { id: 'rg', label: 'Red vs green', c1: '#C43C32', c2: '#2CA85D', pattern: 'red-green confusion' },
  { id: 'rb', label: 'Red vs black', c1: '#AE2F34', c2: '#1C2433', pattern: 'red-dark confusion' },
  { id: 'by', label: 'Blue vs yellow', c1: '#1C83D4', c2: '#E9B949', pattern: 'blue-yellow confusion' },
  { id: 'bp', label: 'Blue vs purple', c1: '#1297F4', c2: '#7048E8', pattern: 'blue-purple confusion' },
  { id: 'og', label: 'Orange vs brown', c1: '#E67E22', c2: '#795548', pattern: 'orange-brown confusion' },
  { id: 'none', label: 'None of these', c1: '#A7B0C4', c2: '#E8ECF5', pattern: 'no selected colour-pair confusion' },
];

export const TOOL_OPTIONS = [
  { value: 'nothing', label: 'Nothing - I just adapt' },
  { value: 'glasses', label: 'Colour-correcting glasses' },
  { value: 'phone', label: 'Phone camera or accessibility mode' },
  { value: 'colornaming', label: 'A colour-naming app' },
  { value: 'askothers', label: 'Asking friends, family, or colleagues' },
  { value: 'osfeatures', label: 'OS accessibility features or high contrast' },
];

export const PREPARATION_ITEMS = [
  'Use normal display settings.',
  'Disable night mode and blue-light filters if comfortable.',
  'Disable OS colour filters before answering.',
  'Use comfortable brightness.',
  'Avoid strong screen glare.',
];

export const LEARN_TOPICS = [
  { title: 'Protan family', body: 'Protan patterns can make reds appear darker or less noticeable. Use redundant warnings, labels, icons, and strong lightness contrast.' },
  { title: 'Deutan family', body: 'Deutan patterns often affect red-green distinctions. Avoid red/green-only status states and pair colour with text or position.' },
  { title: 'Tritan family', body: 'Tritan patterns may affect blue-yellow and blue-purple distinctions. Label legends and avoid blue/yellow-only coding.' },
  { title: 'Achromatopsia and very limited colour perception', body: 'Designs should work in grayscale with clear text, borders, spacing, and shape differences.' },
  { title: 'Colour-accessible design', body: 'Never communicate meaning by colour alone. Add labels, icons, textures, underlines, borders, and readable contrast.' },
];
