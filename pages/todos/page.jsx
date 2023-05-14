import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useRpc } from "parotta/runtime";
import Todo from "@/components/Todo/Todo";
import { getTodos } from "@/services/todos.service";
import Layout from '@/components/Layout/Layout';
import "./page.css";

const TodoList = () => {
  const { data } = useRpc(getTodos, {});
  return (
    <ul>
      {data.map((item) => (
        <Todo key={item.id} todo={item} />
      ))}
    </ul>
  )
}

const Page = () => {
  return (
    <Layout>
      <h1>Todos</h1>
      <Helmet>
        <title>Todos Page</title>
      </Helmet>
      <div>
        <Suspense fallback="Loading...">
          <TodoList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default Page;