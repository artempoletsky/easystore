"use client";
import React, { Context, Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from "react";

export const StoreContexts: Record<string, Context<any>> = {};
const StoreStates: Record<string, any> = {};
export const StoreDispatchers: Record<string, Dispatch<SetStateAction<any>>> = {};
const StoreListeners: Record<string, ((arg: any) => void)[]> = {};
export const DispatcherProxies: Record<string, (arg: any) => void> = {};
const StoreInitial: Record<string, any> = {};
const StorageMappings: StorageOptionsMappings<any> = {};

let InitializationEffect: (() => void) | undefined = undefined;

export type StorageOptionsMappings<Type extends Record<string, any>> = {
  [P in keyof Type]?: boolean | ((stored: any) => Type[P]);
}

export type StorageOptionsListeners<Type extends Record<string, any>> = {
  [P in keyof Type]?: ((value: Type[P]) => void);
}


export type StoreOptions<Type extends Record<string, any>> = {
  initialValues: Type;
  storageMappings?: StorageOptionsMappings<Type>;
  useEffect?: () => void;
  onChange?: StorageOptionsListeners<Type>;
}



function createStore<Type extends Record<string, any>>(options: StoreOptions<Type>): Type
/**
 * @deprecated
 * @param initial 
 * @param effect 
 * @returns 
 */
function createStore<Type extends Record<string, any>>(initial: Type, effect?: () => void): Type
function createStore<Type extends Record<string, any>>(arg1: any, arg2?: any): Type {
  let options: StoreOptions<Type>;
  if (arg1.initialValues) {
    options = arg1;
  } else {
    options = {
      useEffect: arg2,
      initialValues: arg1,
    };
  }

  const initial = options.initialValues;

  for (const key in initial) {
    StoreContexts[key] = createContext(initial[key]);
    StoreInitial[key] = initial[key];
  }

  InitializationEffect = options.useEffect;

  if (options.onChange) {
    for (const key in options.onChange) {
      addChangeListener(key, options.onChange[key]!);
    }
  }

  Object.assign(StorageMappings, options.storageMappings);

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

export { createStore };

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

function getInitialValue(key: string) {
  const mapping = StorageMappings[key];
  if (!mapping) return StoreInitial[key];
  
  if (!global.localStorage) return StoreInitial[key];

  if (!(key in localStorage)) {
    localStorage[key] = JSON.stringify(StoreInitial[key]);
    return StoreInitial[key];
  }

  if (mapping === true) {
    return JSON.parse(localStorage[key]);
  }

  return mapping(JSON.parse(localStorage[key]));
}

function KeyProvider({ children, keys }: KeyProviderProps): React.ReactNode {
  const key = keys.pop();
  if (!key) return children;
  const [value, dispatch] = useState(getInitialValue(key));

  StoreStates[key] = value;
  StoreDispatchers[key] = dispatch;

  const proxy = (args: any) => {
    if (StorageMappings[key]) {
      localStorage[key] = JSON.stringify(args);
    }
    triggerChangeListeners(key, args);
    dispatch(args);
  }

  DispatcherProxies[key] = proxy;
  return React.createElement(StoreContexts[key].Provider, {
    value,
  }, KeyProvider({ children, keys }));
}


export const StoreProvider: React.FC<{ children: any, }> = function StoreProvider({ children }: ChildrenProps) {
  if (InitializationEffect) {
    useEffect(InitializationEffect, []);
  }
  return KeyProvider({ children, keys: Object.keys(StoreContexts) });
}

