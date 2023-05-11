import React from 'react';
import "./page.css";

export const Head = () => {
  return (
    <title>Page not found</title>
  )
}

export const Body = () => {
  return (
    <div>
      <h1>404</h1>
      <div className="content">
        <h2>This page could not be found</h2>
      </div>
    </div>
  )
}