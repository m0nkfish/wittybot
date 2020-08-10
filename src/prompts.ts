import * as fs from 'fs'
import { pick } from 'random-js';
import { mt } from './random';

export function choosePrompt() {
  return pick(mt, prompts)
}

const prompts = fs.readFileSync('../resources/General.txt', 'utf8').split('\n')

const parameterisedPrompts = [
  "I hear {user} loves a good game of...",
  "{user} was convicted of underage...",
  "{user} knew the dragon's weakness, it was...",
  "My honest opinion about {celeb} is...",
  "An English->{language} dictionary is most useful when...",
  "If you ask me, {celeb} should just...",
  "Apparently {user} met {celeb} once: ..."
]
