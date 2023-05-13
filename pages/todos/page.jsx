import React, { Suspense } from 'react';
import TodoList from "@/containers/TodoList/TodoList";
import { Helmet } from 'react-helmet-async';
import "./page.css";

const Page = () => {
  return (
    <div>
      <h1>Todos</h1>
      <Helmet>
        <title>Todos Page</title>
      </Helmet>
      <Suspense fallback={<p>Loading...</p>}>
        <TodoList />
      </Suspense>
    </div>
  )
}

export default Page;