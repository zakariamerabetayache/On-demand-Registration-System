import React from "react";
import GenericCrud from "../components/GenericCrud";
import { communesConfig } from "../configs/communesConfig";
import communesService from "../services/communesService";
import CrudProvider from "../contexts/CrudProvider";

const Communes = () => {
  return (
    <CrudProvider config={communesConfig} service={communesService}>
      <GenericCrud />
    </CrudProvider>
  );
};

export default Communes;
