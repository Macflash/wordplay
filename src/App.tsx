import React from "react";
import "./App.css";
import { AbsolutePositionButton, WHITE } from "./common/ui";
import { Game } from "./gameModes/game";
import { Solver } from "./gameModes/solver";
import { Utils } from "./gameModes/utils";

type Mode = "game" | "solver" | "utils";

function App() {
  const [mode, setMode] = React.useState<Mode>("game");

  let content = <Game />;
  if (mode === "solver") content = <Solver />;
  if (mode === "utils") content = <Utils />;

  return (
    <div style={{ height: "100%", width: "100%", color: WHITE }}>
      {content}
      <AbsolutePositionButton
        left={20}
        text={mode === "game" ? "Solver" : "Play"}
        onClick={() => {
          if (mode === "game") {
            setMode("solver");
          } else {
            setMode("game");
          }
        }}
      />
    </div>
  );
}

export default App;
