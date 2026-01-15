import { cookies } from "next/headers";
import { LanguageSelectorClient } from "./LanguageSelectorClient";

const LanguageSelector = async () => {
  const store = await cookies();
  const lang = store.get("locale")?.value || "en";

  return <LanguageSelectorClient defaultLang={lang} />;
};

export default LanguageSelector;