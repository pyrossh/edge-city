import { useState, useEffect } from 'react';

export const atom = (initial) => {
  let value;
  const isDerived = typeof initial === 'function';
  const subs = new Set();
  const get = (a) => {
    a.subscribe(compute);
    return a.getValue();
  };
  const compute = () => {
    value = initial(get);
    subs.forEach((sub) => {
      sub(value);
    });
  };
  if (isDerived) {
    compute();
  } else {
    value = initial;
  }
  return {
    getValue() {
      return value;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    update(fn) {
      value = fn(value);
      subs.forEach((sub) => {
        sub(value);
      });
    },
  };
};

export const useAtom = (atom) => {
  const [data, setData] = useState(atom.getValue());
  useEffect(() => {
    return atom.subscribe((value) => {
      setData(value);
    });
  }, []);
  return data;
};

export const routerAtom = atom({
  pathname: "/",
  query: {},
  params: {},
})

export const useRouter = () => useAtom(routerAtom);

export const push = () => {
}

export const replace = () => {
}

export const prefetch = () => {
}

export const beforePopState = () => {
}

export const back = () => {
}

export const reload = () => window.location.reload()