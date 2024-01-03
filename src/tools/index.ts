import { ChatCompletionTool } from "openai/resources/index.mjs";
import type { OpenAPIV3 } from "openapi-types";

import { registerSchemeHandler } from "../scheme";
import app from "./route";

const TOOL_SCHEME = "tool";

registerSchemeHandler(
  TOOL_SCHEME,
  async (url: string, options?: RequestInit) => {
    const urlObj = new URL(url);
    const response = await app.fetch(
      new Request(urlObj.pathname.replace("//", "/"), options)
    );
    return response;
  }
);

export type Tool = ChatCompletionTool & {
  endpoint: string;
  method: string;
};

export function apisToTool(apis: OpenAPIV3.Document[]): Tool[] {
  return apis.flatMap((api) =>
    Object.entries(api.paths).flatMap(([path, methods]) =>
      Object.entries(methods).flatMap(
        ([method, operation]: [string, OpenAPIV3.OperationObject]) => {
          const schema = (operation.requestBody as OpenAPIV3.RequestBodyObject)
            ?.content?.["application/json"]?.schema as OpenAPIV3.SchemaObject;

          const required = [];

          const properties = Object.fromEntries(
            Object.entries(schema?.properties ?? {}).map(
              ([name, property]: [string, OpenAPIV3.SchemaObject]) => {
                if (property.required) required.push(name);
                return [
                  name,
                  {
                    type: property.type,
                    description: property.description,
                  },
                ];
              }
            )
          );

          return {
            type: "function",
            endpoint: `${TOOL_SCHEME}:/${path}`,
            method,
            function: {
              name: operation.operationId,
              description: operation.summary,
              parameters: {
                type: "object",
                properties,
                required,
              },
            },
          };
        }
      )
    )
  );
}
