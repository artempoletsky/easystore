
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

// set up the store with initial values
createStore<Store>({
  initialValues: {
    myFirstVar: "",
    mySecondVar: 0,
  }
});

// create a hook with your store type
export function useStore<KeyT extends keyof Store>(key: KeyT) {
  return useStoreUntyped<Store, KeyT>(key);
}
```

Import `StoreProvider` to your root component.
```tsx
// layout.tsx
...
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
// Component.tsx
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

## Advanced features 

```typescript 
// store.ts

const Store = createStore<Store>({
  initialValues: {
    myFirstVar: "",
    mySecondVar: 0,
  },
  useEffect(){ // this is a useEffect function that runs in the StoreProvider component
    fetch(...).then(data => {
      Store.myFirstVar = data; // initialize the store value from the API
    });
  },
  storeMappings: {
    myFirstVar: true, // myFirstVar will be stored in localStorage 
    // and keep it's state when you refresh the page
  },
  onChange: {
    myFirstVar(value: string) {
      // will be called on myFirstVar change 
    }
  }
});
// Store is a proxy object that have the type Store 
```

Alternatively you can add and remove event listeners this way:
```typescript
import { addChangeListener, removeChangeListener } from "@artempoletsky/easystore";

const onMyFirstVarChange = (myFirstVar: string) => {
  // will be called on myFirstVar change 
}

// subscribe to the variable changes
addChangeListener<Store, "myFirstVar">("myFirstVar", onMyFirstVarChange);

 // unsubscribe
removeChangeListener<Store, "myFirstVar">("myFirstVar", onMyFirstVarChange);

// Store.someVar = someValue; // triggers the events
```

```tsx
// Component.tsx

...
const [myVar, setMyVar] = useStore("myVar");  
setMyVar(value); // triggers the events
...
```


You can store as well instances of a custom class which can't be directly placed in localStorage.

In this case you have to implement toJSON method and optionally fromJSON method. 

```typescript
class Dog {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  bark() {
    console.log("The dog says:", this.name);
  }

  toJSON() { // localStorage["dog"] = JSON.stringify(dog.toJSON())
    return this.name;
  }
}

const Store = createStore<Store>({
  initialValues: {
    dog: new Dog("Dogmeat"),
  },
  useEffect(){
    Store.dog.bark(); // logs to the console
  },
  storageMappings: {
    dog(name: string) {// name == JSON.parse(localStorage["dog"])
      return new Dog(name);
    },
  },
});
```

With fromJSON method:
```typescript
class Dog {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  bark() {
    console.log("The dog says:", this.name);
  }

  toJSON() {
    return this.name;
  }

  static fromJSON(name: string){
    return new Dog(name);
  }
}

const Store = createStore<Store>({
  initialValues: {
    dog: new Dog("Dogmeat"),
  },
  useEffect() {
    Store.dog.bark(); // logs to the console
  },
  storageMappings: {
    dog: Dog.fromJSON,
  },
});
```
