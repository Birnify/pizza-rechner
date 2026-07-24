// Einstellungen — settings: segmented unit/theme toggles + feature-flag switches.
const { useState: useStateS } = React;
const DS_S = window.TeigmeisterDesignSystem_c6b7bf;

function EinstellungenScreen() {
  const { Card, SegmentedControl, Switch, Select, Button } = DS_S;
  const [units, setUnits] = useStateS("metric");
  const [lang, setLang] = useStateS("de");
  const [flour, setFlour] = useStateS("caputo");
  const [timer, setTimer] = useStateS(true);
  const [shopping, setShopping] = useStateS(true);
  const [freeze, setFreeze] = useStateS(false);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionTitle icon="settings">Einstellungen</SectionTitle>

        <Card title="Anzeige" icon="settings">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Einheiten">
              <SegmentedControl ariaLabel="Einheiten" value={units} onChange={setUnits}
                options={[{ value: "metric", label: "Metrisch (g, °C)" }, { value: "imperial", label: "Imperial (oz, °F)" }]} />
            </Field>
            <Field label="Sprache">
              <SegmentedControl ariaLabel="Sprache" value={lang} onChange={setLang}
                options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
            </Field>
          </div>
        </Card>

        <Card title="Standard-Mehl" icon="sliders">
          <Select value={flour} onChange={setFlour} size="lg" ariaLabel="Standard-Mehl"
            options={[
              { value: "caputo", label: "Caputo Cuoco · W300" },
              { value: "manitoba", label: "Manitoba · W350" },
              { value: "type550", label: "Weizenmehl Type 550" },
            ]} />
        </Card>

        <Card title="Funktionen" icon="clock">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <SwitchRow label="Gärzeit-Timer" hint="Erinnert an jeden Schritt" checked={timer} onChange={setTimer} Switch={Switch} />
            <SwitchRow label="Einkaufsliste" hint="Zutaten für Pizza Party sammeln" checked={shopping} onChange={setShopping} Switch={Switch} />
            <SwitchRow label="Einfrier-Hinweis" hint="Tipps zum Vorbereiten & Einfrieren" checked={freeze} onChange={setFreeze} Switch={Switch} last />
          </div>
        </Card>

        <Button variant="secondary" icon="share" fullWidth>Rezept teilen</Button>
      </div>
    </div>
  );
}

function SwitchRow({ label, hint, checked, onChange, Switch, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{hint}</div>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
Object.assign(window, { EinstellungenScreen, SwitchRow });
