import React from 'react';

const LogoDisplay = ({ user, defaultLogo }) => {
  return user?.etablissement?.logo ? (
    <div style={{ position: "relative", zIndex: 100, height: "70px", borderRadius: "50%" }}>
      <img
        src={`${import.meta.env.VITE_API_BASE_URL}/storage/${user.etablissement.logo}`}
        alt="Logo"
        style={{ height: "100%", width: "auto" }}
      />
    </div>
  ) : (
    <div style={{ position: "relative", zIndex: 100, height: "70px", borderRadius: "50%" }}>
      <img
        src={defaultLogo}
        alt="Logo"
        style={{ height: "100%", width: "auto" }}
      />
    </div>
  );
};

export default LogoDisplay;
