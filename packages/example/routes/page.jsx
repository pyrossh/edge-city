import React, { useEffect } from 'react';
import { useRouter } from "parotta/router";
import { useFetch } from "parotta/fetch";
import Counter from "@/components/Counter/Counter";
import "./page.css";

export const Head = () => {
  return (
    <title>Parotta</title>
  )
}

export const Body = () => {
  const router = useRouter();
  const { data, cache } = useFetch("/todos");
  console.log('page');
  console.log('data', data);
  useEffect(() => {
    setTimeout(() => {
      cache.invalidate(/todos/);
    }, 3000)
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