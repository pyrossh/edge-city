import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout/Layout';
import "./page.css";

const Page = () => {
  return (
    <Layout>
      <div className="err-page">
        <Helmet>
          <title>Oop's Something went wrong</title>
        </Helmet>
        <h1>Oop's Something went wrong</h1>
        <div className="content">
          <h2>Internal Server Error</h2>
        </div>
      </div>
    </Layout>
  )
}

export default Page;