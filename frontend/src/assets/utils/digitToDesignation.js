import { useLanguage } from "../locale/LanguageContext";

export default function digitToDesignation(label, value) {
  const { translate } = useLanguage();

  if (label === "role_id") {
    switch (value) {
      case "admin":
        return translate("ADMIN");
      case "manager":
        return translate("MANAGER");
      case "production_agent":
        return translate("PRODUCTION_AGENT");
      case "seller":
        return translate("SELLER");
      case "counter_seller":
        return translate("COUNTER_SELLER");
      case "seller_production":
        return translate("SELLER_PRODUCTION");
      default:
        return value || "";
    }
  }
  return "";
}
