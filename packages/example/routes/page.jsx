import React, { useEffect } from 'react';
import { useRouter } from "parotta/router";
import Counter from "@/components/Counter/Counter";
import "./page.css";

export const Head = () => {
  return (
    <title>Parotta App</title>
  )
}

export const Body = () => {
  const router = useRouter();
  useEffect(() => {

  }, []);
  return (
    <div>
      <div>
        <h1>Home Page</h1>
        <p>
          Path: {router.pathname}
        </p>
        <Counter />
      </div>
    </div>
  )
}