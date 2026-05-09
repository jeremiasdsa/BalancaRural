export const AGE_CATEGORIES = [
  {
    value: "calf_nursing",
    label: "Bezerro Mamando",
    description: "até 10 meses"
  },
  {
    value: "young_single",
    label: "Garrote/Garrota/Solteiro",
    description: "14-24 meses"
  },
    {
    value: "adult_first_birth",
    label: "Vaca/PrimeiraCria",
    description: "18-24 meses"
  },
  {
    value: "adult_middle_age",
    label: "Vaca/SegundaCria",
    description: "24-40 meses"
  },
  {
    value: "old",
    label: "Velho",
    description: "+7 anos/+5 crias"
  }
];

export function normalizeAgeCategory(ageCategory) {
  const value = String(ageCategory ?? "").trim();
  return AGE_CATEGORIES.some((category) => category.value === value) ? value : "";
}

export function formatAgeCategory(ageCategory) {
  const category = AGE_CATEGORIES.find((item) => item.value === normalizeAgeCategory(ageCategory));
  return category ? `${category.label} (${category.description})` : "";
}
