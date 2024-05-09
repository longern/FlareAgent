import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import store from "./app/store";
import Root from "./components/Root";
import "./i18n";
import "./scheme";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  </Provider>
);
