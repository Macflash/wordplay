import React from "react";
import { GuessResultRow, GuessResults } from "../common/ui";
import {
  createEmptyGuesses,
  CreateGuessResult,
  getDeadLetters,
  getLetters,
  getYellowLetters,
  GuessResult,
  TrimDictionary,
  wordify,
} from "../common/utils";

import { all_words } from "../wordlists/all_words";
import { common_words } from "../wordlists/common_words";

const common_wordles = wordify(common_words);

const all_valid_wordle_guesses = wordify(all_words);

// count frequency of each letter in each spot
// This could be... large
function getLetterFrequencies(words: string[]) {
  const frequencies: Map<string, number>[] = [];

  for (let i = 0; i < 5; i++) {
    frequencies.push(new Map<string, number>());
  }

  for (const word of words) {
    for (let i = 0; i < 5; i++) {
      const char = word[i];
      const f = frequencies[i];

      f.set(char, 1 + (f.get(char) ?? 0));
    }
  }

  return frequencies;
}

const offset = "a".charCodeAt(0);

function letter(c: number) {
  return String.fromCharCode(c + offset);
}

function getSortedFreqs(f: Map<string, number>): number[] {
  const result: number[] = [];
  for (let c = 0; c < 26; c++) {
    result.push(f.get(letter(c)) ?? 0);
  }
  return result;
}

function Row({ f, names }: { f: number[]; names?: boolean }) {
  const max = Math.max(...f);
  return (
    <div
      style={{
        display: "flex",
        height: names ? undefined : 50,
        alignItems: "flex-end",
        margin: 2,
      }}>
      {f.map((r, index) => (
        <div
          title={`${letter(index)}: ${r}`}
          key={index}
          style={{
            height: names ? undefined : `${(100 * r) / max}%`,
            width: 10,
            margin: 2,
            backgroundColor: names ? undefined : "blue",
          }}>
          {names ? letter(index) : null}
        </div>
      ))}
    </div>
  );
}

const chars = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26,
];

function MakeAGuess(words: string[], pastGuesses: GuessResult[]): string {
  // so basically, we want to pick the most likely letters we HAVENT guessed yet.
  // We can also guess 1 more than what we have picked already,
  let remainingWords = TrimDictionary(words, pastGuesses);

  // so basically we want the MOST information per guess
  // so what guess is likely to reduce the MAXIMUM amount of words?

  const frequencies = getLetterFrequencies(remainingWords);
  // find the top one for each position and make a new guess
  // TODO: factor in the letters we have already guessed. not that helpful
  // to put a known letter in a correct spot unless we think we got it.
  return frequencies
    .map((f) => {
      let mostCommonLetter = "a";
      let mostCommonCount = -1;
      f.forEach((count, letter) => {
        if (count > mostCommonCount) {
          mostCommonCount = count;
          mostCommonLetter = letter;
        }
      });
      return mostCommonLetter;
    })
    .join(" ");
}

var isGameGuessing = false;
var stopGuessing: () => void;
var setTopWords: (words: string[]) => void;
var setPercent: (number: number) => void;

interface WordResult {
  guess: string;
  score: number;
}

function AutomaticGuessing(
  remainingWords: string[],
  pastGuesses: GuessResult[],
  currentIndex: number,
  currentTopGuesses: WordResult[],
  top: number
) {
  console.log("Guessing!");
  if (!isGameGuessing) {
    console.log("done guessing somehow");
    return;
  }
  if (remainingWords.length <= top) {
    console.log("all words are good i guess");
    setTopWords(remainingWords);
    isGameGuessing = false;
    stopGuessing();
    return;
  }
  if (currentIndex >= remainingWords.length) {
    isGameGuessing = false;
    stopGuessing();
    return;
  }

  setPercent(Math.floor((1000 * currentIndex) / remainingWords.length) / 10);

  const guess = remainingWords[currentIndex];

  // This used to be remainingWords!
  // now we check against all possible words it  could be
  let totalRemainingWords = 0;
  for (const answer of remainingWords) {
    // get what the result would be, and check how it affects the remaining words
    const theorecticalResult = CreateGuessResult(guess, answer);
    const newRemainingWords = TrimDictionary(remainingWords, [
      theorecticalResult,
    ]);
    // This will get us kind of an AVERAGE number of words that will be left
    // but we could also do a SET so we get the actual count of UNIQUE words that it would leave?
    // That could also be helpful?
    totalRemainingWords += newRemainingWords.length;
  }

  const result: WordResult = {
    guess,
    score: totalRemainingWords,
  };

  // now pick the one that did the best I guess
  currentTopGuesses.push(result);
  currentTopGuesses.sort((a, b) => a.score - b.score);

  setTopWords(currentTopGuesses.slice(0, top).map((r) => r.guess));
  setTimeout(() => {
    AutomaticGuessing(
      remainingWords,
      pastGuesses,
      currentIndex + 1,
      currentTopGuesses,
      top
    );
  }, 0);
}

export function Solver() {
  const [currentGuess, setCurrentGuess] = React.useState<string>("");
  const [guesses, setGuesses] = React.useState<GuessResult[]>(
    createEmptyGuesses(1)
  );

  // Add option to select which words to use!
  let remainingWords = React.useMemo(() => {
    const rw = TrimDictionary(common_wordles, guesses);
    if (rw.length < 25) {
      return TrimDictionary(all_valid_wordle_guesses, guesses);
    }
    return rw;
  }, [guesses]);

  const letterFrequencies = React.useMemo(
    () => getLetterFrequencies(remainingWords),
    [remainingWords]
  );

  const fastGuess = React.useMemo(
    () => MakeAGuess(all_valid_wordle_guesses, guesses),
    [guesses]
  );

  const [topGuesses, setTopGuesses] = React.useState<string[]>(["rates"]);

  const [isGuessing, setIsGuessing] = React.useState(false);

  const [guessPercent, setGuessPercent] = React.useState(0);
  setPercent = setGuessPercent;
  isGameGuessing = isGuessing;
  stopGuessing = React.useCallback(() => {
    setIsGuessing(false);
  }, [setIsGuessing]);
  setTopWords = React.useCallback(
    (words: string[]) => {
      setTopGuesses(words);
      setGuessPercent(0);
    },
    [topGuesses, setTopGuesses]
  );

  const startGuessing = React.useCallback(
    (wordsToUse: string[]) => {
      if (isGameGuessing) throw "HEY! already guessing!";
      setIsGuessing(true);
      isGameGuessing = true;
      AutomaticGuessing(wordsToUse, guesses, 0, [], 10);
    },
    [setIsGuessing, guesses]
  );

  React.useEffect(() => {
    setTopGuesses([]);
    isGameGuessing = false;
  }, [guesses]);

  return (
    <div className='App'>
      <GuessResults
        guesses={guesses}
        onChange={(newGuesses) => {
          setGuesses(newGuesses);
        }}
      />
      <div>
        <input
          value={currentGuess}
          onChange={(ev) => {
            setCurrentGuess(ev.target.value);
          }}
        />
        <button
          disabled={isGuessing}
          onClick={() => {
            if (currentGuess.length !== 5) {
              alert("must be 5 letters");
              return;
            }
            setGuesses([
              ...guesses,
              CreateGuessResult(currentGuess.toLowerCase(), ""),
            ]);
          }}>
          Guess
        </button>
      </div>
      <div>
        Most common letter: <b>{fastGuess}</b>
      </div>
      <div>
        {topGuesses.map((word) => (
          <div
            onClick={() => {
              setCurrentGuess(word);
            }}>
            {word}
          </div>
        ))}
      </div>
      <div>{remainingWords.length} words remaining</div>
      <div>
        <button
          disabled={isGuessing}
          onClick={() => {
            if (topGuesses.length || remainingWords.length < 5) {
              // Guesses with WAY more words.
              startGuessing(TrimDictionary(all_valid_wordle_guesses, guesses));
              return;
            }
            startGuessing(remainingWords);
          }}>
          {isGuessing
            ? `Calculating (${guessPercent}%)`
            : topGuesses.length > 0 || remainingWords.length < 5
            ? "Try more words (this could take longer)"
            : "Calculate (this will take a sec)"}
        </button>
        {isGuessing ? (
          <button
            onClick={() => {
              setIsGuessing(false);
              isGameGuessing = false;
            }}>
            Stop guessing
          </button>
        ) : null}
      </div>
      Letter frequencies by location:
      {[0, 1, 2, 3, 4].map((n) => {
        const list = getSortedFreqs(letterFrequencies[n]);
        return (
          <React.Fragment key={n}>
            <Row f={list} />
            <Row f={chars} names />
          </React.Fragment>
        );
      })}
    </div>
  );
}
