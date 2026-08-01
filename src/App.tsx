import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COLOR_PAIRS,
  CVD_OPTIONS,
  DISCLAIMER,
  EMPTY_ANSWERS,
  FRICTION_QS,
  AGE_OPTIONS,
  LEARN_TOPICS,
  PLATE_ONLY_QUESTIONS,
  PLATE_ONLY_RESPONSE_OPTIONS,
  PLATE_QUESTIONS,
  PLATE_RESPONSE_OPTIONS,
  PREPARATION_ITEMS,
  TOOL_OPTIONS,
  WORST_OPTIONS,
} from './data';
import {
  buildPersonalSummary,
  buildRecommendations,
  contrastRatio,
  inferResult,
  labelForArea,
  normaliseHex,
  validateStep,
} from './logic';
import { clearLocalData, loadAnswers, loadHistory, loadSettings, saveAnswers, saveHistory, saveSettings } from './storage';
import type { Answers, AppView, TextScale, ThemeMode } from './types';

const TOTAL_STEPS = 8;

function Logo() {
  return <img className="brand-logo" src="/chromiview-logo.png" width="48" height="48" alt="Chromiview logo" decoding="async" />;
}

function AppShell({
  view,
  setView,
  settings,
  setSettings,
  children,
}: {
  view: AppView;
  setView: (view: AppView) => void;
  settings: { theme: ThemeMode; textScale: TextScale };
  setSettings: (settings: { theme: ThemeMode; textScale: TextScale }) => void;
  children: React.ReactNode;
}) {
  const navItems: { view: AppView; label: string }[] = [
    { view: 'home', label: 'Home' },
    { view: 'prepare', label: 'Screening' },
    { view: 'tools', label: 'Tools' },
    { view: 'learn', label: 'Learn' },
    { view: 'privacy', label: 'Privacy' },
  ];

  return (
    <div className="app" data-theme={settings.theme} data-text={settings.textScale}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <button className="brand-button" type="button" onClick={() => setView('home')} aria-label="Go to Chromiview home">
          <Logo />
          <span>
            <strong>Chromiview</strong>
            <small>Colour vision screening and accessibility guidance</small>
          </span>
        </button>
        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <button key={item.view} type="button" className={view === item.view ? 'nav-active' : ''} onClick={() => setView(item.view)}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main id="main-content" className="main-shell">
        <AccessibilitySettings settings={settings} setSettings={setSettings} />
        {children}
      </main>

      <footer className="site-footer">
        <span>Copyright {new Date().getFullYear()} Chromiview.</span>
        <a href="mailto:hello@chromiview.app">Contact</a>
        <button type="button" onClick={() => setView('privacy')}>
          Privacy
        </button>
        <a href="/terms.html">Terms</a>
      </footer>
    </div>
  );
}

function AccessibilitySettings({
  settings,
  setSettings,
}: {
  settings: { theme: ThemeMode; textScale: TextScale };
  setSettings: (settings: { theme: ThemeMode; textScale: TextScale }) => void;
}) {
  return (
    <aside className="settings-panel" aria-label="Accessibility display settings">
      <label>
        Theme
        <select value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value as ThemeMode })}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="contrast">High contrast</option>
        </select>
      </label>
      <label>
        Text size
        <select value={settings.textScale} onChange={(event) => setSettings({ ...settings, textScale: event.target.value as TextScale })}>
          <option value="normal">Normal</option>
          <option value="large">Large</option>
          <option value="xlarge">Extra large</option>
        </select>
      </label>
    </aside>
  );
}

function ScreeningProgress({ step }: { step: number }) {
  const value = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-copy">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{value}% complete</span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label="Screening progress">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function hashText(text: string) {
  return text.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function createPlateRunSeed() {
  const cryptoValue = globalThis.crypto?.getRandomValues
    ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 2147483646);
  return (Date.now() ^ cryptoValue) >>> 0;
}

function colourVariant(hex: string, random: () => number) {
  const clean = hex.replace('#', '');
  const channels = [0, 2, 4].map((start) => parseInt(clean.slice(start, start + 2), 16));
  const shift = Math.round((random() - 0.5) * 42);
  return `rgb(${channels.map((channel) => Math.max(0, Math.min(255, channel + shift))).join(', ')})`;
}

function isInsideDigit(digit: string, x: number, y: number) {
  const segmentsByDigit: Record<string, string[]> = {
    two: ['top', 'upper-right', 'middle', 'lower-left', 'bottom'],
    five: ['top', 'upper-left', 'middle', 'lower-right', 'bottom'],
    six: ['top', 'upper-left', 'middle', 'lower-left', 'lower-right', 'bottom'],
    eight: ['top', 'upper-left', 'upper-right', 'middle', 'lower-left', 'lower-right', 'bottom'],
    nine: ['top', 'upper-left', 'upper-right', 'middle', 'lower-right', 'bottom'],
  };
  const segments = segmentsByDigit[digit] || [];
  const active = {
    top: x >= 36 && x <= 66 && y >= 23 && y <= 32,
    middle: x >= 35 && x <= 65 && y >= 46 && y <= 55,
    bottom: x >= 34 && x <= 64 && y >= 68 && y <= 77,
    'upper-left': x >= 31 && x <= 42 && y >= 29 && y <= 50,
    'upper-right': x >= 58 && x <= 69 && y >= 29 && y <= 50,
    'lower-left': x >= 31 && x <= 42 && y >= 50 && y <= 71,
    'lower-right': x >= 58 && x <= 69 && y >= 50 && y <= 71,
  };
  return segments.some((segment) => active[segment as keyof typeof active]);
}

function isInsidePlateSymbol(kind: string, x: number, y: number) {
  const dx = x - 50;
  const dy = y - 50;
  if (kind === 'star') {
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const pointRadius = 18 + 12 * Math.pow(Math.max(0, Math.cos(5 * angle)), 2);
    return distance < pointRadius && distance > 5;
  }
  if (kind === 'ring') {
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance > 18 && distance < 30;
  }
  if (kind === 'triangle') {
    return y > 28 && y < 72 && x > 50 - (y - 22) * 0.72 && x < 50 + (y - 22) * 0.72;
  }
  if (kind === 'square') {
    return Math.max(Math.abs(dx), Math.abs(dy)) < 22;
  }
  if (kind === 'diamond') {
    return Math.abs(dx) + Math.abs(dy) < 31;
  }
  if (['two', 'five', 'six', 'eight', 'nine'].includes(kind)) {
    return isInsideDigit(kind, x, y);
  }
  return false;
}

function formatPlateAnswer(answer: string) {
  return answer.charAt(0).toUpperCase() + answer.slice(1);
}

function buildPlateAnswerOptions(correctAnswer: string, seed: number, plateId: string) {
  const random = seededRandom(seed + hashText(`${plateId}-answers`));
  const wrongAnswers = PLATE_ONLY_RESPONSE_OPTIONS
    .filter((answer) => answer !== correctAnswer)
    .map((answer) => ({ answer, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map((item) => item.answer);

  return [correctAnswer, ...wrongAnswers]
    .map((answer) => ({ answer, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.answer);
}

type PlateLike = {
  id: string;
  title: string;
  prompt: string;
  answer: string;
  kind: string;
  fg: string;
  bg: string;
  interpretation?: string;
};

function DotPlate({ plate, seed }: { plate: PlateLike; seed?: number }) {
  const dots = useMemo(() => {
    const random = seededRandom((seed || Date.now()) + hashText(plate.id));
    const generated = [];
    for (let row = 5; row <= 95; row += 4.3) {
      for (let col = 5; col <= 95; col += 4.3) {
        const x = col + (random() - 0.5) * 3.8;
        const y = row + (random() - 0.5) * 3.8;
        const dx = x - 50;
        const dy = y - 50;
        if (Math.sqrt(dx * dx + dy * dy) > 47) continue;
        const inSymbol = isInsidePlateSymbol(plate.kind, x, y);
        const base = inSymbol ? plate.fg : plate.bg;
        generated.push({
          x,
          y,
          r: 1.95 + random() * 2.15,
          fill: colourVariant(base, random),
          opacity: 0.84 + random() * 0.16,
        });
      }
    }
    return generated;
  }, [plate, seed]);

  return (
    <svg className="dot-plate" viewBox="0 0 100 100" role="img" aria-label={`${plate.title}: ${plate.prompt}`}>
      <circle cx="50" cy="50" r="48" fill="#fff" />
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.fill} opacity={dot.opacity} />
      ))}
    </svg>
  );
}

function Home({ setView, hasSaved }: { setView: (view: AppView) => void; hasSaved: boolean }) {
  const openAlphaPlates = () => {
    const shouldContinue = window.confirm(
      'Alpha testing warning: this Ishihara-style activity is experimental, screen-based, and not a clinical colour-vision diagnosis. Continue?'
    );
    if (shouldContinue) setView('plates');
  };

  return (
    <section className="hero-card view-panel">
      <p className="eyebrow">Kid-friendly colour activity</p>
      <h1>Explore how colours feel in everyday life.</h1>
      <p className="lead">
        Chromiview combines an age question, simple colour-picture activities, labelled colour pairs, practical tips, and a printable report. It is friendly for classroom demos when a grown-up reads along.
      </p>
      <p className="disclaimer">{DISCLAIMER}</p>
      <div className="actions">
        <button className="button primary" type="button" onClick={() => setView(hasSaved ? 'screening' : 'prepare')}>
          {hasSaved ? 'Resume screening' : 'Start screening'}
        </button>
        <button className="button secondary alpha-button" type="button" onClick={openAlphaPlates}>
          Ishihara-style test only
          <span className="alpha-tag">Alpha</span>
        </button>
        <button className="button secondary" type="button" onClick={() => setView('tools')}>
          Open accessibility tools
        </button>
      </div>
    </section>
  );
}

function PlatesOnlyTest({ setView }: { setView: (view: AppView) => void }) {
  const [seed, setSeed] = useState(() => createPlateRunSeed());
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const plates = useMemo(() => {
    const random = seededRandom(seed);
    return [...PLATE_ONLY_QUESTIONS]
      .map((plate) => ({ plate, sort: random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.plate);
  }, [seed]);
  const current = plates[index];
  const isDone = index >= plates.length;
  const correct = plates.filter((plate) => responses[plate.id] === plate.answer).length;
  const missedPlates = plates.filter((plate) => responses[plate.id] !== plate.answer);
  const interpretations = Array.from(new Set(missedPlates.map((plate) => plate.interpretation).filter(Boolean)));
  const answerOptions = current ? buildPlateAnswerOptions(current.answer, seed + index * 131, current.id) : [];

  const restart = () => {
    setSeed(createPlateRunSeed());
    setIndex(0);
    setResponses({});
  };

  if (isDone) {
    return (
      <section className="card view-panel plates-only">
        <p className="eyebrow">Alpha Ishihara-style activity</p>
        <h1>Plate activity complete</h1>
        <p className="lead">You matched {correct} of {plates.length} generated plates and missed {missedPlates.length}. This is an informal screen activity, not a diagnosis.</p>
        <p className="disclaimer">{DISCLAIMER}</p>
        <article className="card plate-summary-card">
          <h2>Result overview</h2>
          {missedPlates.length === 0 ? (
            <p>No missed plates in this run. That does not prove typical colour vision, but it means this alpha activity did not flag a clear pattern today.</p>
          ) : (
            <ul className="plate-result-list">
              {missedPlates.map((plate) => (
                <li key={plate.id}>
                  <strong>{plate.title}</strong>
                  <span>You chose {formatPlateAnswer(responses[plate.id] || 'no answer')}; the expected answer was {formatPlateAnswer(plate.answer)}.</span>
                  {plate.interpretation && <small>{plate.interpretation}</small>}
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="card plate-summary-card">
          <h2>What this may suggest</h2>
          {interpretations.length ? (
            <ul>{interpretations.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : (
            <p>No specific colour-confusion pattern was suggested by this alpha run.</p>
          )}
        </article>
        <div className="actions">
          <button className="button primary" type="button" onClick={restart}>Try new random plates</button>
          <button className="button secondary" type="button" onClick={() => setView('home')}>Back home</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card view-panel plates-only">
      <p className="eyebrow">Alpha Ishihara-style activity</p>
      <div className="progress-wrap">
        <div className="progress-copy">
          <span>Plate {index + 1} of {plates.length}</span>
          <span>{Math.round(((index + 1) / plates.length) * 100)}% complete</span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={plates.length} aria-valuenow={index + 1} aria-label="Plate activity progress">
          <span style={{ width: `${((index + 1) / plates.length) * 100}%` }} />
        </div>
      </div>
      <p className="muted">Look at the dot plate and choose your first answer. Each run uses a randomized plate order.</p>
      <DotPlate plate={current} seed={seed + index * 997} />
      <fieldset>
        <legend className="small-legend">{current.prompt}</legend>
        <div className="plate-answer-grid">
          {answerOptions.map((answer) => (
            <button
              key={answer}
              type="button"
              className={responses[current.id] === answer ? 'button primary' : 'button secondary'}
              onClick={() => setResponses((currentResponses) => ({ ...currentResponses, [current.id]: answer }))}
            >
              {formatPlateAnswer(answer)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="actions split">
        <button className="button secondary" type="button" onClick={() => (index === 0 ? setView('home') : setIndex((currentIndex) => currentIndex - 1))}>Back</button>
        <button className="button secondary" type="button" onClick={restart}>New random plates</button>
        <button className="button primary" type="button" disabled={!responses[current.id]} onClick={() => setIndex((currentIndex) => currentIndex + 1)}>
          {index === plates.length - 1 ? 'See plate result' : 'Next plate'}
        </button>
      </div>
    </section>
  );
}

function PreparationStep({ onStart }: { onStart: () => void }) {
  return (
    <section className="card view-panel">
      <p className="eyebrow">Preparation</p>
      <h1>Before you begin</h1>
      <p className="lead">These steps reduce avoidable screen-related differences. They still do not make this a clinical test.</p>
      <ul className="check-list">
        {PREPARATION_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="disclaimer">{DISCLAIMER}</p>
      <div className="actions">
        <button className="button primary" type="button" onClick={onStart}>
          Continue to questionnaire
        </button>
      </div>
    </section>
  );
}

function ScreeningFlow({
  answers,
  setAnswers,
  setView,
  restart,
}: {
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  setView: (view: AppView) => void;
  restart: () => void;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [plateSeed] = useState(() => createPlateRunSeed());
  const headingRef = useRef<HTMLLegendElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    setError('');
  }, [step]);

  const update = (patch: Partial<Answers>) => setAnswers((current) => ({ ...current, ...patch }));
  const next = () => {
    const message = validateStep(step, answers);
    if (message) {
      setError(message);
      return;
    }
    if (step === TOTAL_STEPS) {
      setView('results');
      return;
    }
    setStep((current) => current + 1);
  };

  const toggleTool = (value: string) => {
    setAnswers((current) => {
      if (value === 'nothing') return { ...current, tools: current.tools.includes('nothing') ? [] : ['nothing'] };
      const withoutNothing = current.tools.filter((tool) => tool !== 'nothing');
      return {
        ...current,
        tools: withoutNothing.includes(value) ? withoutNothing.filter((tool) => tool !== value) : [...withoutNothing, value],
      };
    });
  };

  return (
    <section className="card view-panel" aria-live="polite">
      <ScreeningProgress step={step} />
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {step === 1 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>How old are you?</legend>
          <p className="muted">A grown-up can help choose. This only helps Chromiview use friendlier wording.</p>
          <div className="choice-stack">
            {AGE_OPTIONS.map((option) => (
              <label className="choice-card" key={option.value}>
                <input type="radio" name="ageGroup" checked={answers.ageGroup === option.value} onChange={() => update({ ageGroup: option.value })} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.sub}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>What do you already know about your colour vision?</legend>
          <p className="muted">Choose the option that best matches your current understanding. A grown-up can answer this for younger children.</p>
          <div className="choice-stack">
            {CVD_OPTIONS.map((option) => (
              <label className="choice-card" key={option.value}>
                <input type="radio" name="cvd" checked={answers.cvd === option.value} onChange={() => update({ cvd: option.value })} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.sub}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>Colour picture activity</legend>
          <p className="muted">These dot pictures are inspired by traditional colour-vision plates, but they are not clinical tests. Ask: “Can you see it?”</p>
          <div className="plate-grid">
            {PLATE_QUESTIONS.map((plate, plateIndex) => (
              <article className="plate-card" key={plate.id}>
                <DotPlate plate={plate} seed={plateSeed + plateIndex * 811} />
                <h2>{plate.title}</h2>
                <p>{plate.prompt}</p>
                <div className="plate-options" role="radiogroup" aria-label={plate.prompt}>
                  {PLATE_RESPONSE_OPTIONS.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name={plate.id}
                        checked={answers.plateResponses[plate.id] === option.value}
                        onChange={() => update({ plateResponses: { ...answers.plateResponses, [plate.id]: option.value } })}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>How much friction do colours create in daily life?</legend>
          <p className="muted">Rate each situation from 1 for no friction to 5 for significant friction.</p>
          <div className="scale-stack">
            {FRICTION_QS.map((question) => (
              <div className="scale-card" key={question.id}>
                <p>{question.label}</p>
                <div className="scale-buttons" role="radiogroup" aria-label={question.label}>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      className={answers.friction[question.id] === number ? 'selected' : ''}
                      key={number}
                      type="button"
                      aria-pressed={answers.friction[question.id] === number}
                      onClick={() => update({ friction: { ...answers.friction, [question.id]: number } })}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                <div className="scale-labels">
                  <span>No friction</span>
                  <span>Significant friction</span>
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {step === 5 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>Which situation causes the most stress?</legend>
          <div className="choice-stack">
            {WORST_OPTIONS.map((option) => (
              <label className="choice-card" key={option.value}>
                <input type="radio" name="worst" checked={answers.worst === option.value} onChange={() => update({ worst: option.value })} />
                <span><strong>{option.label}</strong></span>
              </label>
            ))}
          </div>
          {answers.worst === 'other' && (
            <label className="field">
              Describe the situation
              <textarea value={answers.worstOther} onChange={(event) => update({ worstOther: event.target.value })} aria-describedby="other-help" />
              <small id="other-help">A short phrase is enough.</small>
            </label>
          )}
        </fieldset>
      )}

      {step === 6 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>Which colour pair is hardest for you?</legend>
          <p className="muted">Every swatch includes text labels because colour alone is never enough.</p>
          <div className="pair-grid">
            {COLOR_PAIRS.map((option) => (
              <button className={answers.pair === option.id ? 'pair-card selected' : 'pair-card'} type="button" key={option.id} onClick={() => update({ pair: option.id })}>
                <span className="pair-swatch" style={{ background: `linear-gradient(90deg, ${option.c1} 50%, ${option.c2} 50%)` }} aria-hidden="true" />
                <strong>{option.label}</strong>
                <small>{option.pattern}</small>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 7 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>What support do you use today?</legend>
          <div className="choice-stack">
            {TOOL_OPTIONS.map((option) => (
              <label className="choice-card" key={option.value}>
                <input type="checkbox" checked={answers.tools.includes(option.value)} onChange={() => toggleTool(option.value)} />
                <span><strong>{option.label}</strong></span>
              </label>
            ))}
          </div>
          <label className="field">
            What would help you most?
            <textarea value={answers.wishlist} onChange={(event) => update({ wishlist: event.target.value })} />
          </label>
        </fieldset>
      )}

      {step === 8 && (
        <fieldset>
          <legend ref={headingRef} tabIndex={-1}>Finish and see your report</legend>
          <p className="muted">Everyone can see their report. This is a colour activity, not a school test and not a doctor visit.</p>
          <p className="storage-note">Results stay on this device right now. They are not uploaded anywhere unless you connect a secure storage option later.</p>
          <label className="choice-card">
            <input type="checkbox" checked={answers.researchConsent} onChange={(event) => update({ researchConsent: event.target.checked })} />
            <span>
              <strong>A parent, teacher, or grown-up helper says this anonymous answer may be saved for the project later.</strong>
              <small>This is optional. Leaving it unchecked still shows the report.</small>
            </span>
          </label>
        </fieldset>
      )}

      <div className="actions split">
        <button className="button secondary" type="button" onClick={() => (step === 1 ? setView('prepare') : setStep((current) => current - 1))}>
          Back
        </button>
        <button className="button secondary" type="button" onClick={() => setView('home')}>
          Save and exit
        </button>
        <button className="button danger" type="button" onClick={restart}>
          Restart
        </button>
        <button className="button primary" type="button" onClick={next}>
          {step === TOTAL_STEPS ? 'Show my result' : 'Continue'}
        </button>
      </div>
    </section>
  );
}

function ResultsReport({ answers, restart, deleteData }: { answers: Answers; restart: () => void; deleteData: () => void }) {
  const result = useMemo(() => inferResult(answers), [answers]);
  const recommendations = useMemo(() => buildRecommendations(answers, result), [answers, result]);
  const summary = useMemo(() => buildPersonalSummary(answers, result), [answers, result]);

  const report = {
    generatedAt: new Date().toISOString(),
    ageGroup: answers.ageGroup,
    likelyType: result.likelyType,
    likelyReason: result.likelyReason,
    reportedPattern: result.reportedPattern,
    responseConsistency: result.responseConsistency,
    observedPatterns: result.observedPatterns,
    difficultSituations: labelForArea(answers.worst || result.topArea),
    recommendations,
    limitations: result.limitations,
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chromiview-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="report view-panel">
      <div className="report-print">
        <p className="eyebrow">Your report</p>
        <h1>Your colour-vision accessibility report</h1>
        <article className="card likely-result-card">
          <p className="eyebrow">Most likely indication</p>
          <h2>{result.likelyType}</h2>
          <p>{result.likelyReason}</p>
          <small>This is an informal screen-based indication, not a clinical diagnosis.</small>
        </article>
        <p className="disclaimer">{DISCLAIMER}</p>
        <div className="result-grid">
          <article className="card">
            <h2>Your reported colour-vision pattern</h2>
            <p>{result.reportedPattern}</p>
          </article>
          <article className="card">
            <h2>Response consistency</h2>
            <p>{result.responseConsistency}</p>
            <small>This describes questionnaire consistency, not clinical accuracy.</small>
          </article>
          <article className="card">
            <h2>Your most difficult situations</h2>
            <p>{labelForArea(answers.worst || result.topArea)}</p>
          </article>
        </div>
        <article className="card">
          <h2>What your responses suggest</h2>
          <ul>{result.observedPatterns.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="card">
          <h2>Personalised summary</h2>
          <p>{summary}</p>
        </article>
        <article className="card">
          <h2>Practical adaptations</h2>
          <ul>{recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="card">
          <h2>Limitations of this screening</h2>
          <ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="card">
          <h2>When to seek professional testing</h2>
          <p>Seek professional testing if results matter for school, work, licensing, safety, driving, health decisions, or if your colour vision changes suddenly.</p>
        </article>
      </div>
      <div className="actions">
        <button className="button primary" type="button" onClick={() => window.print()}>Print or save PDF</button>
        <button className="button secondary" type="button" onClick={download}>Download structured report</button>
        <button className="button secondary" type="button" onClick={() => saveHistory(report)}>Save result history locally</button>
        <button className="button secondary" type="button" onClick={restart}>Retake screening</button>
        <button className="button danger" type="button" onClick={deleteData}>Delete local results</button>
      </div>
    </section>
  );
}

function ToolsView() {
  const [fg, setFg] = useState('#101426');
  const [bg, setBg] = useState('#FFFFFF');
  const ratio = normaliseHex(fg) && normaliseHex(bg) ? contrastRatio(fg, bg) : null;
  const [palette, setPalette] = useState('#5528D8, #1297F4, #07143F, #FFFFFF');
  const colours = palette.split(',').map((item) => item.trim()).filter(Boolean);

  return (
    <section className="view-panel tools-grid">
      <article className="card">
        <h1>Colour contrast checker</h1>
        <label className="field">Text colour <input value={fg} onChange={(event) => setFg(event.target.value)} /></label>
        <label className="field">Background colour <input value={bg} onChange={(event) => setBg(event.target.value)} /></label>
        <p className="metric">{ratio ? `${ratio.toFixed(2)}:1` : 'Enter two #RRGGBB colours'}</p>
        {ratio && <p>{ratio >= 4.5 ? 'Passes WCAG AA for normal text.' : ratio >= 3 ? 'Passes only for large text or UI boundaries.' : 'Does not pass WCAG AA contrast.'}</p>}
      </article>
      <article className="card">
        <h1>Accessible palette analyser</h1>
        <label className="field">Palette hex values <textarea value={palette} onChange={(event) => setPalette(event.target.value)} /></label>
        <ul className="palette-list">
          {colours.map((colour) => (
            <li key={colour}>
              <span className="colour-chip" style={{ background: normaliseHex(colour) || '#fff' }} aria-hidden="true" />
              <span>{colour}: {normaliseHex(colour) ? 'valid colour. Pair with labels and borders; never use alone.' : 'not a valid #RRGGBB value.'}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function LearnView() {
  return (
    <section className="view-panel">
      <h1>Learn about colour accessibility</h1>
      <div className="result-grid">
        {LEARN_TOPICS.map((topic) => (
          <article className="card" key={topic.title}>
            <h2>{topic.title}</h2>
            <p>{topic.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PrivacyNotice({ deleteData }: { deleteData: () => void }) {
  const history = loadHistory();
  return (
    <section className="card view-panel">
      <h1>Privacy and local data</h1>
      <p>Chromiview currently runs locally in your browser. It does not upload questionnaire answers, inferred patterns, names, or contact details because no secure backend is connected.</p>
      <p>Autosave stores your current answers in localStorage so you can resume after refresh. Result history is stored only if you explicitly press “Save result history locally”.</p>
      <p>For preschool or classroom demos, avoid collecting names, contact details, faces, or health identifiers. If you need class results, collect only anonymous totals or use parent/teacher-approved consent.</p>
      <p>Storage recommendation: Google Sheets is fine for a small demo or teacher-run pilot, but a real public launch should use Supabase or Netlify Forms with access controls, consent records, and no analytics events containing health answers.</p>
      <p>Saved local reports: {history.length}</p>
      <div className="actions">
        <button className="button danger" type="button" onClick={deleteData}>Delete my local data</button>
      </div>
    </section>
  );
}

export default function App() {
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers());
  const [settings, setSettings] = useState(() => loadSettings());
  const [view, setView] = useState<AppView>(() => (loadAnswers().cvd ? 'home' : 'home'));
  const hasSaved = Boolean(answers.ageGroup || answers.cvd || Object.keys(answers.friction).length || answers.worst || answers.pair);

  useEffect(() => {
    if (view === 'results') document.title = 'Your Chromiview Report';
    else if (view === 'plates') document.title = 'Chromiview Alpha | Ishihara-Style Plates';
    else document.title = 'Chromiview | Colour Vision Screening';
  }, [view]);

  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const restart = () => {
    if (!window.confirm('Restart screening and clear current progress?')) return;
    setAnswers({ ...EMPTY_ANSWERS });
    setView('prepare');
  };

  const deleteData = () => {
    if (!window.confirm('Delete Chromiview local autosave and result history from this browser?')) return;
    clearLocalData();
    setAnswers({ ...EMPTY_ANSWERS });
    setView('home');
  };

  return (
    <AppShell view={view} setView={setView} settings={settings} setSettings={setSettings}>
      {view === 'home' && <Home setView={setView} hasSaved={hasSaved} />}
      {view === 'prepare' && <PreparationStep onStart={() => setView('screening')} />}
      {view === 'screening' && <ScreeningFlow answers={answers} setAnswers={setAnswers} setView={setView} restart={restart} />}
      {view === 'results' && <ResultsReport answers={answers} restart={restart} deleteData={deleteData} />}
      {view === 'plates' && <PlatesOnlyTest setView={setView} />}
      {view === 'tools' && <ToolsView />}
      {view === 'learn' && <LearnView />}
      {view === 'privacy' && <PrivacyNotice deleteData={deleteData} />}
    </AppShell>
  );
}
