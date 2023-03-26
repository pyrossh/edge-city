import React from 'react';
import { Link, useRouter } from "parotta/router";
import "./page.css";

export function Head() {
  return (
    <>
      <title>About us</title>
    </>
  )
}

export default function Page() {
  const router = useRouter();
  return (
    <div className="about-page">
      <div>
        <h1>About Page</h1>
        <p>
          Path: {router.pathname}
        </p>
      </div>
      <footer>
        <Link href="/">Back</Link>
      </footer>
    </div>
  )
}