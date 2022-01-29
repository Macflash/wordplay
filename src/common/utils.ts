export function getLetter(c: number) {
  const offset = "a".charCodeAt(0);
  return String.fromCharCode(c + offset);
}

export type LetterResult =
  | "NotGuessed"
  | "WrongLetter"
  | "WrongLocation"
  | "Correct";

export interface GuessResult {
  guess: string;
  result: LetterResult[];
}

// This is wrong. It matters the COUNT of letters
export function getDeadLetters(grs: GuessResult[]) {
  let deadLetters = new Set<string>();
  for (const gr of grs) {
    gr.result.forEach((result, index) => {
      if (result === "WrongLetter") {
        deadLetters.add(gr.guess[index]);
      }
    });
  }
  return deadLetters;
}

export function getYellowLetters(grs: GuessResult[]) {
  let letters = new Map<string, number>();
  for (const gr of grs) {
    gr.result.forEach((result, index) => {
      if (result === "WrongLocation") {
        const letter = gr.guess[index];
        letters.set(letter, (letters.get(letter) || 0) + 1);
      }
    });
  }
  return letters;
}

export function getGreenLetters(grs: GuessResult[]) {
  let letters = new Set<string>();
  for (const gr of grs) {
    gr.result.forEach((result, index) => {
      if (result === "Correct") {
        letters.add(gr.guess[index]);
      }
    });
  }
  return letters;
}

export function getLetters(word: string) {
  let letters = new Set<string>();
  for (let i = 0; i < word.length; i++) {
    letters.add(word[i]);
  }
  return letters;
}

export function CreateGuessResult(guess: string, word: string): GuessResult {
  const result: LetterResult[] = [];
  const wordLetters = countLetters(word);

  // we only do total # of matched UP to the number in the word.
  const matchedSoFar = new Map<string, number>();

  // Do greens first
  for (let i = 0; i < guess.length; i++) {
    const char = guess[i];
    if (char === word[i]) {
      result[i] = "Correct";
      matchedSoFar.set(char, 1 + Or0(matchedSoFar.get(char)));
    }
  }

  for (let i = 0; i < guess.length; i++) {
    const char = guess[i];
    if (char == word[i]) {
      // already did green.
      continue;
    } else if (
      wordLetters.has(char) &&
      Or0(matchedSoFar.get(char)) < wordLetters.get(char)!
    ) {
      matchedSoFar.set(char, 1 + Or0(matchedSoFar.get(char)));
      // need to factor in the NUMBER so far and increment it as we go.
      result[i] = "WrongLocation";
    } else {
      result[i] = "WrongLetter";
    }
  }

  return { guess, result };
}

function countLetters(word: string) {
  const counts = new Map<string, number>();
  for (let i = 0; i < word.length; i++) {
    counts.set(word[i], (counts.get(word[i]) ?? 0) + 1);
  }
  return counts;
}

function countMatchedLetters({ guess, result }: GuessResult) {
  const minCounts = new Map<string, number>();
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "Correct" || result[i] === "WrongLocation") {
      minCounts.set(guess[i], (minCounts.get(guess[i]) ?? 0) + 1);
    }
  }
  return minCounts;
}

const alphabet: ReadonlyArray<string> = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

function Or0(number?: number) {
  return number ?? 0;
}

// Careful using the result here. undefined means NO KNOWN LIMIT!
function getMaxLetters(guessResult: GuessResult): Map<string, number> {
  const letterCount = countLetters(guessResult.guess);
  const matchCount = countMatchedLetters(guessResult);
  const maxCounts = new Map<string, number>();
  // if letterCount > matchCount we know there is a DEAD letter. so whatever the match count is... is the max allowed number in a word.
  for (let letter of alphabet) {
    if (Or0(letterCount.get(letter)) > Or0(matchCount.get(letter))) {
      maxCounts.set(letter, Or0(matchCount.get(letter)));
    }
  }

  return maxCounts;
}

// this doesn't handle NOT GUESSED!
export function TrimDictionary(
  words: string[],
  guesses: GuessResult[]
): string[] {
  for (const guess of guesses) {
    // SKIP ANYTHING WITH NOT GUESSED IN IT!
    if (guess.result.includes("NotGuessed")) {
      continue;
    }
    const maxLetters = getMaxLetters(guess);
    const matchedLetters = countMatchedLetters(guess); // we are doing this twice, a little inefficient
    words = words.filter((word) => {
      // handle presence of a letter
      const letterCount = countLetters(word);

      for (const letter of alphabet) {
        // if we have a known max, then the word's letter count must be <= to that count or we know it is eliminated
        if (maxLetters.has(letter)) {
          // if we know there are 2 R's and we have 3 or more R's then we know this word is wrong
          if (Or0(letterCount.get(letter)) > maxLetters.get(letter)!) {
            return false;
          }
        }
        if (matchedLetters.has(letter)) {
          if (Or0(letterCount.get(letter)) < matchedLetters.get(letter)!) {
            // if we have a green and a yellow R for example
            // and the word only has 1 R we know it is wrong.
            return false;
          }
        }
      }

      // we also need to filter that it has AT LEAST the same count of each matched letter.

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        // if the guess indicaes it is correct, if we dont have an exact match we are OUT
        if (guess.result[i] == "Correct" && char !== guess.guess[i]) {
          return false;
        }
        // if we have the same char in the wrong location it is definitely wrong.
        if (guess.result[i] == "WrongLocation" && char === guess.guess[i]) {
          return false;
        }
        // if we have a matching char in a GREY spot we know it is also definitely wrong.
        if (guess.result[i] === "WrongLetter" && char === guess.guess[i]) {
          return false;
        }
      }

      // check if we DONT have one of the required yellow letters

      return true;
    });
  }

  return words;
}

export function createEmptyResult(length = 5) {
  let result: LetterResult[] = [];
  for (let i = 0; i < length; i++) {
    result.push("NotGuessed");
  }
  return result;
}

export function createEmptyGuess(length = 5) {
  return {
    guess: "",
    result: createEmptyResult(length),
  };
}

export function createEmptyGuesses(guesses = 6, wordLength = 5) {
  let result: GuessResult[] = [];
  for (let i = 0; i < guesses; i++) {
    result.push(createEmptyGuess(wordLength));
  }
  return result;
}

export function pickRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}
