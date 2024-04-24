import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import "./i18n";
import Root from "./components/Root";
import "./scheme";
import store from "./app/store";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  </Provider>
);
