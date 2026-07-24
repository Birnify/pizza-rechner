// Pizza Party — planner: guests → pizzas → dough math + aggregated shopping list.
const { useState: useStateP } = React;
const DS_P = window.TeigmeisterDesignSystem_c6b7bf;

function PartyScreen() {
  const { Card, Stepper, IngredientRow, TotalSummary, Note, Badge } = DS_P;
  const [guests, setGuests] = useStateP(6);
  const [perPerson, setPerPerson] = useStateP(2);

  const pizzas = guests * perPerson;
  const weight = 250;
  const total = pizzas * weight;
  const flour = Math.round(total / 1.65);
  const water = Math.round(flour * 0.62);
  const salt = +(flour * 0.03).toFixed(0);
  const yeast = +(flour * 0.002).toFixed(1);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionTitle icon="party">Pizza Party</SectionTitle>

        <Card title="Wie viele Gäste?" icon="party">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Gäste">
              <Stepper value={guests} onChange={setGuests} min={1} max={40} ariaLabel="Gäste" />
            </Field>
            <Field label="Pizzen pro Person">
              <Stepper value={perPerson} onChange={setPerPerson} min={1} max={4} ariaLabel="Pizzen pro Person" />
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Note variant="note">Ergibt <b>{pizzas} Pizzen</b> à {weight} g — plane etwas Puffer für Nachschlag ein.</Note>
          </div>
        </Card>

        <Card title="Einkaufsliste" icon="rechner" accent="basil">
          <TotalSummary value={`${(total / 1000).toFixed(1)} kg`} label={`Teig · ${pizzas} Pizzen`} />
          <div style={{ marginTop: 14 }}>
            <IngredientRow name="Mehl (Tipo 00)" amount={flour} unit="g" dotColor="var(--crust)" />
            <IngredientRow name="Wasser" amount={water} unit="g" dotColor="var(--focus)" />
            <IngredientRow name="Salz" amount={salt} unit="g" dotColor="var(--muted)" />
            <IngredientRow name="Frische Hefe" amount={yeast} unit="g" last />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            <Badge tone="warm">🛒 Passata</Badge>
            <Badge tone="warm">🛒 Mozzarella</Badge>
            <Badge tone="warm">🛒 Basilikum</Badge>
            <Badge tone="warm">🛒 Olivenöl</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
window.PartyScreen = PartyScreen;
