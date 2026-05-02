import { clearStore, STORES } from "../data/db/indexedDb.js";
import { resetVisibleState } from "./state.js";

export async function clearVisibleData(state) {
  await Promise.all([
    clearStore(STORES.properties),
    clearStore(STORES.weightRecords),
    clearStore(STORES.appState)
  ]);
  resetVisibleState(state);
}
