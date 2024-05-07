interface Database {
  exec(sql: string, params?: any[]): Promise<{ rows: any[][] }>;
}

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

  async function exec(sql: string, params?: any[]): Promise<{ rows: any[][] }> {
    const rows: any[][] = [];
    await promiser("exec", {
      dbId,
      sql,
      params,
      callback: (result: { row?: any[] }) => {
        if (result.row) rows.push(result.row);
      },
    });
    return { rows };
  }

  resolve({ exec });
});
