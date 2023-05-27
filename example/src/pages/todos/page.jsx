import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation } from "edge-city";
import { useForm } from 'react-hook-form';
import Todo from "@/components/Todo/Todo";
import { TextField, Label, Input } from 'react-aria-components';
import { Button } from 'react-aria-components';
import { getTodos, createTodo } from "@/services/todos.service";
import "./page.css";

const Page = () => {
  const { data, refetch } = useQuery("todos", () => getTodos());
  const { mutate, isMutating, err } = useMutation(async ({ text }) => {
    await createTodo({
      text,
      completed: false,
    })
    await refetch();
  });
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <div>
      <h1>Todos</h1>
      <Helmet>
        <title>Todos</title>
      </Helmet>
      <div>
        <ul>
          {data.map((item) => (
            <Todo key={item.id} todo={item} />
          ))}
        </ul>
        <form onSubmit={handleSubmit(mutate)}>
          <TextField isRequired isReadOnly={isMutating}>
            <Label>Text (required)</Label>
            <Input {...register('text')} />
            {err?.text && <p>{err.text._errors[0]}</p>}
          </TextField>
          <Button type="submit" isDisabled={isMutating}>Add Todo</Button>
          {isMutating && <div>
            <p>Creating...</p>
          </div>}
        </form>
      </div>
    </div>
  )
}

export default Page;