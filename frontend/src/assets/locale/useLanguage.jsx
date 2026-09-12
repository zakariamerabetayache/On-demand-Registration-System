// Legacy compatibility - use LanguageContext instead
import { useLanguage as useLanguageContext } from './LanguageContext';

const getLabel = (key) => {
  // This is kept for backward compatibility
  // But it's recommended to use the LanguageContext instead
  try {
    const lowerCaseKey = key
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/ /g, "_");

    // Convert key to readable format as fallback
    const remove_underscore_fromKey = key.replace(/_/g, " ").split(" ");
    const conversionOfAllFirstCharacterofEachWord =
      remove_underscore_fromKey.map(
        (word) => word[0].toUpperCase() + word.substring(1)
      );
    const label = conversionOfAllFirstCharacterofEachWord.join(" ");
    return label;
  } catch (error) {
    return "No translate";
  }
};

const useLanguage = () => {
  try {
    // Try to use the new context-based translation
    const { translate } = useLanguageContext();
    return translate;
  } catch (error) {
    // Fallback to legacy behavior if context is not available
    const translate = (value) => getLabel(value);
    return translate;
  }
};

export default useLanguage;
