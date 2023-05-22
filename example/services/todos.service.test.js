import { createSchema } from "./todos.service";

test("validate createSchema", () => {
  expect(createSchema.safeParse({}).error.issues).toEqual([
    {
      "code": "invalid_type",
      "expected": "string",
      "message": "Required",
      "path": [
        "text"
      ],
      "received": "undefined"
    },
    {
      "code": "invalid_type",
      "expected": "boolean",
      "message": "Required",
      "path": [
        "completed"
      ],
      "received": "undefined"
    }
  ])
  expect(createSchema.safeParse({
    text: '',
    completed: true,
  }).error.issues).toEqual([
    {
      "code": "too_small",
      "exact": false,
      "inclusive": true,
      "message": "please enter some text",
      "minimum": 1,
      "path": [
        "text"
      ],
      "type": "string"
    },
  ])
})