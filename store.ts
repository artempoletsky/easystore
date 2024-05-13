"use client";
import React, { Context, Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from "react";

export const StoreContexts: Record<string, Context<any>> = {};
const StoreStates: Record<string, any> = {};
export const StoreDispatchers: Record<string, Dispatch<SetStateAction<any>>> = {};
const StoreListeners: Record<string, ((arg: any) => void)[]> = {};
export const DispatcherProxies: Record<string, (arg: any) => void> = {};
const StoreInitial: Record<string, any> = {};

let InitializationEffect: (() => void) | undefined = undefined;

export function createStore<Type extends Record<string, any>>(initial: Type, effect?: () => void): Type {
  for (const key in initial) {
    StoreContexts[key] = createContext(initial[key]);
    StoreInitial[key] = initial[key];
  }
  InitializationEffect = effect;
  return new Proxy({}, {
    get(target, key: string) {
      return StoreStates[key];
    },
    set(target, key: string, value: any) {
      DispatcherProxies[key](value);
      return true;
    },
  }) as Type;
}

type ChildrenProps = {
  children?: ReactNode;
}

type KeyProviderProps = ChildrenProps & {
  keys: string[];
}

export function useStoreUntyped
  <StoreType, KeyT extends keyof StoreType & string>
  (key: KeyT): [StoreType[KeyT], Dispatch<SetStateAction<StoreType[KeyT]>>] {
  return [useContext(StoreContexts[key]), DispatcherProxies[key]];
}

export function addChangeListener<StoreType, KeyT extends keyof StoreType & string>(key: KeyT, cb: (value: StoreType[KeyT]) => void) {
  let listeners = StoreListeners[key];
  if (!listeners) {
    listeners = StoreListeners[key] = [];
  }
  listeners.push(cb);
}

export function removeChangeListener<StoreType, KeyT extends keyof StoreType & string>(key: KeyT, cb: (value: StoreType[KeyT]) => void) {
  let listeners = StoreListeners[key];
  if (!listeners) return;
  StoreListeners[key] = listeners.filter(fn => fn != cb);
}

function triggerChangeListeners(key: string, value: any) {
  let listeners = StoreListeners[key];
  if (!listeners) return;
  for (const cb of listeners) {
    cb(value);
  }
}

function KeyProvider({ children, keys }: KeyProviderProps): React.ReactNode {
  const key = keys.pop();
  if (!key) return children;
  const [value, dispatch] = useState(StoreInitial[key]);

  StoreStates[key] = value;
  StoreDispatchers[key] = dispatch;

  const proxy = (args: any) => {
    triggerChangeListeners(key, args);
    dispatch(args);
  }

  DispatcherProxies[key] = proxy;
  return React.createElement(StoreContexts[key].Provider, {
    value,
  }, KeyProvider({ children, keys }));
}

export const StoreProvider: React.FC<{ children: any }> = function StoreProvider({ children }: ChildrenProps) {
  if (InitializationEffect) {
    useEffect(InitializationEffect, []);
  }
  return KeyProvider({ children, keys: Object.keys(StoreContexts) });
}

