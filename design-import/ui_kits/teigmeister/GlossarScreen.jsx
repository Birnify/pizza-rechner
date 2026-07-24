// Glossar — the baking glossary. Single-open accordion of dictionary entries.
const { useState: useStateG } = React;
const DS_G = window.TeigmeisterDesignSystem_c6b7bf;

const TOPICS = [
  { id: "hydration", term: "Hydration", body: "Verhältnis von Wasser zu Mehl in Prozent. 60 % bedeutet 600 g Wasser auf 1000 g Mehl. Mehr Wasser = luftigerer, aber schwerer zu handhabender Teig." },
  { id: "poolish", term: "Poolish", body: "Flüssiger Vorteig im Verhältnis 1:1 (Mehl:Wasser) mit sehr wenig Hefe, 12–16 h gereift. Ergibt einen milden, dehnbaren Teig mit feinporiger Krume." },
  { id: "biga", term: "Biga", body: "Fester italienischer Vorteig (ca. 45–50 % Hydration). Reift 12–24 h und bringt kräftiges Aroma und Struktur in den Hauptteig." },
  { id: "autolyse", term: "Autolyse", body: "Ruhephase aus nur Mehl und Wasser vor dem Kneten und vor der Hefezugabe. Das Gluten entwickelt sich von selbst — weniger Knetarbeit, dehnbarerer Teig." },
  { id: "stockgare", term: "Stockgare", body: "Erste Gärphase des gesamten Teigs im Stück, direkt nach dem Kneten. Danach wird portioniert und zu Kugeln geformt (Stückgare)." },
  { id: "wwert", term: "W-Wert (Mehlstärke)", body: "Maß für die Backstärke des Mehls. Höherer W-Wert = mehr Gluten = mehr Wasseraufnahme und längere Gare möglich. Caputo Cuoco liegt bei ~W300." },
  { id: "ddt", term: "DDT — Zieltemperatur", body: "Desired Dough Temperature: die angestrebte Teigtemperatur nach dem Kneten (ca. 23–25 °C). Über die Schüttwasser­temperatur (und ggf. Eis) gesteuert." },
  { id: "cornicione", term: "Cornicione", body: "Der luftig aufgegangene Pizzarand. Entsteht durch behutsames Ausbreiten des Teigs, ohne die Gase aus dem Rand zu drücken." },
];

function GlossarScreen() {
  const { Card, GlossaryItem } = DS_G;
  const [open, setOpen] = useStateG("poolish");
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionTitle icon="glossar">Pizza-Glossar</SectionTitle>
        <Card title="Begriffe & Hintergründe" icon="glossar">
          {TOPICS.map((t) => (
            <GlossaryItem key={t.id} term={t.term}
              open={open === t.id} onToggle={(o) => setOpen(o ? t.id : null)}>
              <p style={{ margin: 0 }}>{t.body}</p>
            </GlossaryItem>
          ))}
        </Card>
      </div>
    </div>
  );
}
window.GlossarScreen = GlossarScreen;
