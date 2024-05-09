import type { Middleware } from "@reduxjs/toolkit";

import type { AppState } from "./store";
import {
  Message,
  conversationsSlice,
  setConversations,
  setCurrentConversation,
} from "./conversations";
import { DB } from "../db";

type ValueOf<T> = T[keyof T];
type ConversationActions = ReturnType<
  ValueOf<typeof conversationsSlice.actions>
>;

const conversationsMiddleware: Middleware<{}, AppState> = (store) => {
  const { dispatch } = store;

  DB.then(async (db) => {
    const result = await db.exec<[string, string, number]>(
      "SELECT conversation_id, title, create_time FROM flare_agent_conversations ORDER BY create_time DESC LIMIT 10"
    );
    const conversations = result.rows.map(([id, title, create_time]) => ({
      id,
      title,
      create_time,
      messages: null,
    }));
    dispatch(setConversations(conversations));
    if (conversations.length > 0) {
      dispatch(setCurrentConversation(conversations[0].id));
    }
  });

  return (next) => async (action: ConversationActions) => {
    next(action);
    if (!action.type.startsWith("conversations/")) return;

    const db = await DB;
    switch (action.type) {
      case conversationsSlice.actions.createConversation.type: {
        const { id, title, create_time, messages } = action.payload;
        await db.exec(
          "INSERT INTO flare_agent_conversations (conversation_id, title, create_time) VALUES (?, ?, ?)",
          [id, title, create_time]
        );
        for (const message of Object.values(messages)) {
          await db.exec(
            "INSERT INTO flare_agent_messages (message_id, conversation_id, content, author_role, create_time) VALUES (?, ?, ?, ?, ?)",
            [
              message.id,
              id,
              message.content,
              message.author_role,
              message.create_time,
            ]
          );
        }
        break;
      }

      case conversationsSlice.actions.removeConversation.type: {
        db.exec(
          "DELETE FROM flare_agent_conversations WHERE conversation_id = ?",
          [action.payload]
        );
        break;
      }

      case conversationsSlice.actions.createMessage.type: {
        const state = store.getState();
        const message = action.payload;
        const conversation_id = state.conversations.currentConversationId;
        db.exec(
          "INSERT INTO flare_agent_messages (message_id, conversation_id, content, author_role, create_time) VALUES (?, ?, ?, ?, ?)",
          [
            message.id,
            conversation_id,
            message.content,
            message.author_role,
            message.create_time,
          ]
        );
        break;
      }

      case conversationsSlice.actions.setCurrentConversation.type: {
        if (action.payload === null) return;
        const { rows } = await db.exec<[string, string, string, number]>(
          "SELECT message_id, author_role, content, create_time FROM flare_agent_messages WHERE conversation_id = ? ORDER BY create_time DESC",
          [action.payload]
        );
        const messages = Object.fromEntries(
          rows
            .map(([message_id, author_role, content, create_time]) => [
              message_id,
              {
                id: message_id,
                author_role: author_role as Message["author_role"],
                content,
                create_time,
              },
            ])
            .reverse()
        );
        dispatch(conversationsSlice.actions.setMessages(messages));
        break;
      }
    }
  };
};

export default conversationsMiddleware;
