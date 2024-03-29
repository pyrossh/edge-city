import React from "react";
import { Helmet } from "react-helmet-async";
import "./page.css";

export default function Page() {
  return (
    <div className="notfound-page">
      <Helmet>
        <title>Page not found</title>
      </Helmet>
      <h1>404 - Page not found</h1>
      <div className="content">
        <h2>This page could not be found</h2>
      </div>
    </div>
  );
}
