interface Database {
  exec<T = any[]>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
}

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS flare_agent_conversations (
  conversation_id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  create_time INTEGER DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER))
);

CREATE TABLE IF NOT EXISTS flare_agent_messages (
  message_id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT,
  content TEXT,
  author_role TEXT,
  create_time INTEGER DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  FOREIGN KEY (conversation_id) REFERENCES flare_agent_conversations(conversation_id)
  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flare_agent_memories (
  memory_id TEXT PRIMARY KEY NOT NULL,
  content TEXT,
  create_time INTEGER DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER))
);
`;

export const DB = new Promise<Database>(async (resolve) => {
  const { sqlite3Worker1Promiser } = (await import(
    "@sqlite.org/sqlite-wasm"
  )) as any;

  const promiser = await new Promise<any>((resolve) => {
    const _promiser = sqlite3Worker1Promiser({
      onready: () => {
        resolve(_promiser);
      },
    });
  });

  const { dbId } = await promiser("open", {
    filename: "file:.flareagent/db.sqlite3?vfs=opfs",
  });

  async function exec<T = any[]>(
    sql: string,
    params?: any[]
  ): Promise<{ rows: T[] }> {
    const rows: T[] = [];
    await promiser("exec", {
      dbId,
      sql,
      bind: params,
      callback: (result: { row?: T }) => {
        if (result.row) rows.push(result.row);
      },
    });
    return { rows };
  }

  for (const sql of INIT_SQL.split("\n\n")) {
    await exec(sql);
  }

  resolve({ exec });
});

declare const process: { env: { NODE_ENV: string } };
if (process.env.NODE_ENV === "development") {
  DB.then((db) => ((window as any).db = db));
}
