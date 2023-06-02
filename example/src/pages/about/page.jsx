import React from "react";
import Link from "edge-city/link";
import { useRouter } from "edge-city/router";
import { Helmet } from "react-helmet-async";
import "./page.css";

export default function Page() {
  const router = useRouter();
  return (
    <div className="about-page">
      <Helmet>
        <title>About | Edge City</title>
        <meta name="description" content="Showcase of using edge-city meta-framework." />
      </Helmet>
      <div>
        <h1>About Page</h1>
        <p>Path: {router.pathname}</p>
        <p>Showcase of using edge-city meta-framework.</p>
      </div>
      <footer>
        <Link href="/">Back</Link>
      </footer>
    </div>
  );
}
