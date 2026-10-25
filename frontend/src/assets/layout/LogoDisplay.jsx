import React from 'react';

const LogoDisplay = ({ user, defaultLogo }) => {
  const logoUrl = user?.etablissement?.logo
    ? `${import.meta.env.VITE_API_BASE_URL}/storage/${user.etablissement.logo}`
    : defaultLogo;

  return (
    <div className="flex items-center gap-3 group">
      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200/80 p-1 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <img
          src={logoUrl}
          alt={user?.etablissement?.name || "Logo"}
          className="h-full w-full object-contain"
        />
      </div>
      {user?.etablissement?.nom_fr && (
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 leading-tight">
            {user?.etablissement?.nom_fr}
          </span>
          {user?.etablissement?.nom_ar && (
            <span className="text-[11px] text-slate-500 font-medium leading-tight">
              {user?.etablissement?.nom_ar}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LogoDisplay;

