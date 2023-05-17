import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation } from "parotta/runtime";
import { useForm } from 'react-hook-form';
import Todo from "@/components/Todo/Todo";
import { TextField, Label, Input } from 'react-aria-components';
import { Button } from 'react-aria-components';
import { getTodos, createTodo } from "@/services/todos.service";
import Layout from '@/components/Layout/Layout';
import "./page.css";

const TodoList = () => {
  const { data, refetch } = useQuery("todos", () => getTodos());
  const { mutate, isMutating } = useMutation(async ({ text }) => {
    await createTodo({
      text,
      completed: false,
      createdAt: new Date(),
    })
    await refetch();
  });
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <div>
      <ul>
        {data.map((item) => (
          <Todo key={item.id} todo={item} />
        ))}
      </ul>
      <form onSubmit={handleSubmit(mutate)}>
        <TextField isRequired isReadOnly={isMutating}>
          <Label>Text (required)</Label>
          <Input {...register('text', { required: true })} />
          {errors.text && <p>Please enter some text</p>}
        </TextField>
        <Button type="submit" isDisabled={isMutating}>Add Todo</Button>
        {isMutating && <div>
          <p>Creating...</p>
        </div>}
      </form>
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