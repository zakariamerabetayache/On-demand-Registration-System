import React from "react";
import GenericCrud from "../components/GenericCrud";
import usersService from "../services/usersService";
import { getUsersConfig } from "../configs/usersConfig";
import { useStateContext } from "../contexts/ContextProvider";
import CrudProvider from "../contexts/CrudProvider";

const Users = () => {
  const { user } = useStateContext();

  return (
    <CrudProvider config={getUsersConfig(user)} service={usersService}>
      <GenericCrud />
    </CrudProvider>
  );
};

export default Users;
