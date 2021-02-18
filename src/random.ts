import { bool, createEntropy, integer, MersenneTwister19937, pick, sample as rSample, shuffle as rShuffle } from 'random-js';

const seed = createEntropy()
export const mt = MersenneTwister19937.seedWithArray(seed)

export const shuffle = <T>(arr: T[]): T[] => rShuffle(mt, [...arr])

export const chooseRandom = <T>(...arr: T[]): T => pick(mt, arr)

export const choose = (min: number, max: number) => integer(min, max)(mt)

export const sample = <T>(n: number, arr: T[]): T[] => rSample(mt, arr, n)

export const flipCoin = () => bool()(mt)