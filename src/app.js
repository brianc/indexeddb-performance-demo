import React, { useState, useEffect } from "react";
import WorkerManager from "./worker-manager";
import Database from "./database";
import { Histogram } from "measured-core";

const mgmr = new WorkerManager();
const readWhileWriteHistogram = new Histogram();
const readAfterWriteHistogram = new Histogram();
const writeHistogram = new Histogram();

class DatabaseLoader extends React.Component {
  constructor() {
    super();
    this.state = { database: undefined };
  }
  async componentDidMount() {
    const db = await Database.open();
    await db.clear();
    this.setState({ database: db });
  }

  render() {
    const { children } = this.props;
    const { database } = this.state;
    if (!database) {
      return <div>Opening database...</div>;
    }
    return React.cloneElement(children, { database });
  }
}

class Display extends React.Component {
  constructor() {
    super();
    this.state = {
      batchSize: 0,
      total: 0,
      timestamp: 0,
      readDelay: 0,
      readCount: 0
    };
    this.readHistogram = readWhileWriteHistogram;
  }

  readCount() {
    setTimeout(async () => {
      const start = Date.now();
      const { timestamp } = this.state;
      if (timestamp) {
        // read a chunk of recent messages from the database
        const messages = await this.props.database.getMessages(
          timestamp - 500,
          timestamp
        );
        this.readHistogram.update(Date.now() - start);
        this.setState({
          readCount: messages.length,
          readDelay: Date.now() - start
        });
      }
      this.readCount();
    }, 100);
  }

  componentDidMount() {
    mgmr.load();
    mgmr.on("write", ({ batchSize, total, timestamp, duration }) => {
      this.setState({ batchSize, total, timestamp });
      writeHistogram.update(duration);
    });
    mgmr.on("done", () => {
      this.readHistogram = readAfterWriteHistogram;
    });
    this.readCount();
  }

  render() {
    const { total, readCount, readDelay, timestamp } = this.state;
    const flex = {
      display: "flex",
      flexDirection: "row"
    };
    return (
      <div>
        <div>Current timestamp: {timestamp}</div>
        <div>Records written: {total}</div>
        <div>
          Read {readCount} records in {readDelay}ms
        </div>
        <div style={flex}>
          <div style={{ flex: 1 }}>
            <h5>Read while write histogram</h5>
            <pre>
              {JSON.stringify(readWhileWriteHistogram.toJSON(), null, 2)}
            </pre>
          </div>
          <div style={{ flex: 1 }}>
            <h5>Read after write histogram</h5>
            <pre>
              {JSON.stringify(readAfterWriteHistogram.toJSON(), null, 2)}
            </pre>
          </div>
          <div style={{ flex: 1 }}>
            <h5>Write histogram</h5>
            <pre>{JSON.stringify(writeHistogram.toJSON(), null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }
}

export default () => (
  <DatabaseLoader>
    <Display />
  </DatabaseLoader>
);
