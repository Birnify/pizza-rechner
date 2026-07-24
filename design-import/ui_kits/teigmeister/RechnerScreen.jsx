// Rechner — the calculator screen. Photo header + sub-nav + preset tiles +
// dough settings + basil result panel. Scroll region above the sticky summary bar.
const { useState: useStateR } = React;
const DS_R = window.TeigmeisterDesignSystem_c6b7bf;

function RechnerScreen({ scrollRef }) {
  const { Card, SubNav, SegmentedControl, Stepper, PresetCard, TotalSummary, IngredientRow, TempBox, Note } = DS_R;
  const [sub, setSub] = useStateR("rechner");
  const [preset, setPreset] = useStateR("klassisch");
  const [method, setMethod] = useStateR("direct");
  const [balls, setBalls] = useStateR(4);
  const [weight, setWeight] = useStateR(250);
  const [hydration, setHydration] = useStateR(62);

  const flour = Math.round((balls * weight) / (1 + hydration / 100 + 0.03));
  const water = Math.round(flour * hydration / 100);
  const salt = +(flour * 0.03).toFixed(1);
  const yeast = +(flour * 0.002).toFixed(1);
  const total = balls * weight;

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingBottom: 150 }}>
      <header style={{
        position: "relative", textAlign: "center", color: "#fff", padding: "48px 20px 22px",
        borderBottom: "3px solid var(--crust)",
        backgroundImage: "linear-gradient(var(--scrim),var(--scrim)),url('../../assets/header-pizza.jpg')",
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,.4)" }}>🍕 Teigmeister</h1>
        <p style={{ margin: "5px 0 0", fontSize: 12, opacity: .9 }}>Neapolitanischer Pizzateig · präzise berechnet</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16 }}>
        <SubNav ariaLabel="Bereich" value={sub} onChange={setSub}
          items={[{ id: "rechner", label: "Rechner" }, { id: "rezepte", label: "Rezepte" }, { id: "zeitplan", label: "Zeitplan" }]} />

        {sub === "zeitplan" ? <AnleitungScreen inline /> : (<>
        <Card title="Fertige Rezepte" icon="presets">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <PresetCard name="Schnell" time="~5 h" description="Gleicher Tag" selected={preset === "schnell"} onClick={() => setPreset("schnell")} />
            <PresetCard name="Klassisch" time="~24 h" description="AVPN-Standard" selected={preset === "klassisch"} onClick={() => setPreset("klassisch")} />
            <PresetCard name="Lang" time="~48 h" description="Max. Aroma" selected={preset === "lang"} onClick={() => setPreset("lang")} />
          </div>
        </Card>

        <Card title="Teig-Einstellungen" icon="sliders">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Teigführung">
              <SegmentedControl ariaLabel="Teigführung" value={method} onChange={setMethod}
                options={[{ value: "direct", label: "Direkt" }, { value: "biga", label: "Biga" }, { value: "poolish", label: "Poolish" }]} />
            </Field>
            <Field label="Anzahl Teiglinge">
              <Stepper value={balls} onChange={setBalls} min={1} max={20} ariaLabel="Teiglinge" />
            </Field>
            <Field label="Gewicht pro Teigling">
              <Stepper value={weight} onChange={setWeight} min={150} max={400} step={10} unit="g" ariaLabel="Gewicht" />
            </Field>
            <Field label="Hydration">
              <Stepper value={hydration} onChange={setHydration} min={50} max={85} unit="%" ariaLabel="Hydration" />
            </Field>
          </div>
        </Card>

        <Card title="Ergebnis" icon="rechner" accent="basil">
          <TotalSummary value={`${total} g`} label="Gesamtteig" note="inkl. 3 % Verarbeitungsverlust" />
          <div style={{ marginTop: 14 }}>
            <IngredientRow name="Mehl (Tipo 00)" amount={flour} unit="g" dotColor="var(--crust)" />
            <IngredientRow name="Wasser" amount={water} unit="g" dotColor="var(--focus)" />
            <IngredientRow name="Salz" amount={salt} unit="g" dotColor="var(--muted)" />
            <IngredientRow name="Hefe (frisch)" amount={yeast} unit="g" last />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <TempBox value="19 °C" label="Schüttwasser" highlight />
            <TempBox value="40 g" label="davon Eis" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Note variant="tip">Bei {hydration} % Hydration den Teig gut auskneten, bis er sich vom Rand löst.</Note>
          </div>
        </Card>
        </>)}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</span>
      {children}
    </label>
  );
}
Object.assign(window, { RechnerScreen, Field });
