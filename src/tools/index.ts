import { ChatCompletionTool } from "openai/resources/index";
import type { OpenAPIV3 } from "openapi-types";

export const TOOL_SCHEME = "tool";

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

          const required: string[] = [];

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
