import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Helmet } from "react-helmet-async";
import { cache, useMutation } from "edge-city";
import { useForm } from "react-hook-form";
import { Button, TextField, Input } from "react-aria-components";
import Spinner from "@/components/Spinner/Spinner";
import TodoList from "./TodoList";
import { createTodo } from "@/services/todos.service";
import "./page.css";

export default function Page() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const { mutate, isMutating, err } = useMutation(async ({ text }) => {
    await createTodo({
      text,
      completed: false,
    });
    await cache.invalidate("todos");
    reset();
  });
  return (
    <div className="todos-page">
      <h1 className="title">Todo List</h1>
      <Helmet>
        <title>Todo List</title>
      </Helmet>
      <div className="container">
        <p className="subtitle">Share this page to collaborate with others.</p>
        <form onSubmit={handleSubmit(mutate)}>
          <TextField isRequired isReadOnly={isMutating} aria-label="add-todo">
            <Input {...register("text")} placeholder="Add a todo item" />
            {err?.text && <p>{err.text._errors[0]}</p>}
          </TextField>
          <Button className="add-button" type="submit" isDisabled={isMutating}>
            Add
          </Button>
        </form>
        <ErrorBoundary onError={(err) => console.log("err", err)} fallback={<p>Oops something went wrong</p>}>
          <Suspense fallback={<Spinner />}>
            <TodoList isMutating={isMutating} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
