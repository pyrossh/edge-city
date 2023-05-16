import React, { Suspense, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useRpc } from "parotta/runtime";
import Todo from "@/components/Todo/Todo";
import { TextField, Label, Input } from 'react-aria-components';
import { Button } from 'react-aria-components';
import { getTodos, createTodo } from "@/services/todos.service";
import Layout from '@/components/Layout/Layout';
import "./page.css";

const TodoList = () => {
  const { data, isRefetching, refetch } = useRpc(getTodos, {});
  const [text, setText] = useState();
  const onSubmit = async () => {
    await createTodo({
      text,
      completed: false,
      createdAt: new Date(),
    })
    await refetch();
  }
  return (
    <div>
      <ul>
        {data.map((item) => (
          <Todo key={item.id} todo={item} />
        ))}
        {isRefetching && <div>
          <p>Refetching...</p>
        </div>}
      </ul>
      <div>
        <TextField isRequired>
          <Label>Text (required)</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </TextField>
        <Button onPress={onSubmit}>Add Todo</Button>
      </div>
    </div>
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