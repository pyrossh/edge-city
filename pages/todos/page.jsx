import React, { Suspense, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation } from "parotta/runtime";
import Todo from "@/components/Todo/Todo";
import { TextField, Label, Input } from 'react-aria-components';
import { Button } from 'react-aria-components';
import { getTodos, createTodo } from "@/services/todos.service";
import Layout from '@/components/Layout/Layout';
import "./page.css";

const TodoList = () => {
  const { data, refetch } = useQuery(getTodos, {});
  const { mutate, isMutating } = useMutation(async () => {
    await createTodo({
      text,
      completed: false,
      createdAt: new Date(),
    })
    await refetch();
  });
  const [text, setText] = useState();
  return (
    <div>
      <ul>
        {data.map((item) => (
          <Todo key={item.id} todo={item} />
        ))}
      </ul>
      <div>
        <TextField isRequired isReadOnly={isMutating}>
          <Label>Text (required)</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </TextField>
        <Button onPress={mutate} isDisabled={isMutating}>Add Todo</Button>
        {isMutating && <div>
          <p>Creating...</p>
        </div>}
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