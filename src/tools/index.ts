import { ChatCompletionTool } from "openai/resources/index";
import type { OpenAPIV3 } from "openapi-types";

export function apisToTool(apis: OpenAPIV3.Document[]): ChatCompletionTool[] {
  return apis.flatMap((api) =>
    Object.values(api.paths).flatMap((methods) =>
      Object.values(methods).flatMap((operation: OpenAPIV3.OperationObject) => {
        const schema = (operation.requestBody as OpenAPIV3.RequestBodyObject)
          ?.content?.["application/json"]?.schema as OpenAPIV3.SchemaObject;

        const required: string[] = [];

        const properties = Object.fromEntries(
          Object.entries(schema?.properties ?? {}).map(
            ([name, property]: [string, OpenAPIV3.SchemaObject]) => {
              if (property.required) required.push(name);
              return [
                name,
                { type: property.type, description: property.description },
              ];
            }
          )
        );

        return {
          type: "function",
          function: {
            name: operation.operationId,
            description: operation.summary,
            parameters: { type: "object", properties, required },
          },
        };
      })
    )
  );
}

export function findToolMetadata(
  apis: OpenAPIV3.Document[],
  operationId: string
) {
  for (const api of apis) {
    for (const [path, methods] of Object.entries(api.paths)) {
      for (const [method, operation] of Object.entries(methods) as Array<
        [string, OpenAPIV3.OperationObject]
      >) {
        if (operation.operationId === operationId) {
          return {
            endpoint: api.servers[0].url + path.replace(/^\//, ""),
            method: method.toUpperCase(),
          };
        }
      }
    }
  }
  return null;
}
