import React from "react";
import ReactDom from "react-dom/server";
import server from "parotta/server.js";

export default {
  port: 3000,
  fetch: server,
}