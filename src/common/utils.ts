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