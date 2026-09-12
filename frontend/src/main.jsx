import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Routes from "./Router.jsx";
import { RouterProvider } from "react-router-dom";
import Localization from "./assets/locale/Localization";
import { ContextProvider } from "./assets/contexts/ContextProvider";
import { App as AntApp } from 'antd';

// Configure dayjs for Ant Design
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import 'dayjs/locale/ar';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Extend dayjs with plugins
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(dayOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Set default locale
dayjs.locale('en');

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AntApp>
      <ContextProvider>
        <Localization>
          <RouterProvider router={Routes} />
        </Localization>
      </ContextProvider>
    </AntApp>
  </StrictMode>
);
