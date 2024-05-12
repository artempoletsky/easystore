"use client";
import React, { Context, Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from "react";

const StoreContexts: Record<string, Context<any>> = {};
// const StoreStates: Record<string, any> = {};
const StoreDispatchers: Record<string, Dispatch<SetStateAction<any>>> = {};
const StoreInitial: Record<string, any> = {};
export function createStore<Type>(initial: Type) {
  for (const key in initial) {
    StoreContexts[key] = createContext(initial[key]);
    StoreInitial[key] = initial[key];
  }
}

type ChildrenProps = {
  children?: ReactNode;
}

type KeyProviderProps = ChildrenProps & {
  keys: string[];
}

export function useStoreUntyped<StoreType, KeyT extends keyof StoreType>(key: KeyT): [StoreType[KeyT], Dispatch<SetStateAction<StoreType[KeyT]>>] {
  return [useContext(StoreContexts[key as any]), StoreDispatchers[key as any]];
}


function KeyProvider({ children, keys }: KeyProviderProps): React.ReactNode {
  const key = keys.pop();
  if (!key) return children;
  const [value, dispatch] = useState(StoreInitial[key]);
  // StoreStates[key] = value;
  StoreDispatchers[key] = dispatch;
  return React.createElement(StoreContexts[key].Provider, {
    value,
  }, KeyProvider({ children, keys }));
}

export const StoreProvider: React.FC<{ children: ReactNode }> = function StoreProvider({ children }: ChildrenProps) {
  return KeyProvider({ children, keys: Object.keys(StoreContexts) });
}

