import { Id } from './id';
import * as Discord from 'discord.js';
import { RoundDbView } from './db';

export class RoundScoreView {
  constructor(
    readonly id: Id,
    readonly filledPrompt: string,
    readonly submissions: SubmissionScoreView[]
  ) { }

  get size() {
    return this.submissions.length
  }

  static async fromDbView(client: Discord.Client, view: RoundDbView): Promise<RoundScoreView> {
    const {filledPrompt, id} = view
    const submissions: SubmissionScoreView[] = []
    for (const sub of view.submissions.values()) {
      const submitter = await client.users.fetch(sub.submitterId, true)
      const voters: Discord.User[] = []
      for (const voterId of sub.votes) {
        const user = await client.users.fetch(voterId, true)
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