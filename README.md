# indexeddb-performance-demo

Demo of simultaneous read/write speed vs. read only speed of indexedDB.  The app will run & create an indexedDB database.  From a web worker the app will write many ~5kb messages into the database using a compound index.  Meanwhile, on the main thread the app will read from the database in a loop.  Both read and write times will be reported and displayed as histograms to show the difference in read speed during the writing and once writing is finished.

## to run
- clone the repo
- `yarn && yarn start`
- visit http://localhost:3000 in your browser
