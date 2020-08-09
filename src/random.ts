import { createEntropy, MersenneTwister19937 } from 'random-js';

const seed = createEntropy()
export const mt = MersenneTwister19937.seedWithArray(seed)