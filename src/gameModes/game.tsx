import React from "react";
import {
  DARK_GREY,
  GREEN,
  YELLOW,
  LIGHT_GREY,
  WHITE,
  GuessResultRow,
  Keyboard,
  TitleBar,
  GuessResults,
} from "../common/ui";
import {
  CreateGuessResult,
  getDeadLetters,
  getGreenLetters,
  getYellowLetters,
  GuessResult,
  LetterResult,
  wordify,
} from "../common/utils";

import { all_words } from "../wordlists/all_words";
import { common_words } from "../wordlists/common_words";

function createEmptyResult(length = 5) {
  let result: LetterResult[] = [];
  for (let i = 0; i < length; i++) {
    result.push("NotGuessed");
  }
  return result;
}

function createEmptyGuess(length = 5) {
  return {
    guess: "",
    result: createEmptyResult(length),
  };
}

function createEmptyGuesses(guesses = 6, wordLength = 5) {
  let result: GuessResult[] = [];
  for (let i = 0; i < guesses; i++) {
    result.push(createEmptyGuess(wordLength));
  }
  return result;
}

var handleKeyFunction = (key: string) => {};

window.addEventListener("keydown", (ev) => {
  handleKeyFunction(ev.key);
});

function pickRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}

function SimpleGame({
  words,
  word,
  onComplete,
  isComplete,
  allowedGuesses = 6,
}: {
  words: string[];
  word: string;
  onComplete: (won: boolean) => void;
  isComplete: boolean;
  allowedGuesses?: number;
}) {
  const wordLength = word.length;
  const [currentGuessIndex, setCurrentGuessIndex] = React.useState(0);
  const [guesses, setGuesses] = React.useState<GuessResult[]>(
    createEmptyGuesses(allowedGuesses, wordLength)
  );
  const currentGuess = guesses[currentGuessIndex]?.guess;

  React.useEffect(() => {
    // if our words change, or our WORD changes, we should reset everything.
    setCurrentGuessIndex(0);
    setGuesses(createEmptyGuesses(allowedGuesses, wordLength));
  }, [words, word, allowedGuesses]);

  function updateCurrentGuess(newGuess: string, result?: LetterResult[]) {
    if (isComplete) return;
    if (result) setCurrentGuessIndex(currentGuessIndex + 1);
    if (!result) result = createEmptyResult(wordLength);
    const newGuesses = [...guesses];
    newGuesses[currentGuessIndex] = { guess: newGuess, result };
    setGuesses(newGuesses);
  }

  function handleKey(key: string) {
    switch (key) {
      case "ENTER":
      case "Enter":
        if (currentGuess.length == wordLength) {
          if (currentGuess === word) {
            onComplete(true);
          } else if (!words.includes(currentGuess)) {
            alert(
              currentGuess.toUpperCase() + " was not found in our dictionary."
            );
            updateCurrentGuess("");
            return;
          }
          const { guess, result } = CreateGuessResult(
            currentGuess.toLowerCase(),
            word
          );
          updateCurrentGuess(guess, result);
        }
        break;
      case "DELETE":
      case "Backspace":
        if (currentGuess.length > 0) {
          updateCurrentGuess(
            currentGuess.substring(0, currentGuess.length - 1)
          );
        }
        break;
      default:
        if (key.length > 1 || !/^[a-z]+$/i.test(key)) {
          return;
        }
        if (currentGuess.length < wordLength) {
          updateCurrentGuess(currentGuess + key);
        }
    }
  }

  handleKeyFunction = handleKey;

  return (
    <>
      <div
        style={{
          flex: "auto",
          overflowY: "auto",
        }}>
        <GuessResults guesses={guesses} />
      </div>
      <Keyboard guesses={guesses} onKey={handleKey} />
    </>
  );
}

export function Game() {
  const [showSettings, setShowSettings] = React.useState(false);

  const [allowedGuesses, setAllowedGuesses] = React.useState(6);

  const [dictionary, setDictionary] = React.useState(common_words);
  const [wordLength, setWordLength] = React.useState(5);
  const words = React.useMemo(
    () => wordify(dictionary, wordLength),
    [dictionary, wordLength]
  );

  const [wordSeed, setWordSeed] = React.useState(0);
  const word = React.useMemo(() => pickRandomWord(words), [words, wordSeed]);
  const pickNewWord = React.useCallback(
    () => setWordSeed(Math.random()),
    [setWordSeed]
  );

  return (
    <div
      className='App'
      style={{
        background: "black",
        color: WHITE,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        userSelect: "none",
      }}>
      {showSettings ? (
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
            <div>
              <label>
                <input
                  type='checkbox'
                  checked={dictionary == all_words}
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setDictionary(all_words);
                    } else {
                      setDictionary(common_words);
                    }
                  }}
                />{" "}
                Use extended dictionary
              </label>
            </div>

            <div>
              <label>
                <input
                  type='number'
                  value={wordLength}
                  onChange={(ev) => {
                    const value = Number.parseInt(ev.target.value);
                    if (value > 1) {
                      // check if there are enough playable words
                      if (wordify(dictionary, value).length > 2000) {
                        setWordLength(value);
                      }
                    }
                  }}
                />{" "}
                Word length
              </label>
            </div>

            <div>Playable words: {words.length}</div>

            <div>
              <label>
                <input
                  type='number'
                  value={allowedGuesses}
                  onChange={(ev) => {
                    const value = Number.parseInt(ev.target.value);
                    if (value > 1 && value <= 15) {
                      setAllowedGuesses(value);
                    }
                  }}
                />{" "}
                Guesses
              </label>
            </div>

            <div>Difficulty: Medium</div>

            <button
              style={{
                fontSize: 24,
                color: WHITE,
                background: LIGHT_GREY,
                border: "none",
                borderRadius: 8,
                padding: "5px 15px",
                margin: 5,
              }}
              onClick={() => {
                setShowSettings(false);
              }}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          style={{
            position: "absolute",
            top: 10,
            right: 20,
            cursor: "pointer",
            zIndex: 1000,
            padding: "5px 15px",
            color: WHITE,
            fontWeight: "bold",
            fontSize: 16,
            fontKerning: "auto",
            border: "none",
            background: LIGHT_GREY,
            borderRadius: 4,
          }}
          onClick={() => {
            setShowSettings(true);
          }}>
          Customize
        </button>
      )}
      <button
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          cursor: "pointer",
          zIndex: 1000,
          padding: "5px 15px",
          color: WHITE,
          fontWeight: "bold",
          fontSize: 16,
          fontKerning: "auto",
          border: "none",
          background: LIGHT_GREY,
          borderRadius: 4,
        }}
        onClick={() => {
          pickNewWord();
        }}>
        New word
      </button>
      <TitleBar title='FIND THE WORD' />
      <SimpleGame
        word={word}
        words={words}
        allowedGuesses={allowedGuesses}
        isComplete={false}
        onComplete={(didWin) => {
          // todo: handle this!
        }}
      />
    </div>
  );
}
