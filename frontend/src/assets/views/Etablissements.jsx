import React from "react";
import GenericCrud from "../components/GenericCrud";
import { getEtablissementsConfig } from "../configs/etablissementsConfig";
import etablissementsService from "../services/etablissementsService";
import { useStateContext } from '../contexts/ContextProvider';
import { useLanguage } from "../locale/LanguageContext";
import CrudProvider from "../contexts/CrudProvider";

const Etablissements = () => {
  const { user } = useStateContext();
  const { translate } = useLanguage();

  return (
    <CrudProvider config={getEtablissementsConfig(user, translate)} service={etablissementsService}>
      <GenericCrud />
    </CrudProvider>
  );
};

export default Etablissements;
