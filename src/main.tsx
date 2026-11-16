import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { I18nProvider } from "./i18n";
import App from "./App";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";
import { applyTheme, getInitialTheme } from "./utils/theme";

applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <HashRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </HashRouter>
    </I18nProvider>
  </React.StrictMode>
);
