import React, { useEffect } from 'react';
import { Link, useRouter, useFetch } from "parotta/router";
import Counter from "@/components/Counter/Counter";
import "./page.css";

export function Head() {
  const { data } = useFetch("/todos");
  return (
    <title>Parotta</title>
  )
}

export default function Page() {
  const { data, cache } = useFetch("/todos");
  console.log('page');
  console.log('data', data);
  // useEffect(() => {
  //   setTimeout(() => {
  //     cache.invalidate(/todos/);
  //   }, 3000)
  // }, [])
  const router = useRouter();
  return (
    <div className="home-page">
      <div>
        <h1>Home Page</h1>
        <p>
          Path: {router.pathname}
        </p>
        <Counter />
      </div>
      <footer>
        <Link href="/about">About us</Link>
      </footer>
    </div>
  )
}