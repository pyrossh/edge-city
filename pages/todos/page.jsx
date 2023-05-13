import React, { Suspense } from 'react';
import TodoList from "@/containers/TodoList/TodoList";
import "./page.css";

export const Head = () => {
  return (
    <title>Todos</title>
  )
}

export const Body = () => {
  return (
    <div>
      <h1>Todos</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <TodoList />
      </Suspense>
    </div>
  )
}

