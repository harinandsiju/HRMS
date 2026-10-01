const express = require("express");
const cors = require("cors");

const app = express();

const router = require("./routes/router");

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/", router);

module.exports = app;