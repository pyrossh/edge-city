import React from 'react';
import useSWR from "swr";
import { Link, useRouter } from "parotta/router";
import Counter from "@/components/Counter/Counter";
import "./page.css";

const HomePage = () => {
  // const todo = useAsync('123', () => getData());
  const { data } = useSWR(`https://jsonplaceholder.typicode.com/todos/1`);
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

export default HomePage;