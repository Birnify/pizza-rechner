// Anleitung / Zeitplan — the adaptive step-by-step baking guide.
const DS_A = window.TeigmeisterDesignSystem_c6b7bf;

function AnleitungScreen({ inline = false }) {
  const { Card, ScheduleBar, StepCard, Note, Badge } = DS_A;
  const Body = (
      <div style={{ padding: inline ? 0 : 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionTitle icon="guide">Schritt-für-Schritt</SectionTitle>

        <ScheduleBar>
          ⏱️ <b>Gesamtdauer ca. 26 h</b><br />
          <span className="num" style={{ fontSize: 15, fontWeight: 800 }}>▶ Start Fr 14:00</span>
          &nbsp;→&nbsp;
          <span className="num" style={{ fontSize: 15, fontWeight: 800 }}>🍕 Fertig Sa 16:00</span>
        </ScheduleBar>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <StepCard number={1} title="Wasser & Hefe" chip="Fr 14:00" time="~3 min">
            <p><b>384 g Wasser</b> bei <b>19 °C</b> abwiegen (40 g als Eis), die <b>1.2 g Hefe</b> darin auflösen.</p>
          </StepCard>
          <StepCard number={2} title="Mehl einarbeiten" chip="mit der Hand" time="~8 min">
            <p><b>620 g Mehl</b> schrittweise zugeben und zu einer groben Masse verkneten, bis kein trockenes Mehl mehr sichtbar ist.</p>
          </StepCard>
          <StepCard number={3} title="Salz zugeben" chip="nach 2–3 min" time="~2 min">
            <p>Erst wenn alles zusammenhängt, <b>18.6 g Salz</b> einstreuen und einkneten.</p>
            <Note variant="warn">Salz nie direkt auf die Hefe – es bremst sie.</Note>
          </StepCard>
          <StepCard number={4} title="Stockgare (Raumtemperatur)" chip="Fr 14:15" time="2 h">
            <p>Abgedeckt bei ~21 °C ruhen lassen. Der Teig legt spürbar an Volumen zu.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <Badge tone="warm" mono>⏳ 2:00:00</Badge>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Timer läuft im Hintergrund weiter</span>
            </div>
          </StepCard>
          <StepCard number={5} title="Kaltgare im Kühlschrank" chip="Fr 16:15" time="20 h">
            <p>Luftdicht in den Kühlschrank (4–6 °C). Hier entsteht das Aroma.</p>
            <Note variant="tip">Je länger die Kaltgare, desto bekömmlicher und aromatischer der Teig.</Note>
          </StepCard>
          <StepCard number={6} title="Teiglinge formen" chip="Sa 12:15" time="~10 min">
            <p>In <b>4 Kugeln à 250 g</b> teilen, straff rundschleifen, abgedeckt akklimatisieren lassen.</p>
          </StepCard>
          <StepCard number={7} title="Backen" chip="Sa 16:00" time="60–90 s">
            <p>Bei maximaler Hitze (idealerweise 430–480 °C) backen, bis der Rand aufgeht und Blasen bräunen.</p>
          </StepCard>
        </div>
      </div>
  );
  return inline ? Body : <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>{Body}</div>;
}

function SectionTitle({ icon, children }) {
  const { Icon } = DS_A;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 2px" }}>
      <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--tomato)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} strokeWidth={1.6} />
      </span>
      <h2 style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--ink)" }}>{children}</h2>
    </div>
  );
}
Object.assign(window, { AnleitungScreen, SectionTitle });
