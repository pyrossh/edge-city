import React from 'react';
import { useRouter } from "edge-city";
import Counter from "@/components/Counter/Counter";
import { Helmet } from 'react-helmet-async';
import "./page.css";

export default function Page() {
  const router = useRouter();
  return (
    <div>
      <Helmet>
        <title>Edge City</title>
      </Helmet>
      <div className="home-page">
        <h1>Home Page</h1>
        <p>
          Path: {router.pathname}
        </p>
        <Counter />
      </div>
    </div>
  )
};