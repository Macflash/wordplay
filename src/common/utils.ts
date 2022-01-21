export function wordify(dictionary: string, length = 5) {
  return dictionary
    .split("\n")
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length === length);
}

export function getLetter(c: number) {
    const offset = "a".charCodeAt(0);
    return String.fromCharCode(c + offset);
  }

  
export type LetterResult = "NotGuessed" | "WrongLetter" | "WrongLocation" | "Correct";

export interface GuessResult {
  guess: string;
  result: LetterResult[];
}

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
  let letters = new Set<string>();
  for (const gr of grs) {
    gr.result.forEach((result, index) => {
      if (result === "WrongLocation") {
        letters.add(gr.guess[index]);
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
    const letters = getLetters(word);

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

  
export function TrimDictionary(words: string[], guesses: GuessResult[]): string[] {
  const deadLetters = getDeadLetters(guesses);
  const yellowLetters = getYellowLetters(guesses);
  for(const guess of guesses){
     words = words.filter((word) => {
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
        if (guess.result[i] == "Correct" && char !== guess.guess[i]) {
          return false;
        }
        // if we have the same char in the wrong location it is definitely wrong.
        if (guess.result[i] == "WrongLocation" && char === guess.guess[i]) {
          return false;
        }
  
        // if we have a dead letter we are OUT!
        if (deadLetters.has(char)) return false;
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
