import React from 'react';
import { Link, useRouter } from "edge-city";
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout/Layout';
import "./page.css";

export const Page = () => {
  const router = useRouter();
  return (
    <Layout>
      <div className="about-page">
        <Helmet>
          <title>About | Edge City</title>
          <meta name="description" content="Showcase of using edge-city meta-framework." />
        </Helmet>
        <div>
          <h1>About Page</h1>
          <p>
            Path: {router.pathname}
          </p>
          <p>Showcase of using edge-city meta-framework.</p>
        </div>
        <footer>
          <Link href="/">Back</Link>
        </footer>
      </div>
    </Layout>
  )
}

export default Page;
