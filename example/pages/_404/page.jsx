import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout/Layout';
import "./page.css";

const Page = () => {
  return (
    <Layout>
      <div className="notfound-page">
        <Helmet>
          <title>Page not found</title>
        </Helmet>
        <h1>404 - Page not found</h1>
        <div className="content">
          <h2>This page could not be found</h2>
        </div>
      </div>
    </Layout>
  )
}

export default Page;