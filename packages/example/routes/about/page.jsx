import React from 'react';
import { useRouter } from "parotta/router";
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
    </div>
  )
}

export default AboutPage;