import type { Middleware } from "@reduxjs/toolkit";

import { DB } from "../db";
import { memoriesSlice, setMemories } from "./memories";
import type { AppState } from "./store";

type ValueOf<T> = T[keyof T];
type MemoryActions = ReturnType<ValueOf<typeof memoriesSlice.actions>>;

const memoriesMiddleware: Middleware<{}, AppState> = (store) => {
  const { dispatch } = store;

  DB.then(async (db) => {
    const result = await db.exec<[string, string, number]>(
      "SELECT memory_id, content, create_time FROM flare_agent_memories ORDER BY create_time DESC"
    );
    const memories = result.rows.map(([id, content, create_time]) => ({
      id,
      content,
      create_time,
    }));
    dispatch(setMemories(memories));
  });

  return (next) => async (action: MemoryActions) => {
    next(action);
    if (!action.type.startsWith("memories/")) return;

    const db = await DB;
    switch (action.type) {
      case memoriesSlice.actions.createMemory.type: {
        const { id, content, create_time } = action.payload;
        await db.exec(
          "INSERT INTO flare_agent_memories (memory_id, content, create_time) VALUES (?, ?, ?)",
          [id, content, create_time]
        );
        break;
      }

      case memoriesSlice.actions.deleteMemory.type: {
        await db.exec("DELETE FROM flare_agent_memories WHERE memory_id = ?", [
          action.payload,
        ]);
        break;
      }

      case memoriesSlice.actions.clearMemories.type: {
        await db.exec("DELETE FROM flare_agent_memories");
        break;
      }
    }
  };
};

export default memoriesMiddleware;
