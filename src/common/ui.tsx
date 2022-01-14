import React from "react";
import {
  GuessResult,
  getDeadLetters,
  getYellowLetters,
  getGreenLetters,
} from "./utils";

export const WHITE = "rgb(215, 218, 220)";
export const YELLOW = "rgb(181, 159, 59)";
export const GREEN = "rgb(83, 141, 78)";
export const DARK_GREY = "rgb(58, 58, 60)";
export const LIGHT_GREY = "rgb(129, 131, 132)";

export function TitleBar({ title }: { title: string }) {
  return (
    <div
      style={{
        fontWeight: "bold",
        fontSize: 36,
        borderBottom: `1px solid ${DARK_GREY}`,
        marginBottom: 2,
        fontKerning: "auto",
        position: "relative",
      }}>
      {title.toUpperCase()}
    </div>
  );
}

export function GuessResultRow({
  gr,
  onChange,
}: {
  onChange?: (newGr: GuessResult) => void;
  gr: GuessResult;
}) {
  const { guess, result } = gr;
  return (
    <div style={{ display: "flex", flexShrink: 1 }}>
      {result.map((r, index) => {
        let color: string | undefined = undefined;
        let border = DARK_GREY;
        if (r === "Correct") {
          color = border = GREEN;
        }
        if (r === "WrongLocation") {
          color = border = YELLOW;
        }
        if (r === "WrongLetter") {
          color = border = DARK_GREY;
        }
        return (
          <div
            key={index}
            style={{
              height: 60,
              width: 60,
              display: "flex",
              justifyContent: "center",
              flexShrink: 1,
              alignItems: "center",
              textAlign: "center",
              margin: 2,
              border: `2px solid ${border}`,
              background: color,
              fontWeight: "bold",
              fontSize: 32,
              flex: "auto",
            }}
            onClick={() => {
              if (r == "Correct") {
                let newResult = [...result];
                newResult[index] = "WrongLetter";
                onChange?.({ guess, result: newResult });
              } else if (r == "WrongLetter") {
                let newResult = [...result];
                newResult[index] = "WrongLocation";
                onChange?.({ guess, result: newResult });
              } else if (r == "WrongLocation") {
                let newResult = [...result];
                newResult[index] = "Correct";
                onChange?.({ guess, result: newResult });
              }
            }}>
            {guess[index]?.toUpperCase()}
          </div>
        );
      })}
    </div>
  );
}

export function GuessResults({
  guesses,
  onChange,
}: {
  guesses: GuessResult[];
  onChange?: (newGuesses: GuessResult[]) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: "auto",
        justifyContent: "center",
        minHeight: "100%",
      }}>
      {guesses.map((gr, index) => (
        <GuessResultRow
          key={index}
          gr={gr}
          onChange={
            onChange
              ? (newGuess) => {
                  const newGuesses = [...guesses];
                  newGuesses[index] = newGuess;
                  onChange(newGuesses);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

const keys = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["ENTER", "z", "x", "c", "v", "b", "n", "m", "DELETE"],
];

export function Keyboard({
  guesses,
  onKey,
}: {
  guesses: GuessResult[];
  onKey: (key: string) => void;
}) {
  const deadLetters = getDeadLetters(guesses);
  const yellowLetters = getYellowLetters(guesses);
  const greenLetters = getGreenLetters(guesses);

  return (
    <div>
      {keys.map((row, rowKey) => (
        <div key={rowKey} style={{ display: "flex", justifyContent: "center" }}>
          {row.map((key) => {
            let color = LIGHT_GREY;
            if (deadLetters.has(key)) color = DARK_GREY;
            if (yellowLetters.has(key)) color = YELLOW;
            if (greenLetters.has(key)) color = GREEN;

            const isSpecialKey = key == "ENTER" || key == "DELETE";
            let extras: React.CSSProperties = {};
            if (isSpecialKey) {
              extras = {
                flex: "auto",
                justifyContent: "center",
                textAlign: "center",
                alignItems: "center",
                display: "flex",
                padding: 0,
                maxWidth: 80,
              };
            }
            return (
              <button
                id={isSpecialKey ? `keyboard_${key}` : undefined}
                onClick={() => onKey(key)}
                key={key}
                style={{
                  color: WHITE,
                  border: "none",
                  background: color,
                  margin: 6,
                  padding: "20px 5px",
                  borderRadius: 4,
                  fontWeight: "bold",
                  cursor: "pointer",
                  maxWidth: 25,
                  flex: "auto",
                  justifyContent: "center",
                  textAlign: "center",
                  alignItems: "center",
                  display: "flex",
                  ...extras,
                }}>
                {key.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const Dialog: React.FC = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.6)",
      }}>
      <div
        style={{
          background: DARK_GREY,
          padding: "40px 20px",
        }}>
        {children}
      </div>
    </div>
  );
};
