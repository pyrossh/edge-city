import React from 'react';

const Todo = ({ id, text }) => {
  return (
    <div id={id}>
      <p>
        {text}
      </p>
    </div>
  )
}

export default Todo;
