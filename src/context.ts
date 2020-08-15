import * as Discord from 'discord.js';
import { Prompt } from './prompts';

export type Round = {
  prompt: Prompt
  submissions: Map<Discord.User, {
    submission: string
    votes: Discord.User[]
    voted: boolean
  }>
}

export type Context = {
  client: Discord.Client
  config: {
    submitDurationSec: number
    testMode?: boolean
  }
  rounds: Round[]
}
