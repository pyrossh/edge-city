import React from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "edge-city";
import { useForm } from "react-hook-form";
import { Button, TextField, Input } from "react-aria-components";
import Todo from "@/pages/todos/Todo";
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/services/todos.service";
import "./page.css";

export default function Page() {
  const { data, refetch } = useQuery("todos", () => getTodos());
  const { mutate, isMutating, err } = useMutation(async ({ text }) => {
    await createTodo({
      text,
      completed: false,
    });
    await refetch();
  });
  const updateMutation = useMutation(async ({ text, completed }) => {
    await updateTodo({ text, completed });
    await refetch();
  });
  const deleteMutation = useMutation(async (id) => {
    await deleteTodo(id);
    await refetch();
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  return (
    <div className="todos-page">
      <h1 className="title">Todo List</h1>
      <Helmet>
        <title>Todo List</title>
      </Helmet>
      <div className="container">
        <p className="subtitle">Share this page to collaborate with others.</p>
        <form onSubmit={handleSubmit(mutate)}>
          <TextField isRequired isReadOnly={isMutating}>
            <Input {...register("text")} placeholder="Add a todo item" />
            {err?.text && <p>{err.text._errors[0]}</p>}
          </TextField>
          <Button className="add-button" type="submit" isDisabled={isMutating}>
            Add
          </Button>
        </form>
        <ul>
          {data.map((item) => (
            <Todo
              key={item.id}
              item={item}
              updateMutation={updateMutation}
              deleteMutation={deleteMutation}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
