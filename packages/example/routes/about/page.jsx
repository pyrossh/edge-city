import React from 'react';
import { Link, useRouter } from "parotta/router";
import "./page.css";

export const Head = () => {
  return (
    <title>About us</title>
  )
}

export const Body = () => {
  const router = useRouter();
  return (
    <div className="about-page">
      <div>
        <h1>About Page</h1>
        <p>Showcase of using parotta meta-framework.</p>
      </div>
      <footer>
        <Link href="/">Back</Link>
      </footer>
    </div>
  )
}