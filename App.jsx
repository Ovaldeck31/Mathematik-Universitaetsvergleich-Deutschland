import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Aesthetic: Wissenschaftliches Notizbuch trifft modernes Dashboard
// Palette: Tiefes Tintenblau + warmes Papiergelb + präzise Akzentfarben pro Uni
// Signature: Jede Uni hat eine eigene Farbe – wie Textmarker im Skript

const T = {
  bg:      "#0a0c12",
  surface: "#11141e",
  card:    "#161928",
  border:  "#1f2438",
  hover:   "#1c2035",
  text:    "#e8eaf6",
  muted:   "#6b7299",
  subtle:  "#2e3352",
  ink:     "#c8cce8",
  sans:    "'Inter', system-ui, sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

// Uni-Farben – wie Textmarker
const UNI_COLORS = {
  "FU Berlin": "#4f72ff", // Blau
  "HU Berlin": "#2ea3e0", // Hellblau
  "TU Berlin": "#1a5fb4", // Dunkelblau
  Bonn:        "#c9933a", // Gold – Tradition
  Heidelberg:  "#7c4dff", // Violett – Älteste Uni
  Karlsruhe:   "#00c9a7", // Grün – Technik/KIT
  München:     "#e05a5a", // Rot – TUM-Energie
};

const UNI_ABBR = {
  "FU Berlin": "FU BERLIN",
  "HU Berlin": "HU BERLIN",
  "TU Berlin": "TU BERLIN",
  Bonn:        "UNI BONN",
  Heidelberg:  "HEIDELBERG",
  Karlsruhe:   "KIT",
  München:     "TUM",
};

const UNI_INST = {
  "FU Berlin": "Institut für Mathematik · Arnimallee 6, 14195 Berlin",
  "HU Berlin": "Institut für Mathematik · Unter den Linden 6, 10099 Berlin",
  "TU Berlin": "Institut für Mathematik · Straße des 17. Juni 136, 10623 Berlin",
  Bonn:        "Mathematikzentrum · Endenicher Allee 60, 53115 Bonn",
  Heidelberg:  "Mathematikon · Im Neuenheimer Feld 205, 69120 Heidelberg",
  Karlsruhe:   "Kollegiengebäude Mathematik · Englerstraße 2, 76131 Karlsruhe",
  München:     "TUM Department of Mathematics · Boltzmannstraße 3, 85748 Garching",
};

const CITIES = ["FU Berlin", "HU Berlin", "TU Berlin", "Bonn", "Heidelberg", "Karlsruhe", "München"];

// ─── KRITERIEN ────────────────────────────────────────────────────────────────

const CRITERIA = [
  {
    section: "Objektiv",
    items: [
      { key: "historisch",    label: "Historische Bedeutung",    hint: "Welche Mathematiker wirkten hier? Gründungsjahr, Epoche, Tradition." },
      { key: "lehre",         label: "Lehrqualität",             hint: "Ruf der Vorlesungen, Betreuung, Modulstruktur im Bachelor." },
      { key: "fachschaft",    label: "Fachschaft & Community",   hint: "Aktivität der Fachschaft, Tutorien, Ersti-Betreuung, Gemeinschaft." },
      { key: "infrastruktur", label: "Bibliothek & Infrastruktur", hint: "Lernplätze, Öffnungszeiten, CIP-Pool, Aufenthaltsräume." },
      { key: "forschung",     label: "Forschungsprofil",         hint: "Exzellenzcluster, Schwerpunkte (Algebra/Analysis/Stochastik/Geometrie)." },
      { key: "stadt",         label: "Stadt & Lebensqualität",   hint: "Mietpreise, ÖPNV, Kulturangebot, Campusleben." },
    ],
  },
  {
    section: "Subjektiv",
    items: [
      { key: "atmosphaere",  label: "Atmosphäre des Gebäudes",  hint: "Erster Eindruck, Raumgefühl, wirkt es wie Mathematik?" },
      { key: "menschen",     label: "Eindruck der Menschen",    hint: "Studierende, Dozierende – Offenheit, Energie, Kollegialität." },
      { key: "bauchgefuehl", label: "Gesamtbauchgefühl",       hint: "Könnte ich mir vorstellen hier zu studieren? Warum?" },
    ],
  },
];

const ALL_ITEMS = CRITERIA.flatMap(s => s.items);

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function useStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = useCallback((updater) => {
    setVal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const avg = (city, data) => {
  const scores = ALL_ITEMS.map(c => data[city]?.[c.key + "_r"] || 0).filter(Boolean);
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
};

const filled = (city, data) => ALL_ITEMS.filter(c => data[city]?.[c.key]).length;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// Radar/Spider chart – pure SVG
function RadarChart({ data, cities, width = 320, height = 320 }) {
  const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) - 48;
  const N = ALL_ITEMS.length;
  const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i, val) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * (val / 5), cy + Math.sin(a) * r * (val / 5)];
  };
  const gridPt = (i, pct) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * pct, cy + Math.sin(a) * r * pct];
  };

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* Grid rings */}
      {[0.2, 0.4, 0.6, 0.8, 1].map(pct => (
        <polygon key={pct}
          points={ALL_ITEMS.map((_, i) => gridPt(i, pct).join(",")).join(" ")}
          fill="none" stroke={T.border} strokeWidth={1} />
      ))}
      {/* Axes */}
      {ALL_ITEMS.map((c, i) => {
        const [x, y] = gridPt(i, 1);
        const [lx, ly] = gridPt(i, 1.18);
        return (
          <g key={c.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={T.subtle} strokeWidth={1} />
            <text x={lx} y={ly} fill={T.muted} fontSize={8.5} textAnchor="middle"
              dominantBaseline="middle" style={{ fontFamily: T.sans }}>
              {c.label.length > 14 ? c.label.slice(0, 13) + "…" : c.label}
            </text>
          </g>
        );
      })}
      {/* City polygons */}
      {cities.map(city => {
        const scores = ALL_ITEMS.map(c => data[city]?.[c.key + "_r"] || 0);
        const hasAny = scores.some(s => s > 0);
        if (!hasAny) return null;
        const points = scores.map((s, i) => pt(i, s).join(",")).join(" ");
        const col = UNI_COLORS[city];
        return (
          <polygon key={city} points={points}
            fill={col + "22"} stroke={col} strokeWidth={2} strokeLinejoin="round"
            style={{ transition: "all 0.3s" }} />
        );
      })}
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill={T.subtle} />
    </svg>
  );
}

// Bar chart for a single criterion
function CriterionBars({ criterionKey, data, cities }) {
  return (
    <div>
      {cities.map(city => {
        const val = data[city]?.[criterionKey + "_r"] || 0;
        const col = UNI_COLORS[city];
        return (
          <div key={city} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <div style={{ width: 72, fontSize: 10, fontWeight: 700, color: col, letterSpacing: "0.05em", flexShrink: 0 }}>
              {UNI_ABBR[city]}
            </div>
            <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: col, borderRadius: 3, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
            </div>
            <div style={{ width: 16, fontSize: 11, color: val > 0 ? T.ink : T.subtle, textAlign: "right", fontFamily: T.mono }}>
              {val > 0 ? val : "–"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Score ring
function ScoreRing({ val, color, size = 56 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const pct = val / 5;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.5s" }} />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={val > 0 ? color : T.muted} fontSize={val > 0 ? 13 : 10} fontWeight={700}
        fontFamily={T.mono}>{val > 0 ? val.toFixed(1) : "–"}</text>
    </svg>
  );
}

// ─── VIEWS ───────────────────────────────────────────────────────────────────

const VIEWS = ["Übersicht", "Eingabe", "Radar", "Vergleich", "Tabelle"];

export default function App() {
  const [mathData, setMathData] = useStorage("math_v1", {});
  const [view, setView] = useState(0);
  const [activeCity, setActiveCity] = useState("FU Berlin");
  const [localInputs, setLocalInputs] = useState({});

  // Sync local inputs when city changes
  useEffect(() => {
    setLocalInputs(mathData[activeCity] || {});
  }, [activeCity]);

  const updateRating = (city, key, val) =>
    setMathData(p => ({ ...p, [city]: { ...p[city], [key]: val } }));

  const updateNote = (key, val) => {
    setLocalInputs(p => ({ ...p, [key]: val }));
  };

  const saveNote = (key) => {
    setMathData(p => ({ ...p, [activeCity]: { ...p[activeCity], [key]: localInputs[key] || "" } }));
  };

  // Styles
  const s = {
    app: { minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.sans, fontSize: 14 },
    hdr: { background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    tabs: { display: "flex", background: T.surface, borderBottom: `1px solid ${T.border}`, overflowX: "auto" },
    tab: (a) => ({ padding: "10px 20px", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", color: a ? T.text : T.muted, borderBottom: `2px solid ${a ? "#4f72ff" : "transparent"}`, background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: a ? "#4f72ff" : "transparent" }),
    wrap: { padding: "24px", maxWidth: 960, margin: "0 auto" },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 14 },
    lbl: { fontSize: 9, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5, display: "block" },
    inp: { width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 11px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: T.sans },
    ta: { width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 11px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 80, fontFamily: T.sans, lineHeight: 1.6 },
    btn: (bg, sm) => ({ background: bg, color: "#fff", border: "none", borderRadius: 7, padding: sm ? "5px 11px" : "8px 16px", cursor: "pointer", fontSize: sm ? 10 : 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: T.sans }),
    divider: { borderTop: `1px solid ${T.border}`, margin: "18px 0" },
    sec: { fontSize: 9, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 },
  };

  // Dot rating
  const Dots = ({ city, cKey, size = 18 }) => {
    const val = mathData[city]?.[cKey + "_r"] || 0;
    const col = UNI_COLORS[city];
    return (
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(n => (
          <div key={n} onClick={() => updateRating(city, cKey + "_r", n === val ? 0 : n)}
            style={{ width: size, height: size, borderRadius: "50%", cursor: "pointer",
              background: n <= val ? col : T.surface,
              border: `2px solid ${n <= val ? col : T.border}`,
              transition: "all 0.15s",
              boxShadow: n <= val ? `0 0 6px ${col}66` : "none",
            }} />
        ))}
      </div>
    );
  };

  // ── VIEW 0: ÜBERSICHT ───────────────────────────────────────────────────────
  const Overview = () => (
    <div>
      <div style={{ ...s.card, background: "linear-gradient(135deg, #11141e 0%, #161928 100%)", marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
          Mathematik-Vergleich · Interrail 2026
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", marginBottom: 4 }}>
          7 Fakultäten im Vergleich
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>
          FU/HU/TU Berlin · Bonn · Heidelberg · Karlsruhe · München
        </div>
      </div>

      {/* Uni cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, marginBottom: 20 }}>
        {CITIES.map(city => {
          const a = avg(city, mathData);
          const f = filled(city, mathData);
          const col = UNI_COLORS[city];
          return (
            <div key={city} onClick={() => { setActiveCity(city); setView(1); }}
              style={{ ...s.card, cursor: "pointer", borderColor: T.border, borderLeft: `4px solid ${col}`,
                transition: "all 0.15s", padding: 16 }}
              onMouseEnter={e => e.currentTarget.style.background = T.hover}
              onMouseLeave={e => e.currentTarget.style.background = T.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: col, letterSpacing: "0.1em", textTransform: "uppercase" }}>{UNI_ABBR[city]}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 2 }}>{city}</div>
                </div>
                <ScoreRing val={a} color={col} size={48} />
              </div>
              <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${(f / ALL_ITEMS.length) * 100}%`, height: "100%", background: col + "88", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: T.muted }}>{f}/{ALL_ITEMS.length} Felder ausgefüllt</div>
            </div>
          );
        })}
      </div>

      {/* Quick bar overview – avg per city */}
      <div style={s.card}>
        <div style={s.sec}>Gesamtbewertung</div>
        {CITIES.map(city => {
          const a = avg(city, mathData);
          const col = UNI_COLORS[city];
          return (
            <div key={city} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: col }}>{city}</div>
              <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(a / 5) * 100}%`, height: "100%", background: col, borderRadius: 4, transition: "width 0.6s" }} />
              </div>
              <div style={{ width: 32, fontFamily: T.mono, fontSize: 12, color: a > 0 ? T.text : T.subtle, textAlign: "right" }}>
                {a > 0 ? a.toFixed(1) : "–"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── VIEW 1: EINGABE ─────────────────────────────────────────────────────────
  const Eingabe = () => (
    <div style={{ display: "flex", gap: 16 }}>
      {/* City sidebar */}
      <div style={{ width: 150, flexShrink: 0 }}>
        {CITIES.map(city => {
          const col = UNI_COLORS[city];
          const a = avg(city, mathData);
          return (
            <div key={city} onClick={() => setActiveCity(city)}
              style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
                background: activeCity === city ? T.hover : "transparent",
                borderLeft: `3px solid ${activeCity === city ? col : "transparent"}`,
                transition: "all 0.12s" }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: col, letterSpacing: "0.08em", textTransform: "uppercase" }}>{UNI_ABBR[city]}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{city}</div>
              {a > 0 && <div style={{ fontFamily: T.mono, fontSize: 10, color: col, marginTop: 2 }}>{a.toFixed(1)} / 5</div>}
            </div>
          );
        })}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ ...s.card, borderLeft: `4px solid ${UNI_COLORS[activeCity]}`, marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: UNI_COLORS[activeCity], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{UNI_ABBR[activeCity]}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.3px", marginBottom: 4 }}>{activeCity}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{UNI_INST[activeCity]}</div>
        </div>

        {CRITERIA.map(sec => (
          <div key={sec.section}>
            <div style={{ ...s.sec, marginBottom: 10, color: sec.section === "Subjektiv" ? UNI_COLORS[activeCity] : T.muted }}>
              {sec.section}
            </div>
            {sec.items.map(c => (
              <div key={c.key} style={{ ...s.card, marginBottom: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{c.hint}</div>
                  </div>
                  <Dots city={activeCity} cKey={c.key} />
                </div>
                <textarea
                  style={s.ta}
                  placeholder="Eigene Notizen…"
                  value={localInputs[c.key] || ""}
                  onChange={e => updateNote(c.key, e.target.value)}
                  onBlur={() => saveNote(c.key)}
                />
              </div>
            ))}
            {sec.section === "Objektiv" && <div style={s.divider} />}
          </div>
        ))}
      </div>
    </div>
  );

  // ── VIEW 2: RADAR ───────────────────────────────────────────────────────────
  const Radar = () => {
    const [selected, setSelected] = useState([...CITIES]);
    const toggle = city => setSelected(p => p.includes(city) ? p.filter(c => c !== city) : [...p, city]);

    return (
      <div>
        <div style={{ ...s.card, marginBottom: 14 }}>
          <div style={s.sec}>Städte auswählen</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CITIES.map(city => {
              const on = selected.includes(city);
              const col = UNI_COLORS[city];
              return (
                <button key={city} onClick={() => toggle(city)}
                  style={{ ...s.btn(on ? col : T.subtle, true),
                    opacity: on ? 1 : 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: on ? "#fff" : col }} />
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ ...s.card, flex: "0 0 auto" }}>
            <div style={s.sec}>Alle Kriterien</div>
            <RadarChart data={mathData} cities={selected} width={340} height={340} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            {/* Legend */}
            <div style={s.card}>
              <div style={s.sec}>Legende</div>
              {selected.map(city => (
                <div key={city} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 4, borderRadius: 2, background: UNI_COLORS[city] }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{city}</div>
                    <div style={{ fontSize: 10, color: T.muted, fontFamily: T.mono }}>
                      {avg(city, mathData) > 0 ? `Ø ${avg(city, mathData).toFixed(1)}` : "Keine Daten"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Radar per section */}
            <div style={s.card}>
              <div style={s.sec}>Objektiv</div>
              <RadarChart data={mathData} cities={selected}
                width={220} height={220} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── VIEW 3: VERGLEICH – Balkendiagramme ────────────────────────────────────
  const Vergleich = () => (
    <div>
      {CRITERIA.map(sec => (
        <div key={sec.section}>
          <div style={{ ...s.sec, marginBottom: 12, color: sec.section === "Subjektiv" ? "#7c4dff" : T.muted }}>
            {sec.section}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 20 }}>
            {sec.items.map(c => (
              <div key={c.key} style={s.card}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>{c.label}</div>
                <CriterionBars criterionKey={c.key} data={mathData} cities={CITIES} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ── VIEW 4: TABELLE ─────────────────────────────────────────────────────────
  const Tabelle = () => (
    <div style={{ ...s.card, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "10px 14px", textAlign: "left", color: T.muted, borderBottom: `1px solid ${T.border}`, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", width: 160, background: T.surface }}>Kriterium</th>
            {CITIES.map(city => (
              <th key={city} style={{ padding: "10px 10px", borderBottom: `1px solid ${T.border}`, background: T.surface, minWidth: 130, verticalAlign: "bottom" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: UNI_COLORS[city], letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{UNI_ABBR[city]}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{city}</div>
                <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                  {[1,2,3,4,5].map(n => {
                    const a = avg(city, mathData);
                    return <div key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: n <= Math.round(a) ? UNI_COLORS[city] : T.border }} />;
                  })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRITERIA.map(sec => (
            <>
              <tr key={sec.section + "_hdr"}>
                <td colSpan={6} style={{ padding: "10px 14px 4px", fontSize: 9, fontWeight: 800, color: sec.section === "Subjektiv" ? "#7c4dff" : T.muted, textTransform: "uppercase", letterSpacing: "0.1em", background: T.bg }}>
                  {sec.section}
                </td>
              </tr>
              {sec.items.map((c, i) => (
                <tr key={c.key} style={{ background: i % 2 === 0 ? T.card : T.surface }}>
                  <td style={{ padding: "10px 14px", color: T.text, borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 11, verticalAlign: "top" }}>{c.label}</td>
                  {CITIES.map(city => {
                    const r = mathData[city]?.[c.key + "_r"] || 0;
                    const note = mathData[city]?.[c.key] || "";
                    const col = UNI_COLORS[city];
                    return (
                      <td key={city} style={{ padding: "10px", borderBottom: `1px solid ${T.border}`, verticalAlign: "top" }}>
                        {r > 0 && (
                          <div style={{ display: "flex", gap: 2, marginBottom: note ? 5 : 0 }}>
                            {[1,2,3,4,5].map(n => (
                              <div key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: n <= r ? col : T.border }} />
                            ))}
                          </div>
                        )}
                        {note && <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.5 }}>{note.slice(0, 100)}{note.length > 100 ? "…" : ""}</div>}
                        {!r && !note && <span style={{ color: T.border, fontSize: 10 }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
          {/* Avg row */}
          <tr style={{ background: T.bg }}>
            <td style={{ padding: "12px 14px", fontWeight: 800, color: T.text, fontSize: 11 }}>Ø Gesamt</td>
            {CITIES.map(city => {
              const a = avg(city, mathData);
              const col = UNI_COLORS[city];
              return (
                <td key={city} style={{ padding: "12px 10px" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: a > 0 ? col : T.subtle, fontFamily: T.mono }}>
                    {a > 0 ? a.toFixed(1) : "—"}
                  </div>
                  {a > 0 && (
                    <div style={{ width: "80%", height: 3, background: T.border, borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(a / 5) * 100}%`, height: "100%", background: col, borderRadius: 2 }} />
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={s.app}>
      {/* Header */}
      <div style={s.hdr}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>
            Mathematik-Vergleich
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 1, letterSpacing: "0.04em" }}>
            Interrail 2026 · 7 Fakultäten
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {CITIES.map(city => (
            <div key={city} style={{ width: 8, height: 8, borderRadius: "50%", background: UNI_COLORS[city] }} title={city} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {VIEWS.map((v, i) => (
          <button key={i} style={s.tab(view === i)} onClick={() => setView(i)}>{v}</button>
        ))}
      </div>

      {/* Content */}
      <div style={s.wrap}>
        {view === 0 && <Overview />}
        {view === 1 && <Eingabe />}
        {view === 2 && <Radar />}
        {view === 3 && <Vergleich />}
        {view === 4 && <Tabelle />}
      </div>
    </div>
  );
}
