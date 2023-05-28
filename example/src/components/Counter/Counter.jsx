import React, { useState } from "react";
import { Button } from "react-aria-components";
import { styled } from '@/theme';

export default function Counter() {
  const [count, setCount] = useState(5);
  const increment = () => setCount(count - 1);
  const decrement = () => setCount(count + 1);
  return (
    <div className="counter">
      <ActionButton onPress={increment}>
        -
      </ActionButton>
      <span className="count">{count}</span>
      <ActionButton onPress={decrement}>
        +
      </ActionButton>
    </div>
  );
};

const ActionButton = styled(Button, {
  color: 'white',
  background: "purple",
  border: "1px solid black",
  borderRadius: "4px",
  appearance: "none",
  verticalAlign: "middle",
  fontSize: "1.2rem",
  textAlign: "center",
  margin: 0,
  outline: "none",
  padding: "4px 12px",
  borderRadius: "0.25rem",
  marginLeft: "0.5rem",
  "&[data-pressed]": {
    backgroundColor: "white",
    color: 'black',
  }
});