import React from 'react';
import { Link, useRouter } from "parotta/runtime";
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout/Layout';
import "./page.css";

export const Page = () => {
  const router = useRouter();
  return (
    <Layout>
      <div className="about-page">
        <Helmet>
          <title>About Page @ {router.pathname}</title>
          <meta name="description" content="Showcase of using parotta meta-framework." />
        </Helmet>
        <div>
          <h1>About Page @ {router.pathname}</h1>
          <p>Showcase of using parotta meta-framework.</p>
        </div>
        <footer>
          <Link href="/">Back</Link>
        </footer>
      </div>
    </Layout>
  )
}

export default Page;