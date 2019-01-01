import React, { useState, useEffect } from "react";
import WorkerManager from "./worker-manager";
import Database from "./database";

const mgmr = new WorkerManager();

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
    mgmr.on("write", ({ batchSize, total, timestamp }) => {
      this.setState({ batchSize, total, timestamp });
    });
    this.readCount();
  }

  render() {
    const { total, readCount, readDelay, timestamp } = this.state;
    return (
      <div>
        <div>Current timestamp: {timestamp}</div>
        <div>Records written: {total}</div>
        <div>
          Read {readCount} records in {readDelay}ms
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
