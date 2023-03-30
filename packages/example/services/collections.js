const getCollection = (name) => {
  let items = [];
  return {
    findMany: () => {
      return {
        toArray: async () => {
          await new Promise((res) => setTimeout(res, 500));
          return items;
        }
      }
    },
    findOne: ({ filter }) => {
      return items.find((item) => item.id === filter.id)
    },
    insertOne: (item) => {
      items.push(item);
      return item;
    },
    insertOrReplaceOne: (item) => {
      const index = items.findIndex((it) => it.id === item.id);
      if (index) {
        items[index] = item;
      } else {
        items.push(item);
      }
      return item;
    },
    deleteOne: ({ filter }) => {
      items = items.filter((item) => item.id !== filter.id);
      return { id: filter.id }
    },
  }
}

export const todosCollection = getCollection("todos");