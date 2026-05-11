import { getActivePropertyId } from "../../data/repositories/propertiesRepository.js";
import {
  createWeightRecord,
  updateWeightRecord
} from "../../data/repositories/weightRecordsRepository.js";
import { normalizeAgeCategory } from "./ageCategories.js";
import { normalizeDiscard, normalizeEarring, normalizeVaccines } from "./managementInfo.js";

export async function saveWeightRecordForm({ existingRecord, formData, ownerId, syncRecord }) {
  const animalId = String(formData.get("animalId") ?? "").trim();
  const info = String(formData.get("info") ?? "").trim();
  const sex = String(formData.get("sex") ?? "").trim();
  const ageCategory = normalizeAgeCategory(formData.get("ageCategory"));
  const discard = normalizeDiscard(formData.get("discard"));
  const earring = normalizeEarring(formData.get("earring"));
  const vaccines = normalizeVaccines(formData.getAll("vaccines"));
  const vaccineNotes = String(formData.get("vaccineNotes") ?? "").trim();
  const iron = String(formData.get("iron") ?? "").trim();
  const weight = Number(formData.get("weight"));

  if (!animalId || !Number.isFinite(weight) || weight <= 0) {
    return { ok: false, error: "Informe o código do animal e um peso válido." };
  }

  try {
    if (existingRecord) {
      const record = await updateWeightRecord(existingRecord.id, {
        ageCategory,
        animalId,
        discard,
        earring,
        info,
        iron,
        sex,
        vaccineNotes,
        vaccines,
        weight
      }, ownerId);
      await syncRecord(record);
      return { ok: true, message: "Pesagem atualizada." };
    }

    const activePropertyId = await getActivePropertyId(ownerId);
    if (!activePropertyId) {
      return { ok: false, error: "Selecione uma propriedade antes de salvar a pesagem." };
    }

    const record = await createWeightRecord({
      propertyId: activePropertyId,
      ageCategory,
      animalId,
      discard,
      earring,
      info,
      iron,
      sex,
      vaccineNotes,
      vaccines,
      weight,
      ownerId
    });
    await syncRecord(record);
    return { ok: true, activePropertyId, message: "Pesagem adicionada." };
  } catch (error) {
    return { ok: false, error: error.message || "Não foi possível salvar a pesagem." };
  }
}
