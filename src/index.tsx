import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import store from "./app/store";
import { ActionsProvider } from "./components/ActionsProvider";
import App from "./components/App";
import "./i18n";
import "./scheme";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ActionsProvider>
        <App />
      </ActionsProvider>
    </Provider>
  </React.StrictMode>
);
