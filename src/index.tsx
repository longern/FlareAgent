import React from "react";
import ReactDOM from "react-dom/client";

import "./i18n";
import Root from "./components/Root";
import "./scheme";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
