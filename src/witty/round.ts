import { Id } from '../id';
import * as Discord from 'discord.js';
import { RoundDbView } from './db';
import { Prompt } from './prompts';

export type Round = {
  id: Id
  prompt: Prompt
  channel: Discord.TextChannel
  submissions: Map<Discord.User, {
    submission: string
    votes: Discord.User[]
    voted: boolean
  }>
  skipped: boolean
}


export class RoundScoreView {
  constructor(
    readonly id: Id,
    readonly filledPrompt: string,
    readonly submissions: SubmissionScoreView[]
  ) { }

  get size() {
    return this.submissions.length
  }

  static fromDbView(view: RoundDbView, users: Map<string, Discord.User>): RoundScoreView {
    const {filledPrompt, id} = view
    const submissions: SubmissionScoreView[] = []
    for (const sub of view.submissions.values()) {
      const submitter = users.get(sub.submitterId)!
      const voters: Discord.User[] = []
      for (const voterId of sub.votes) {
        const user = users.get(voterId)!
        voters.push(user)
      }
      const voted = Array.from(view.submissions.values()).some(s => s.votes.has(sub.submitterId))
      submissions.push(new SubmissionScoreView(
        sub.id,
        sub.text,
        submitter,
        voters,
        voted
      ))
    }

    return new RoundScoreView(id, filledPrompt, submissions)
  }
}

export class SubmissionScoreView {
  constructor(
    readonly id: Id,
    readonly submission: string,
    readonly user: Discord.User,
    readonly votes: Discord.User[],
    readonly voted: boolean
  ) { }
}