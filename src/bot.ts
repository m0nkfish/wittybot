import * as Discord from 'discord.js'
import { createEntropy, MersenneTwister19937, pick, shuffle } from 'random-js'
import { prompts } from './prompts'

type Prompt = string
type Submission = { user: Discord.User, submission: string }

const tryParseInt = (str: string) => {
  try {
    return Number.parseInt(str)
  } catch {
    return null
  }
}

type Case<Key extends string, Res> = Res & { type: Key }
const Case = <Key extends string, Args extends any[], Res>(type: Key, f: (...args: Args) => Res) => {
  function ff(...args: Args) {
    return {
      ...f(...args),
      type
    }
  }
  return ff
}

const Begin = Case('begin', (user: Discord.User, channel: Discord.TextChannel) => ({ channel, user }))
const Submit = Case('submit', (user: Discord.User, submission: string) => ({ user, submission }))
const Vote = Case('vote', (user: Discord.User, entry: number) => ({ user, entry }))
type Command =
| ReturnType<typeof Begin>
| ReturnType<typeof Submit>
| ReturnType<typeof Vote>


const Message = Case('post-message', (channel: Discord.TextChannel | Discord.DMChannel, message: string) => ({ channel, message }))
const NewState = Case('new-state', (newState: GameState) => ({ newState }))
const CompositeAction = Case('composite-action', (actions: Action[]) => ({ actions }))
const DelayedAction = Case('delayed-action', (delayMs: number, action: Action) => ({ delayMs, action }))
const FromStateAction = Case('from-state-action', (getAction: (state: GameState) => Action) => ({ getAction }))
const NullAction = Case('null-action', () => ({}))

type Action =
| ReturnType<typeof Message>
| ReturnType<typeof NewState>
| ReturnType<typeof NullAction>
| Case<'composite-action', { actions: Action[] }>
| Case<'delayed-action', { delayMs: number, action: Action }>
| Case<'from-state-action', { getAction: (state: GameState) => Action }>

const UpdateState = (update: (state: GameState) => GameState) => FromStateAction(state => NewState(update(state)))

type GameState = {
  interpreter(message: Discord.Message): Command | null
  receive(command: Command): Action | undefined
}

const config = {
  submissionDurationSec: 60,
  votingDurationSec: 60
}
class IdleState implements GameState {
  constructor() {}

  readonly interpreter = (message: Discord.Message) =>
    message.channel instanceof Discord.TextChannel && message.content === "!witty"
      ? Begin(message.author, message.channel)
      : null

  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      return IdleState.begin(command.channel)
    }
  }

  static begin = (channel: Discord.TextChannel) => {
    const prompt = choosePrompt()
    return CompositeAction([
      NewState(SubmissionState.begin(channel, prompt)),
      DelayedAction(config.submissionDurationSec * 1000, FromStateAction(state => state instanceof SubmissionState ? state.finish() : NullAction())),
      Message(channel, `A new round begins!`),
      Message(channel, `Complete this sentence: ${prompt}`),
      Message(channel, `You have ${config.submissionDurationSec} seconds to come up with an answer; submit by DMing ${client.user?.username}`),
    ])
  }
}

class SubmissionState implements GameState {

  constructor(
    readonly channel: Discord.TextChannel,
    readonly prompt: Prompt,
    readonly submissions: Map<Discord.User, string>) {}

  interpreter = (message: Discord.Message) =>
    message.channel instanceof Discord.DMChannel
      ? Submit(message.author, message.content)
      : null

  receive(command: Command): Action | undefined {
    if (command.type === 'submit') {
      const messages: Action[] = []
      if (this.submissions.has(command.user)) {
        messages.push(Message(command.user.dmChannel, `Replacement submission accepted`))
      } else {
        messages.push(Message(command.user.dmChannel, `Submission accepted`))
        messages.push(Message(this.channel, `Submission received from ${command.user.username}`))
      }
      return CompositeAction([
        ...messages,
        UpdateState(state => state instanceof SubmissionState ? state.withSubmission(command.user, command.submission) : state),
      ])
    }
  }

  withSubmission = (user: Discord.User, submission: string) => 
    new SubmissionState(this.channel, this.prompt, new Map(this.submissions).set(user, submission))

  finish = (): Action => {
    if (this.submissions.size < 3) {
      return CompositeAction([
        Message(this.channel, `Not enough submissions to continue`),
        NewState(new IdleState())
      ])
    }

    const shuffled = shuffle(mt, Array.from(this.submissions).map(([user, submission]) => ({ user, submission })))
    const entryMessages=  shuffled.map((x, i) => Message(this.channel, `${i+1}: ${x.submission}`))

    return CompositeAction([
      NewState(VotingState.begin(this.channel, this.prompt, shuffled)),
      DelayedAction(config.votingDurationSec * 1000, FromStateAction(state => state instanceof VotingState ? state.finish() : NullAction())),
      Message(this.channel, `Time's up! Vote for your favourite by DMing ${client.user?.username} with the entry number. You have ${config.votingDurationSec} seconds to vote`),
      Message(this.channel, `${this.prompt}`),
      ...entryMessages,
    ])
  }

  static begin = (channel: Discord.TextChannel, prompt: Prompt) => new SubmissionState(channel, prompt, new Map())
}

class VotingState implements GameState {

  constructor(
    readonly channel: Discord.TextChannel,
    readonly prompt: Prompt,
    readonly submissions: Submission[],
    readonly votes: Map<Discord.User, number>) { }

  interpreter = (message: Discord.Message) => {
    if (message.channel instanceof Discord.DMChannel) {
      const entry = tryParseInt(message.content)
      if (entry !== null) {
        return Vote(message.author, entry)
      }
    }
    return null
  }

  receive(command: Command): Action | undefined {
    if (command.type === 'vote') {
      const { entry, user } = command
      if (entry < 1 || this.submissions.length < entry) {
        return Message(user.dmChannel, `You must vote between 1 and ${this.submissions.length}`)
      }

      if (!this.submissions.some(x => x.user === user)) {
        return Message(user.dmChannel, `You must have submitted an entry in order to vote`)
      }

      const submission = this.submissions[entry - 1]
      if (submission.user === user) {
        return Message(user.dmChannel, `You cannot vote for your own entry`)
      }

      return CompositeAction([
        Message(user.dmChannel, `Vote recorded for entry ${entry}: '${submission.submission}'`),
        UpdateState(state => state instanceof VotingState ? state.withVote(user, entry) : state)
      ])
    }
  }

  withVote = (user: Discord.User, entry: number) =>
    new VotingState(this.channel, this.prompt, this.submissions, new Map(this.votes).set(user, entry))

  finish = () => {
    const withVotes = [...this.submissions.map(x => ({ ...x, votes: [] as Discord.User[] }))]
    this.votes.forEach((entry, user) => withVotes[entry - 1].votes.push(user))
    withVotes.sort((a, b) => a.votes.length - b.votes.length)

    return CompositeAction([
      Message(this.channel, `Voting complete! In order of most to least votes:`),
      ...withVotes.map(x => Message(this.channel, `${x.submission} (${x.votes.length} from ${x.votes.map(v => v.username).join('; ')}})`)),
      NewState(new IdleState())
    ])
  }

  static begin = (channel: Discord.TextChannel, prompt: Prompt, submissions: Submission[]) =>
    new VotingState(channel, prompt, submissions, new Map())
}


const seed = createEntropy()
const mt = MersenneTwister19937.seedWithArray(seed)
function choosePrompt() {
  return pick(mt, prompts)
}

let state: GameState = new IdleState()

function interpret(action: Action) {
  if (action.type === 'composite-action') {
    action.actions.forEach(interpret);
  } else if (action.type === 'delayed-action') {
    setTimeout(() => interpret(action.action), action.delayMs)
  } else if (action.type === 'from-state-action') {
    interpret(action.getAction(state))
  } else if (action.type === 'new-state') {
    state = action.newState
  } else if (action.type === 'post-message') {
    action.channel.send(action.message)
  }
}

const isWittyChan = (ch: Discord.Channel) => ch instanceof Discord.TextChannel && ch.name === 'wittybot'

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!')
  const channel = client.channels.cache.find(isWittyChan) as Discord.TextChannel | undefined
  if (!channel) {
    return
  }
  channel.send(`deployment successful`)
});

client.on('message', message => {
  if (message.author.bot) {
    return
  }

  if (message.content === 'ping') {
    console.log('received ping')
    message.reply('pong');
  }

  const command = state.interpreter(message)
  if (!command) {
    return
  }
  const action = state.receive(command)
  if (!action) {
    return
  }

  interpret(action)
});

client.login(process.env.BOT_TOKEN);