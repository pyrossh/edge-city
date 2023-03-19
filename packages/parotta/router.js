import { signal, useSignal } from "@preact/signals-react";

export const routerSignal = signal({
  pathname: "/",
  query: {},
  params: {},
});

export const useRouter = () => useSignal(routerSignal);

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