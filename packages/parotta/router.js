// import { signal, useSignal } from "@preact/signals-react";
import { createRouter } from 'radix3';
import { atom, useAtom } from "./atom.js";

export const routerAtom = atom({
  pathname: "/",
  query: {},
  params: {},
});

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