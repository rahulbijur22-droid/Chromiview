import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COLOR_PAIRS,
  CVD_OPTIONS,
  DISCLAIMER,
  EMPTY_ANSWERS,
  FRICTION_QS,
  AGE_OPTIONS,
  LEARN_TOPICS,
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

function DotPlate({ plate }: { plate: (typeof PLATE_QUESTIONS)[number] }) {
  const dots = Array.from({ length: 56 }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 10 + ((index * 17) % 42);
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    const size = 4 + (index % 4);
    const fill = index % 3 === 0 ? plate.fg : index % 2 === 0 ? plate.bg : '#f4f7fb';
    return <circle key={index} cx={x} cy={y} r={size} fill={fill} opacity="0.92" />;
  });

  return (
    <svg className="dot-plate" viewBox="0 0 100 100" role="img" aria-label={`${plate.title}: ${plate.prompt}`}>
      <circle cx="50" cy="50" r="48" fill="#fff" />
      {dots}
      {plate.answer === 'star' && <text x="50" y="61" textAnchor="middle" className="plate-symbol" fill={plate.fg}>★</text>}
      {plate.answer === 'circle' && <circle cx="50" cy="50" r="22" fill="none" stroke={plate.fg} strokeWidth="9" />}
      {plate.answer === 'number 5' && <text x="50" y="65" textAnchor="middle" className="plate-symbol" fill={plate.fg}>5</text>}
    </svg>
  );
}

function Home({ setView, hasSaved }: { setView: (view: AppView) => void; hasSaved: boolean }) {
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
        <button className="button secondary" type="button" onClick={() => setView('tools')}>
          Open accessibility tools
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
            {PLATE_QUESTIONS.map((plate) => (
              <article className="plate-card" key={plate.id}>
                <DotPlate plate={plate} />
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
    document.title = view === 'results' ? 'Your Chromiview Report' : 'Chromiview | Colour Vision Screening';
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
      {view === 'tools' && <ToolsView />}
      {view === 'learn' && <LearnView />}
      {view === 'privacy' && <PrivacyNotice deleteData={deleteData} />}
    </AppShell>
  );
}
