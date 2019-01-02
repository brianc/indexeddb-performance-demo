import Database from "./database";

const incommingOps = {
  load: async () => {
    const db = await Database.open();
    // proxy events from the database through the worker to main thread
    const proxy = op =>
      db.on(op, data =>
        global.postMessage({
          op: op,
          ...data
        })
      );
    proxy("write");
    // fill the database, pausing for a bit during writes
    await db.fill(1);
    global.postMessage({
      op: "done"
    });
  }
};

global.onmessage = msg => {
  const { data } = msg;
  incommingOps[data.op](data);
};
