import Worker from "worker-loader?inline=true!./worker";
import EventEmitter from "events";

const incommingOps = {
  write({ batchSize, total, timestamp, start, end }) {
    this.emit("write", { batchSize, total, timestamp, start, end });
  }
};

export default class WorkerManager extends EventEmitter {
  constructor() {
    super();
    this.worker = new Worker();
    this.worker.onmessage = msg => {
      const { data } = msg;
      incommingOps[data.op].call(this, data);
    };
  }

  load() {
    this.worker.postMessage({ op: "load" });
  }
}
