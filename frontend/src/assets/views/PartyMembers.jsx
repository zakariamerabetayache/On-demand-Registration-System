import React, { useEffect, useState } from 'react';
import GenericCrud from '../components/GenericCrud';
import partyMembersService from '../services/partyMembersService';
import { getPartyMembersConfig } from '../configs/partyMembersConfig';
import { useStateContext } from "../contexts/ContextProvider";
import CrudProvider from "../contexts/CrudProvider";

const PartyMembers = () => {
    const { user } = useStateContext();
    const config = getPartyMembersConfig(user);

    return (
        <CrudProvider config={config} service={partyMembersService}>
            <GenericCrud />
        </CrudProvider>
    );
};

export default PartyMembers;
