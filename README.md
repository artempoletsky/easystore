
## About The Project

EasyStore is a react library for creating a global APP state and share it between components.

## Installation

```console
npm install --save @artempoletsky/easystore
```

## Usage

Create somwhere in your project file `store.ts`:

```typescript
// store.ts
"use client";
import { useStoreUntyped, createStore } from "@artempoletsky/easystore";

// Add here variables you want to make global
export type Store = {
  myFirstVar: string;
  mySecondVar: number;
};

createStore<Store>({
  myFirstVar: "",
  mySecondVar: 0,
});

export function useStore<KeyT extends keyof Store>(key: KeyT) {
  return useStoreUntyped<Store, KeyT>(key);
}
```

Import this file in your root component with the `StoreProvider`.
```tsx
// layout.tsx
...
import "./store";
import { StoreProvider } from "@artempoletsky/easystore";
...
```

Wrap your page with the `StoreProvider` component.
```tsx
// layout.tsx
...
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <StoreProvider>
          <Header />
          {children}
          <Footer />
        </StoreProvider>    
      </body>
    </html>
  )
}
```

Use your variables just like you use the `useState` React hook.
```tsx
// somewhere.tsx
...
import { useStore } from "../../store";

export default function MyCounter() {
  const [count, setCount] = useStore("mySecondVar");
  const increment = (value: number) => value + 1;
  return (
    <div>
      <div>Count: {count}</div>
      <button onClick={() => setCount(increment)}>Increment</button>
    </div>
  )
}
```