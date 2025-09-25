import { useEffect, useState } from 'react';

type Listener = () => void;

type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

type GetState<T> = () => T;

type Subscribe = (listener: Listener) => () => void;

type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: Subscribe;
};

type Selector<T, U> = (state: T) => U;

type StoreHook<T> = {
  (): T;
  <U>(selector: Selector<T, U>): U;
} & StoreApi<T>;

const identity = <T,>(value: T) => value;

export function createStore<T>(initializer: (set: SetState<T>, get: GetState<T>) => T) {
  let state: T;
  const listeners = new Set<Listener>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial, replace = false) => {
    const nextState = typeof partial === 'function' ? (partial as (state: T) => T | Partial<T>)(state) : partial;
    const shouldReplace =
      replace || typeof nextState !== 'object' || nextState === null || Array.isArray(nextState);

    const updatedState = shouldReplace
      ? (nextState as T)
      : { ...state, ...(nextState as Partial<T>) };

    if (Object.is(updatedState, state)) return;

    state = updatedState;
    listeners.forEach((listener) => listener());
  };

  const subscribe: Subscribe = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  state = initializer(setState, getState);

  const useStoreHook = (<U>(selector: Selector<T, U> = identity as Selector<T, U>) => {
    const [selectedState, setSelectedState] = useState(() => selector(state));

    useEffect(() => {
      return subscribe(() => {
        const nextSlice = selector(state);
        setSelectedState((prev) => (Object.is(prev, nextSlice) ? prev : nextSlice));
      });
    }, [selector]);

    return selectedState;
  }) as StoreHook<T>;

  useStoreHook.getState = getState;
  useStoreHook.setState = setState;
  useStoreHook.subscribe = subscribe;

  return useStoreHook;
}
