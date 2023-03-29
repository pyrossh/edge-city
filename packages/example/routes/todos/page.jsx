import { Suspense } from "react";
import TodoList from "@/containers/TodoList/TodoList";

export const Head = () => {
  return (
    <title>Todos</title>
  )
}

export const Body = () => {
  return (
    <div>
      <h1>Todos</h1>
      {/* <Suspense>
        <TodoList todos={todos} />
      </Suspense> */}
    </div>
  )
}