import type { CvdValue } from './types';

export const DISCLAIMER =
  'Chromiview is a gentle, screen-based colour activity. It cannot diagnose a colour-vision deficiency. Results may be affected by the device, display settings, brightness, lighting, and colour filters. A qualified eye-care professional is needed for a clinical assessment.';

export const EMPTY_ANSWERS = {
  ageGroup: '',
  cvd: null,
  plateResponses: {},
  friction: {},
  worst: null,
  worstOther: '',
  pair: null,
  tools: [],
  wishlist: '',
  researchConsent: false,
};

export const AGE_OPTIONS = [
  { value: 'preschool', label: '3-5', sub: 'Preschool or early years' },
  { value: 'child', label: '6-10', sub: 'Primary school' },
  { value: 'teen', label: '11-17', sub: 'Older student' },
  { value: 'adult', label: '18+', sub: 'Grown-up helper or adult user' },
  { value: 'skip', label: 'Prefer not to say', sub: 'Skip this question' },
];

export const CVD_OPTIONS: { value: CvdValue; label: string; sub: string }[] = [
  { value: 'none', label: 'No - I have typical colour vision', sub: "I'm completing this as a helper, teacher, parent, designer, or researcher." },
  { value: 'rg_d', label: 'Red-green CVD - deutan family', sub: 'Greens, reds, oranges, browns, blues, and purples may be harder to separate.' },
  { value: 'rg_p', label: 'Red-green CVD - protan family', sub: 'Reds may appear darker, muted, or easier to miss.' },
  { value: 'by', label: 'Blue-yellow CVD - tritan family', sub: 'Blue, green, yellow, and violet distinctions may be difficult.' },
  { value: 'total', label: 'Very limited colour perception', sub: 'Colour is absent or extremely reduced.' },
  { value: 'unsure', label: "I have CVD but I'm not sure of the type", sub: 'Chromiview will describe patterns without assigning a diagnosis.' },
];

export const FRICTION_QS = [
  { id: 'cooking', label: 'Food - telling if fruit or snacks look ready' },
  { id: 'dressing', label: 'Clothes - matching colours when getting dressed' },
  { id: 'navigation', label: 'Finding the way - maps, signs, or coloured lines' },
  { id: 'work', label: 'Classroom - charts, drawings, slides, or worksheets' },
  { id: 'healthcare', label: 'Health labels - medicine labels or colour-coded charts with a grown-up' },
  { id: 'social', label: 'Friends - being asked about colours or feeling unsure' },
];

export const WORST_OPTIONS = [
  { value: 'cooking', label: 'Food - fruit, snacks, or cooking with a grown-up' },
  { value: 'dressing', label: 'Clothes - matching or choosing colours' },
  { value: 'navigation', label: 'Finding the way - maps, routes, signs' },
  { value: 'work', label: 'Classroom - charts, drawings, slides, worksheets' },
  { value: 'healthcare', label: 'Health labels - only with a grown-up helper' },
  { value: 'social', label: "Friends - being asked 'what colour is that?'" },
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

export const PLATE_QUESTIONS = [
  {
    id: 'plate_star',
    title: 'Colour picture 1',
    prompt: 'Can you see the star in the dots?',
    answer: 'star',
    kind: 'star',
    fg: '#C43C32',
    bg: '#2CA85D',
    interpretation: 'Missing this red-green plate may point toward red-green difficulty, which can be seen in deutan or protan patterns.',
  },
  {
    id: 'plate_circle',
    title: 'Colour picture 2',
    prompt: 'Can you see the circle in the dots?',
    answer: 'circle',
    kind: 'ring',
    fg: '#1C83D4',
    bg: '#7048E8',
    interpretation: 'Missing this blue-purple plate may point toward blue-purple or blue-yellow difficulty, sometimes associated with tritan patterns.',
  },
  {
    id: 'plate_number',
    title: 'Colour picture 3',
    prompt: 'Can you see the number 5 in the dots?',
    answer: 'number 5',
    kind: 'five',
    fg: '#E9B949',
    bg: '#795548',
    interpretation: 'Missing this yellow-brown number plate may point toward reduced colour separation when colours have similar warmth or brightness.',
  },
];

export const PLATE_ONLY_QUESTIONS = [
  {
    id: 'alpha_plate_1',
    title: 'Plate 1',
    prompt: 'What do you see?',
    answer: 'star',
    kind: 'star',
    fg: '#C43C32',
    bg: '#2CA85D',
  },
  {
    id: 'alpha_plate_2',
    title: 'Plate 2',
    prompt: 'What do you see?',
    answer: 'circle',
    kind: 'ring',
    fg: '#1C83D4',
    bg: '#7048E8',
  },
  {
    id: 'alpha_plate_3',
    title: 'Plate 3',
    prompt: 'What do you see?',
    answer: '5',
    kind: 'five',
    fg: '#E9B949',
    bg: '#795548',
  },
  {
    id: 'alpha_plate_4',
    title: 'Plate 4',
    prompt: 'What do you see?',
    answer: 'triangle',
    kind: 'triangle',
    fg: '#B83280',
    bg: '#2F9E44',
    interpretation: 'Missing this magenta-green plate may point toward red-green family difficulty, including deutan or protan patterns.',
  },
  {
    id: 'alpha_plate_5',
    title: 'Plate 5',
    prompt: 'What do you see?',
    answer: 'nothing',
    kind: 'none',
    fg: '#8A93A6',
    bg: '#B6BECF',
    interpretation: 'Choosing a symbol on a no-symbol control can suggest guessing, screen glare, or that the generated plate was confusing.',
  },
  {
    id: 'alpha_plate_6',
    title: 'Plate 6',
    prompt: 'What do you see?',
    answer: '2',
    kind: 'two',
    fg: '#C43C32',
    bg: '#E67E22',
    interpretation: 'Missing this red-orange plate may point toward reduced red sensitivity, which can be seen more often in protan patterns.',
  },
  {
    id: 'alpha_plate_7',
    title: 'Plate 7',
    prompt: 'What do you see?',
    answer: '6',
    kind: 'six',
    fg: '#2F9E44',
    bg: '#795548',
    interpretation: 'Missing this green-brown plate may point toward red-green family difficulty, often relevant to deutan or protan patterns.',
  },
  {
    id: 'alpha_plate_8',
    title: 'Plate 8',
    prompt: 'What do you see?',
    answer: '8',
    kind: 'eight',
    fg: '#1297F4',
    bg: '#B83280',
    interpretation: 'Missing this blue-pink plate may point toward difficulty separating blues, purples, and pinks; it does not identify one type by itself.',
  },
  {
    id: 'alpha_plate_9',
    title: 'Plate 9',
    prompt: 'What do you see?',
    answer: '9',
    kind: 'nine',
    fg: '#7048E8',
    bg: '#1C83D4',
    interpretation: 'Missing this purple-blue plate may point toward blue-purple difficulty, which can overlap with tritan-like patterns.',
  },
  {
    id: 'alpha_plate_10',
    title: 'Plate 10',
    prompt: 'What do you see?',
    answer: 'square',
    kind: 'square',
    fg: '#E9B949',
    bg: '#2CA85D',
    interpretation: 'Missing this yellow-green plate may point toward green-yellow separation difficulty, which can happen across several CVD patterns.',
  },
  {
    id: 'alpha_plate_11',
    title: 'Plate 11',
    prompt: 'What do you see?',
    answer: 'diamond',
    kind: 'diamond',
    fg: '#AE2F34',
    bg: '#1C83D4',
    interpretation: 'Missing this red-blue plate may point toward trouble using hue alone; compare it with the red-green and blue-purple results.',
  },
  {
    id: 'alpha_plate_12',
    title: 'Plate 12',
    prompt: 'What do you see?',
    answer: 'nothing',
    kind: 'none',
    fg: '#9AA6BB',
    bg: '#C4CAD7',
    interpretation: 'Choosing a symbol on this no-symbol control can suggest the plate set may be too noisy or the user is guessing.',
  },
];

export const PLATE_RESPONSE_OPTIONS = [
  { value: 'yes', label: 'Yes, I can see it' },
  { value: 'maybe', label: 'Maybe / a little bit' },
  { value: 'no', label: "No, I can't see it" },
];

export const PLATE_ONLY_RESPONSE_OPTIONS = ['star', 'circle', 'triangle', 'square', 'diamond', '2', '5', '6', '8', '9', 'nothing'];

export const TOOL_OPTIONS = [
  { value: 'nothing', label: 'Nothing - I just adapt' },
  { value: 'glasses', label: 'Colour-correcting glasses' },
  { value: 'phone', label: 'Phone camera or accessibility mode' },
  { value: 'colornaming', label: 'A colour-naming app' },
  { value: 'askothers', label: 'Asking a teacher, grown-up, friend, or family member' },
  { value: 'osfeatures', label: 'OS accessibility features or high contrast' },
];

export const PREPARATION_ITEMS = [
  'Use normal display settings.',
  'Disable night mode and blue-light filters if comfortable.',
  'Disable OS colour filters before answering.',
  'Use comfortable brightness.',
  'Avoid strong screen glare.',
  'For preschool demos, have a grown-up read the questions and remind children that this is not a test they can fail.',
];

export const LEARN_TOPICS = [
  { title: 'Protan family', body: 'Protan patterns can make reds appear darker or less noticeable. Use redundant warnings, labels, icons, and strong lightness contrast.' },
  { title: 'Deutan family', body: 'Deutan patterns often affect red-green distinctions. Avoid red/green-only status states and pair colour with text or position.' },
  { title: 'Tritan family', body: 'Tritan patterns may affect blue-yellow and blue-purple distinctions. Label legends and avoid blue/yellow-only coding.' },
  { title: 'Achromatopsia and very limited colour perception', body: 'Designs should work in grayscale with clear text, borders, spacing, and shape differences.' },
  { title: 'Colour-accessible design', body: 'Never communicate meaning by colour alone. Add labels, icons, textures, underlines, borders, and readable contrast.' },
];
