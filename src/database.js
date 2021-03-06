import idb from "idb";
import EventEmitter from "events";
import { sample } from "lodash";

const DB_NAME = "test-db";
const STORE_NAME = "keyval";
const BATCHES = 500;
const RECORDS_PER_BATCH = 150;

const fileNames = ["foo", "bar", "baz", "bump"];

const delay = time => new Promise(resolve => setTimeout(resolve, time));

export default class Database extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
  }

  static async open() {
    const db = await idb.open(DB_NAME, 1, upgradeDB => {
      const store = upgradeDB.createObjectStore(STORE_NAME, {
        autoIncrement: true
      });
      store.createIndex("index", ["timestamp", "fileName"], { unique: false });
    });
    return new Database(db);
  }

  // fill the database with messages with incrementing timestamps
  // and a 5k byte array buffer
  async fill(pauseForMillis = 1) {
    const start = performance.now();
    const end = start + BATCHES * RECORDS_PER_BATCH;
    let data = new ArrayBuffer(5000);
    let count = 0;
    for (let i = 0; i < BATCHES; i++) {
      const stamp = performance.now();
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      let timestamp;
      for (let j = 0; j < RECORDS_PER_BATCH; j++) {
        timestamp = start + count++;
        tx.objectStore(STORE_NAME).put({
          timestamp,
          data,
          fileName: sample(fileNames)
        });
      }
      await delay(pauseForMillis);
      await tx.complete;
      // emit write progress to main thread
      this.emit("write", {
        batchSize: RECORDS_PER_BATCH,
        total: RECORDS_PER_BATCH * i,
        timestamp,
        duration: performance.now() - stamp,
        start,
        end
      });
    }
  }

  // clear the database of records
  async clear() {
    const tx = this.db.transaction(STORE_NAME, "readwrite");
    await tx.objectStore(STORE_NAME).clear();
    await tx.complete;
  }

  // read records between start & end inclusive
  async getMessages(start, end) {
    const tx = this.db.transaction(STORE_NAME, "readonly");
    let store = tx.objectStore(STORE_NAME).index("index");
    const range = IDBKeyRange.bound([start, ""], [end, "~"]);
    const items = [];
    store.iterateCursor(range, cursor => {
      if (!cursor) {
        return;
      }
      const { key, value } = cursor;
      items.push({ key, value });
      cursor.continue();
    });
    await tx.complete;
    return items;
  }
}
