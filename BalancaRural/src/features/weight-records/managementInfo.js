export const DISCARD_OPTIONS = [
  { value: "yes", label: "SIM" },
  { value: "next", label: "Próximo" },
  { value: "no", label: "NÃO" }
];

export const EARRING_OPTIONS = [
  { value: "yes", label: "SIM" },
  { value: "no", label: "NÃO" }
];

export const VACCINE_OPTIONS = [
  { value: "rabies", label: "RAIVA" },
  { value: "ivomec", label: "IVOMEC (Vermífugo)" },
  { value: "dectomax", label: "DECTOMAX (Vermífugo)" },
  { value: "roboforte", label: "ROBOFORTE (Vitamina)" }
];

export function normalizeDiscard(discard) {
  const value = String(discard ?? "").trim();
  return DISCARD_OPTIONS.some((option) => option.value === value) ? value : "";
}

export function normalizeEarring(earring) {
  const value = String(earring ?? "").trim();
  return EARRING_OPTIONS.some((option) => option.value === value) ? value : "";
}

export function normalizeVaccines(vaccines) {
  const selected = Array.isArray(vaccines) ? vaccines : [vaccines];
  const allowed = new Set(VACCINE_OPTIONS.map((option) => option.value));
  return [...new Set(selected.map((item) => String(item ?? "").trim()).filter((item) => allowed.has(item)))];
}

export function formatDiscard(discard) {
  return DISCARD_OPTIONS.find((option) => option.value === normalizeDiscard(discard))?.label ?? "";
}

export function formatEarring(earring) {
  return EARRING_OPTIONS.find((option) => option.value === normalizeEarring(earring))?.label ?? "";
}

export function formatVaccines(vaccines, vaccineNotes = "") {
  const labels = normalizeVaccines(vaccines)
    .map((value) => VACCINE_OPTIONS.find((option) => option.value === value)?.label)
    .filter(Boolean);
  const custom = String(vaccineNotes ?? "").trim();
  return [...labels, custom].filter(Boolean).join(", ");
}

export function formatManagementInfo(record) {
  return [
    ["Descarte", formatDiscard(record?.discard)],
    ["Brinco", formatEarring(record?.earring)],
    ["Vacinas", formatVaccines(record?.vaccines, record?.vaccineNotes)],
    ["Ferro", String(record?.iron ?? "").trim()]
  ].filter(([, value]) => value);
}

export function formatManagementSummary(record) {
  return formatManagementInfo(record)
    .map(([label, value]) => `${label}: ${value}`)
    .join(" | ");
}
