import React from "react";

import { all_words } from "../wordlists/all_words";
import { common_words } from "../wordlists/common_words";

function wordify(dictionary: string) {
  return dictionary
    .split("\n")
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length === 5);
}

// Get a lot of 5 letter words.
// const wordles = wordify(words);
// console.log(wordles);
const common_wordles = wordify(common_words);

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
  23, 24, 25,
];

type LetterResult = "WrongLetter" | "WrongLocation" | "Correct";

interface GuessResult {
  guess: string;
  result: LetterResult[];
}

function getDeadLetters(gr: GuessResult) {
  let deadLetters = new Set<string>();
  gr.result.forEach((result, index) => {
    if (result === "WrongLetter") {
      deadLetters.add(gr.guess[index]);
    }
  });
  return deadLetters;
}

function getYellowLetters(gr: GuessResult) {
  let letters = new Set<string>();
  gr.result.forEach((result, index) => {
    if (result === "WrongLocation") {
      letters.add(gr.guess[index]);
    }
  });
  return letters;
}

// function hasWrongLetter(word: string, gr: GuessResult) {
//   const deadLetters = getDeadLetters(gr);
//   for (let i = 0; i < word.length; i++) {
//     if (deadLetters.has(word[i])) return true;
//   }
//   return false;
// }

function TrimDictionary(words: string[], gr: GuessResult): string[] {
  return words.filter((word) => {
    const deadLetters = getDeadLetters(gr);
    const yellowLetters = getYellowLetters(gr);
    const wordLetters = getLetters(word);
    let hasAllYellowLetters = true;
    yellowLetters.forEach((letter) => {
      if (!wordLetters.has(letter)) hasAllYellowLetters = false;
    });
    // we have to have all yellow letters in the word.
    // AND we can't have a letter in the same SPOT as a yellow one. or else it would be GREEN!
    if (!hasAllYellowLetters) {
      return false;
    }

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      // if the guess indicaes it is correct, if we dont have an exact match we are OUT
      if (gr.result[i] == "Correct" && char !== gr.guess[i]) {
        return false;
      }
      // if we have the same char in the wrong location it is definitely wrong.
      if (gr.result[i] == "WrongLocation" && char === gr.guess[i]) {
        return false;
      }

      // if we have a dead letter we are OUT!
      if (deadLetters.has(char)) return false;
    }

    // check if we DONT have one of the required yellow letters

    return true;
  });
}

// ok for every word that exists we take a randomly weighted sample of possible guesses and

// each letter can be thought of as a guess
// each letter can be either NOT in the word, somewhere ELSE in the word, or in the right place.
// we know the exact odds of each of these things, so we can accurately estimate how likely each of those scenarios is
// weighting by the expected odds we can estiamte how many words are likely to be left.

// at each step
// PICK a random word it IS, and a random word it COULD be. (for small enough, BRUTE force it)

function MakeEveryGuessBecauseIAmAComputer(
  words: string[],
  pastGuesses: GuessResult[],
  wordsToGuess?: string[]
): string {
  // Hmmm, what if we DONT filter by the remaining words for the guesses?
  let remainingWords = getRemainingWords(words, pastGuesses);

  if (remainingWords.length > 1000) {
    return "too many words";
  }

  if (remainingWords.length == 1 || remainingWords.length == 2) {
    return remainingWords[0];
  }

  if (!wordsToGuess) {
    wordsToGuess = remainingWords;
  }

  // start by picking a word to guess, and by that I mean ALL of them
  let lowestRemainingwords = Number.MAX_SAFE_INTEGER;
  let bestWord = "butts";
  for (const guess of wordsToGuess) {
    // This used to be remainingWords!
    // now we check against all possible words it  could be
    let totalRemainingWords = 0;
    for (const answer of remainingWords) {
      // get what the result would be, and check how it affects the remaining words
      const theorecticalResult = CreateGuessResult(guess, answer);
      const newRemainingWords = TrimDictionary(
        remainingWords,
        theorecticalResult
      );
      // This will get us kind of an AVERAGE number of words that will be left
      // but we could also do a SET so we get the actual count of UNIQUE words that it would leave?
      // That could also be helpful?
      totalRemainingWords += newRemainingWords.length;
    }

    // now pick the one that did the best I guess
    if (totalRemainingWords < lowestRemainingwords) {
      lowestRemainingwords = totalRemainingWords;
      bestWord = guess;
    }
  }

  console.log(
    `Computer tried every word and it thinks ${bestWord} results in ${
      lowestRemainingwords / remainingWords.length
    } words left`
  );
  return bestWord;
}

// This will have the AVERAGE number of remaining words after each guess
const FirstGuessResult = new Map<string, number>();
let bestFirstGuess = "butts";
let bestFirstGuessScore = Number.MAX_SAFE_INTEGER;

function FindTheBestStartingWord(
  validGuesses: string[],
  wordles: string[],
  guessIndex: number
) {
  if (guessIndex < validGuesses.length) {
    const currentGuess = validGuesses[guessIndex];

    // now we check against all possible words it  could be
    let totalRemainingWords = 0;
    for (const answer of wordles) {
      // get what the result would be, and check how it affects the remaining words
      const theorecticalResult = CreateGuessResult(currentGuess, answer);
      const newRemainingWords = TrimDictionary(wordles, theorecticalResult);
      // This will get us kind of an AVERAGE number of words that will be left
      // but we could also do a SET so we get the actual count of UNIQUE words that it would leave?
      // That could also be helpful?
      totalRemainingWords += newRemainingWords.length;
    }

    const avg = totalRemainingWords / wordles.length;
    FirstGuessResult.set(currentGuess, avg);
    console.log(currentGuess, avg);

    if (avg < bestFirstGuessScore) {
      console.warn("NEW BEST!", currentGuess, avg);
      bestFirstGuess = currentGuess;
      bestFirstGuessScore = avg;
    }

    setTimeout(() => {
      FindTheBestStartingWord(validGuesses, wordles, guessIndex + 1);
    }, 10);
  } else {
    // it is all populated so lets log it!
    console.log("DONE!!!", FirstGuessResult);
    alert(
      "BEST GUESS IS " + bestFirstGuess + " reduces to " + bestFirstGuessScore
    );
  }
}

// setTimeout(
//   () => FindTheBestStartingWord(common_wordles, common_wordles, 0),
//   1000
// );

function getRemainingWords(
  words: string[],
  pastGuesses: GuessResult[]
): string[] {
  let remainingWords = words;
  pastGuesses.forEach((gr) => {
    remainingWords = TrimDictionary(remainingWords, gr);
  });
  return remainingWords;
}

// EFF it we can brute force check every word. OR we can randomly sample

function MakeAGuess(words: string[], pastGuesses: GuessResult[]): string {
  // so basically, we want to pick the most likely letters we HAVENT guessed yet.
  // We can also guess 1 more than what we have picked already,
  let remainingWords = getRemainingWords(words, pastGuesses);

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

function getLetters(word: string) {
  let letters = new Set<string>();
  for (let i = 0; i < word.length; i++) {
    letters.add(word[i]);
  }
  return letters;
}

function CreateGuessResult(guess: string, word: string): GuessResult {
  const letters = getLetters(word);

  const result: LetterResult[] = [];
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] == word[i]) {
      result.push("Correct");
    } else if (letters.has(guess[i])) {
      result.push("WrongLocation");
    } else {
      result.push("WrongLetter");
    }
  }

  return { guess, result };
}

function GuessResultRow({
  gr,
  onChange,
}: {
  onChange: (newGr: GuessResult) => void;
  gr: GuessResult;
}) {
  const { guess, result } = gr;
  return (
    <div style={{ display: "flex" }}>
      {result.map((r, index) => (
        <div
          style={{
            height: 40,
            width: 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            margin: 2,
            color: r === "WrongLocation" ? "black" : "white",
            background:
              r === "Correct"
                ? "green"
                : r === "WrongLocation"
                ? "yellow"
                : "grey",
          }}
          onClick={() => {
            if (r == "Correct") {
              let newResult = [...result];
              newResult[index] = "WrongLetter";
              onChange({ guess, result: newResult });
            } else if (r == "WrongLetter") {
              let newResult = [...result];
              newResult[index] = "WrongLocation";
              onChange({ guess, result: newResult });
            } else if (r == "WrongLocation") {
              let newResult = [...result];
              newResult[index] = "Correct";
              onChange({ guess, result: newResult });
            }
          }}>
          {guess[index]}
        </div>
      ))}
    </div>
  );
}

export function Utils() {
  const [word, setWord] = React.useState(
    common_wordles[Math.floor(Math.random() * common_wordles.length)]
  );

  const [currentGuess, setCurrentGuess] = React.useState<string>("");
  const [guesses, setGuesses] = React.useState<GuessResult[]>([]);

  let remainingWords = [...common_wordles];

  guesses.forEach((gr) => {
    remainingWords = TrimDictionary(remainingWords, gr);
  });

  const letterFrequencies = getLetterFrequencies(remainingWords);

  const fastGuess = React.useMemo(
    () => MakeAGuess(common_wordles, guesses),
    [guesses]
  );
  const slowGuess = React.useMemo(
    () =>
      MakeEveryGuessBecauseIAmAComputer(
        common_wordles,
        guesses
        // all_valid_wordle_guesses
      ),
    [guesses]
  );

  return (
    <div className='App'>
      <div>
        Word:{" "}
        <input
          value={word}
          onChange={(ev) => {
            setWord(ev.target.value);
          }}
        />
      </div>
      <div>
        <input
          value={currentGuess}
          onChange={(ev) => {
            setCurrentGuess(ev.target.value);
          }}
        />
        <button
          onClick={() => {
            if (currentGuess.length !== 5) {
              alert("must be 5 letters");
              return;
            }
            setGuesses([
              ...guesses,
              CreateGuessResult(currentGuess.toLowerCase(), word),
            ]);
          }}>
          Guess
        </button>
      </div>
      <div>
        I think you should try <b>{fastGuess}</b>
      </div>
      <div>
        Computer says <b>{slowGuess}</b>
      </div>
      <div>{remainingWords.length} words remaining</div>
      <div>
        {guesses.map((gr, index) => (
          <GuessResultRow
            gr={gr}
            onChange={(newGr) => {
              let newGuesses = [...guesses];
              newGuesses[index] = newGr;
              setGuesses(newGuesses);
            }}
          />
        ))}
      </div>

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
