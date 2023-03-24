import React from 'react';
import { Link, useRouter } from "parotta/router";
import "./page.css";

const AboutPage = () => {
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

export default AboutPage;