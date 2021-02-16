import { createEntropy, MersenneTwister19937, shuffle as rShuffle } from 'random-js';

const seed = createEntropy()
export const mt = MersenneTwister19937.seedWithArray(seed)

export const shuffle = <T>(arr: T[]) => rShuffle(mt, [...arr])