import React from "react";
import { useKeyDown } from "../common/hooks";
import {
  LIGHT_GREY,
  WHITE,
  Keyboard,
  TitleBar,
  GuessResults,
  Dialog,
  AbsolutePositionButton,
} from "../common/ui";
import {
  createEmptyGuesses,
  createEmptyResult,
  CreateGuessResult,
  GuessResult,
  LetterResult,
  pickRandomWord,
  TrimDictionary,
} from "../common/utils";
import {
  combineWordLists,
  CreateDictionary,
  Dictionary,
} from "../common/words";

function SimpleGame({
  words,
  word,
  guessableWords = words,
  onComplete,
  isComplete,
  didWin,
  allowedGuesses = 6,
  isHardMode = false,
}: {
  words: string[];
  guessableWords?: string[];
  word: string;
  onComplete: (won: boolean) => void;
  isComplete: boolean;
  didWin: boolean;
  allowedGuesses?: number;
  isHardMode?: boolean;
}) {
  const wordLength = word.length;
  const [currentGuessIndex, setCurrentGuessIndex] = React.useState(0);
  const [guesses, setGuesses] = React.useState<GuessResult[]>(
    createEmptyGuesses(allowedGuesses, wordLength)
  );
  const currentGuess = guesses[currentGuessIndex]?.guess;

  // RESET if the word or dictionary changes.
  React.useEffect(() => {
    setCurrentGuessIndex(0);
    setGuesses(createEmptyGuesses(allowedGuesses, wordLength));
  }, [words, word, allowedGuesses]);

  const updateCurrentGuess = React.useCallback(
    (newGuess: string, result?: LetterResult[]) => {
      if (isComplete) return;

      // only check win/lost if there is a result, since that means they hit enter.
      if (result) {
        if (newGuess == word) {
          // you won! good job!
          onComplete(true);
        } else if (currentGuessIndex + 1 == allowedGuesses) {
          // out of guesses dude, that means you lost :(
          onComplete(false);
        }
      }

      if (result) setCurrentGuessIndex(currentGuessIndex + 1);
      if (!result) result = createEmptyResult(wordLength);
      const newGuesses = [...guesses];
      newGuesses[currentGuessIndex] = { guess: newGuess, result };
      setGuesses(newGuesses);
    },
    [
      isComplete,
      setCurrentGuessIndex,
      currentGuessIndex,
      allowedGuesses,
      guesses,
      setGuesses,
      word,
      onComplete,
    ]
  );

  const keyHandler = React.useCallback(
    (key: string) => {
      if (isComplete) return;
      switch (key) {
        case "ENTER":
        case "Enter":
          if (currentGuess.length == wordLength) {
            // TODO add hard mode!
            // This is just to make sure that we can always guess right. even if there is a mismatch in the word lists.
            if (
              !guessableWords.includes(currentGuess) &&
              currentGuess !== word
            ) {
              alert(
                currentGuess.toUpperCase() + " was not found in our dictionary."
              );
              updateCurrentGuess("");
              return;
            }
            // in hard more the guesses have to be VALID possible winning words, E.G. in the TRIMMED dictionary
            if (isHardMode) {
              const validGuesses = TrimDictionary(guessableWords, guesses);
              if (!validGuesses.includes(currentGuess)) {
                alert(
                  "Hard mode: " +
                    currentGuess.toUpperCase() +
                    " does not use all the clues given."
                );
                updateCurrentGuess("");
                return;
              }
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
    },
    [
      currentGuess,
      wordLength,
      guessableWords,
      isComplete,
      onComplete,
      updateCurrentGuess,
    ]
  );

  useKeyDown(keyHandler);

  return (
    <>
      {isComplete ? (
        <Dialog>
          {didWin ? (
            <div>
              You won! You guessed {word.toUpperCase()} in {currentGuessIndex}{" "}
              {currentGuessIndex == 1 ? "guess" : "guesses"}.
            </div>
          ) : (
            <div>You lost! The word was {word.toUpperCase()}.</div>
          )}
        </Dialog>
      ) : null}
      <div
        style={{
          flex: "auto",
          overflowY: "auto",
        }}>
        <GuessResults guesses={guesses} />
      </div>
      <Keyboard guesses={guesses} onKey={keyHandler} />
    </>
  );
}

export function Game() {
  const [showSettings, setShowSettings] = React.useState(false);

  const [isHardMode, setIsHardMode] = React.useState(false);
  const [allowedGuesses, setAllowedGuesses] = React.useState(6);

  // const wordLength = 5;
  // const words = wordle_answers;
  // const guessableWords = [...wordle_answers, ...wordle_guesses];
  const [answerDictionary, setAnswerDictionary] =
    React.useState<Dictionary>("wordle_answers");
  const [guessableDictionary, setGuessableDictionary] =
    React.useState<Dictionary>("wordle_guessable");
  const [wordLength, setWordLength] = React.useState(5);
  const answerWords = React.useMemo(
    () => CreateDictionary(answerDictionary, wordLength),
    [answerDictionary, wordLength]
  );
  const guessableWords = React.useMemo(
    () =>
      combineWordLists(
        CreateDictionary(guessableDictionary, wordLength),
        answerWords
      ),
    [answerWords, guessableDictionary, wordLength]
  );

  const [isComplete, setIsComplete] = React.useState(false);
  const [didWin, setDidWin] = React.useState(false);

  const [wordSeed, setWordSeed] = React.useState(0);
  const answer = React.useMemo(
    () => pickRandomWord(answerWords),
    [answerWords, wordSeed]
  );
  const pickNewWord = React.useCallback(() => {
    setIsComplete(false);
    setDidWin(false);
    setWordSeed(Math.random());
    document.getElementById("keyboard_ENTER")?.focus();
  }, [setWordSeed]);

  return (
    <div
      id='gamediv'
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
      <AbsolutePositionButton
        right={150}
        text='New word'
        onClick={() => {
          pickNewWord();
        }}
      />
      {showSettings ? (
        <Dialog>
          <div>
            <label>
              <input
                type='checkbox'
                checked={isHardMode}
                onChange={(ev) => {
                  const { checked } = ev.target;
                  setIsHardMode(checked);
                }}
              />{" "}
              Hard mode (guesses must match clues)
            </label>
          </div>

          <div>
            <label>
              Answer dictionary:{" "}
              <select
                value={answerDictionary}
                onChange={(ev) => {
                  const dictionary = ev.target.value as Dictionary;
                  if (dictionary) {
                    if (
                      dictionary === "wordle_answers" ||
                      dictionary === "wordle_guessable"
                    ) {
                      setWordLength(5);
                    }
                    setAnswerDictionary(ev.target.value as Dictionary);
                  }
                }}>
                <option value='wordle_answers'>Wordle Answers</option>
                <option value='wordle_guessable'>Wordle Guesses</option>
                <option value='medium'>Medium Dictionary</option>
                <option value='huge'>Huge Dictionary</option>
              </select>
            </label>
            <br />
            <label>
              Additional allowed guesses:{" "}
              <select
                value={guessableDictionary}
                onChange={(ev) => {
                  const dictionary = ev.target.value as Dictionary;
                  if (dictionary) {
                    if (
                      dictionary === "wordle_answers" ||
                      dictionary === "wordle_guessable"
                    ) {
                      setWordLength(5);
                    }
                    setGuessableDictionary(ev.target.value as Dictionary);
                  }
                }}>
                <option value='wordle_answers'>Wordle Answers</option>
                <option value='wordle_guessable'>Wordle Guesses</option>
                <option value='medium'>Medium Dictionary</option>
                <option value='huge'>Huge Dictionary</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              Word length:{" "}
              <input
                type='number'
                value={wordLength}
                onChange={(ev) => {
                  const value = Number.parseInt(ev.target.value);
                  if (value > 1) {
                    // check if there are enough playable words
                    if (
                      CreateDictionary(answerDictionary, value).length > 2000 &&
                      combineWordLists(
                        CreateDictionary(answerDictionary, value),
                        CreateDictionary(guessableDictionary, value)
                      ).length > 2000
                    ) {
                      setWordLength(value);
                    }
                  }
                }}
              />{" "}
            </label>
          </div>

          <div>Possible answers: {answerWords.length}</div>
          <div>Playable guesses: {guessableWords.length}</div>

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

          {/* <div>Difficulty: Medium</div> */}

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
        </Dialog>
      ) : (
        <AbsolutePositionButton
          right={20}
          text='Customize'
          onClick={() => {
            setShowSettings(true);
          }}
        />
      )}
      <TitleBar title='FIND THE WORD' />
      <SimpleGame
        word={answer}
        words={answerWords}
        guessableWords={guessableWords}
        allowedGuesses={allowedGuesses}
        isComplete={isComplete}
        didWin={didWin}
        onComplete={(didWin) => {
          setIsComplete(true);
          setDidWin(didWin);
        }}
      />
    </div>
  );
}
