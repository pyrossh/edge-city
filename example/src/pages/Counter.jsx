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

let newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
let ruleClean = /\/\*[^]*?\*\/|  +/g;
let ruleNewline = /\n+/g;
let empty = ' ';

/**
 * Convert a css style string into a object
 * @param {String} val
 * @returns {Object}
 */
export let astish = (val) => {
  let tree = [{}];
  let block, left;

  while ((block = newRule.exec(val.replace(ruleClean, '')))) {
    // Remove the current entry
    if (block[4]) {
      tree.shift();
    } else if (block[3]) {
      left = block[3].replace(ruleNewline, empty).trim();
      tree.unshift((tree[0][left] = tree[0][left] || {}));
    } else {
      tree[0][block[1]] = block[2].replace(ruleNewline, empty).trim();
    }
  }

  return tree[0];
};

const ActionButton = styled(Button, astish(`
  background: purple;
  border: 1px solid black;
`));

console.log(JSON.stringify(astish(`
background: purple;
border: 1px solid black;
`)))

// color: 'white',
//   background: "purple",
//   border: "1px solid black",
//   borderRadius: "4px",
//   appearance: "none",
//   verticalAlign: "middle",
//   fontSize: "1.2rem",
//   textAlign: "center",
//   margin: 0,
//   outline: "none",
//   padding: "4px 12px",
//   borderRadius: "0.25rem",
//   marginLeft: "0.5rem",
//   "&[data-pressed]": {
//     backgroundColor: "white",
//     color: 'black',
//   }