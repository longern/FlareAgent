import type { Middleware } from "@reduxjs/toolkit";

import { DB } from "../db";
import { toolsSlice, setTools } from "./tools";
import type { AppState } from "./store";

type ValueOf<T> = T[keyof T];
type MemoryActions = ReturnType<ValueOf<typeof toolsSlice.actions>>;

const toolsMiddleware: Middleware<{}, AppState> = (store) => {
  const { dispatch } = store;

  DB.then(async (db) => {
    const result = await db.exec<[string, string, number]>(
      "SELECT tool_id, schema, create_time FROM flare_agent_tools ORDER BY create_time DESC"
    );
    const tools = result.rows.map(([id, definition, create_time]) => ({
      id,
      definition,
      create_time,
    }));
    dispatch(setTools(tools));
  });

  return (next) => async (action: MemoryActions) => {
    next(action);
    if (!action.type.startsWith("tools/")) return;

    const db = await DB;
    switch (action.type) {
      case toolsSlice.actions.createTool.type: {
        const { id, definition } = action.payload;
        await db.exec(
          "INSERT INTO flare_agent_tools (tool_id, schema) VALUES (?, ?)",
          [id, definition]
        );
        break;
      }

      case toolsSlice.actions.deleteTool.type: {
        await db.exec("DELETE FROM flare_agent_tools WHERE tool_id = ?", [
          action.payload,
        ]);
        break;
      }
    }
  };
};

export default toolsMiddleware;
