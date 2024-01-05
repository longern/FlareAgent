import React from "react";
import { Prism } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

function Highlighter({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  return (
    <Prism PreTag="div" children={children} language={language} style={dark} />
  );
}

export default Highlighter;
