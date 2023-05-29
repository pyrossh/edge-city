import { useState, useCallback } from "react";

const Todo = ({ item, updateMutation, deleteMutation }) => {
  const [editing, setEditing] = useState(false);
  const doSave = useCallback(() => {
    if (!input.current) return;
    setBusy(true);
    save(item, input.current.value, item.completed);
  }, [item]);
  const cancelEdit = useCallback(() => {
    if (!input.current) return;
    setEditing(false);
    input.current.value = item.text;
  }, []);
  const doDelete = useCallback(() => {
    const yes = confirm("Are you sure you want to delete this item?");
    if (!yes) return;
    setBusy(true);
    save(item, null, item.completed);
  }, [item]);
  const doSaveCompleted = useCallback(
    (completed) => {
      setBusy(true);
      save(item, item.text, completed);
    },
    [item],
  );
  return (
    <li className="todo">
      {!editing && (
        <>
          <input type="checkbox" />
          <div class="text">
            <p>{item.text}</p>
            <p className="timestamp">{item.createdAt}</p>
          </div>
          <button className="edit-button" title="Edit">
            ✏️
          </button>
          <button class="delete-button" title="Delete">
            🗑️
          </button>
        </>
      )}
      {editing && (
        <>
          <input class="border rounded w-full py-2 px-3 mr-4" defaultValue={item.text} />
          <button
            class="p-2 rounded mr-2 disabled:opacity-50"
            title="Save"
            onClick={doSave}
            disabled={busy}
          >
            💾
          </button>
          <button
            class="p-2 rounded disabled:opacity-50"
            title="Cancel"
            onClick={cancelEdit}
            disabled={busy}
          >
            🚫
          </button>
        </>
      )}
    </li>
  );
};

export default Todo;

// .todo {
//   display: flex;
//   border-bottom-width: 1px;
//   border-color: #d1d5db;
//   align-items: center;
//   height: 4rem;
//   margin-bottom: 0.5rem;
//   margin-top: 0.5rem;

//   & .text {
//     display: flex;
//     flex: 1;
//     flex-direction: column;
//     font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
//       "Courier New", monospace;
//     margin-left: 0.5rem;
//   }

//   & .timestamp {
//     line-height: 2;
//     opacity: 0.5;
//     font-size: 0.75rem;
//   }

//   & .edit-button {
//     padding: 0.5rem;
//     margin-right: 0.5rem;
//   }

//   & .delete-button {
//     padding: 0.5rem;
//   }
// }
