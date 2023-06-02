import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField, Input } from "react-aria-components";
import { cache, useMutation } from "edge-city/data";
import { updateTodo, deleteTodo } from "@/services/todos.service";
import "./Todo.css";

const Todo = ({ item }) => {
  const [editing, setEditing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
  } = useForm();
  const updateMutation = useMutation(async ({ text }) => {
    await updateTodo({ id: item.id, text, completed: item.completed });
    await cache.invalidate("todos", false);
    setEditing(false);
  });
  const deleteMutation = useMutation(async (id) => {
    await deleteTodo(id);
    await cache.invalidate("todos", false);
  });
  return (
    <li className="todo" style={{ opacity: deleteMutation.isMutating || updateMutation.isMutating ? 0.5 : 1 }}>
      {!editing && (
        <>
          <input type="checkbox" />
          <div className="text">
            <p>{item.text}</p>
            <p className="timestamp">{item.createdAt}</p>
          </div>
          <button className="edit-button" title="Edit" onClick={() => setEditing(true)}>
            ✏️
          </button>
          <button className="delete-button" title="Delete" onClick={() => deleteMutation.mutate(item.id)}>
            🗑️
          </button>
        </>
      )}
      {editing && (
        <form onSubmit={handleSubmit(updateMutation.mutate)}>
          <TextField isRequired isReadOnly={updateMutation.isMutating} isDisabled={updateMutation.isMutating}>
            <Input {...register("text")} defaultValue={item.text} />
            {/* {err?.text && <p>{err.text._errors[0]}</p>} */}
          </TextField>
          <button
            type="submit"
            className="edit-button"
            title="Save"
            disabled={updateMutation.isMutating}
          >
            💾
          </button>
          <button
            className="delete-button"
            title="Cancel"
            onClick={() => {
              reset({ text: item.text });
              setEditing(false);
            }}
            disabled={updateMutation.isMutating}
          >
            🚫
          </button>
        </form>
      )}
    </li>
  );
};

export default Todo;
