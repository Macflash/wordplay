import React from "react";

type Listener = (this: Window, ev: KeyboardEvent) => void;

const oldHandlers: Listener[] = [];

export function useKeyDown(keyHandler: (key: string) => void) {
  React.useEffect(() => {
    for (const handler of oldHandlers) {
      window.removeEventListener("keydown", handler);
    }

    const newListener: Listener = (ev) => {
      keyHandler(ev.key);
    };

    oldHandlers.push(newListener);
    window.addEventListener("keydown", newListener);
  }, [keyHandler]);
}
