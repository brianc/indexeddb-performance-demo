const express = require("express");
const mw = require("webpack-dev-middleware");
const webpack = require("webpack");
const config = require("./webpack.config");

const app = express();
const compiler = webpack(config);
const middleware = mw(compiler, {
  publicPath: "/dist"
});
app.use(middleware);
app.use(express.static("./public"));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on ${port}...`));
