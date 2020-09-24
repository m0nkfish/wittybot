import { GlobalContext, GuildContext, RoundContext, GameContext } from './context';
import { IdleState, AnyGameState } from './state';
import { Action, AddUserToRole, RemoveUserFromRole, CompositeAction, Send } from './actions';
import * as Discord from 'discord.js';
import { Command, Help, NotifyMe, UnnotifyMe, GetScores } from './commands';
import { getNotifyRole } from './notify';
import { BasicMessage, HelpMessage, Message, ScoresByRatingMessage } from './messages';
import * as db from './db'
import { SubmissionState } from './state/SubmissionState';
import { VotingState } from './state/VotingState';
import { RoundScoreView } from './round';
import { Scores, ScoreUnit } from './scores';
import { log } from './log';
import { GameState } from './state/GameState';
import { invoke } from './util';
import { ScoresByPointsMessage } from './messages/ScoresMessage';

class ScopedCommand {
  constructor(readonly command: Command, readonly guild: Discord.Guild) {}
}

export class Engine {
  states: Map<Discord.Guild, AnyGameState>

  constructor(readonly context: GlobalContext) {
    this.states = new Map()
  }

  getState(guild: Discord.Guild): AnyGameState {
    let state = this.states.get(guild)
    if (!state) {
      state = new IdleState(new GuildContext(this.context, guild))
      this.states.set(guild, state)
    }
    return state
  }

  getCommand(message: Discord.Message): Command | ScopedCommand | undefined {
    if (message.channel instanceof Discord.NewsChannel) {
      return 
    }
    const source = message.channel instanceof Discord.TextChannel ? message.channel : message.author
    if (message.content === '!help') {
      return Help(source)
    }
    if (message.content === '!notify' && message.member) {
      return NotifyMe(message.member)
    }
    if (message.content === '!unnotify' && message.member) {
      return UnnotifyMe(message.member)
    }

    if (message.channel instanceof Discord.TextChannel) {
      const scores = /^!scores(?: (game|day|week|month|year|alltime))?$/.exec(message.content)
      if (scores) {
        const guild = message.channel.guild
        const defaultUnit = () => {
          const state = this.states.get(guild)
          return state?.context instanceof GameContext || state?.context instanceof RoundContext
            ? 'game'
            : 'day'
        }
        const unit = (scores[1] ?? defaultUnit()) as ScoreUnit
        return GetScores(message.channel, unit)
      }

      const state = this.getState(message.channel.guild)
      if (state) {
        const command = state.interpreter(message)
        if (command) {
          return new ScopedCommand(command, message.channel.guild)
        }
      }
    } else if (message.channel instanceof Discord.DMChannel) {
      const commands = this.context.client.guilds.cache
        .filter(g => g.member(message.author) !== null)
        .map(g => {
          const state = this.getState(g)
          if (state) {
            const command = state.interpreter(message)
            if (command) {
              return new ScopedCommand(command, g)
            }
          }
        })
        .filter(cmd => !!cmd) as ScopedCommand[]

      if (commands.length === 0) {
        return
      }

      if (commands.length > 1) {
        message.reply(`Sorry, could not establish which server you meant to send this command to`)
        return
      }

      return commands[0]
    }

  }

  async getAction(command: Command | ScopedCommand): Promise<Action | undefined> {
    this.logCommand(command)

    if (command instanceof ScopedCommand) {
      return this.getState(command.guild)
        .receive(command.command)
    }

    if (command.type === 'notify-me') {
      const role = await getNotifyRole(command.member.guild)
      if (role) {
        return CompositeAction(
          AddUserToRole(command.member, role),
          Send(command.member.user, new BasicMessage(`Wittybot will alert you when a new game is begun. **!unnotify** to remove`))
        )
      }
    }

    if (command.type === 'unnotify-me') {
      const role = await getNotifyRole(command.member.guild)
      if (role) {
        return CompositeAction(
          RemoveUserFromRole(command.member, role),
          Send(command.member.user, new BasicMessage(`Wittybot will no longer alert you when a new game is begun`))
        )
      }
    }

    if (command.type === 'help') {
      return Send(command.source, new HelpMessage())
    }

    if (command.type === 'get-scores') {
      if (command.unit === 'game') {
        const state = this.states.get(command.source.guild)
        const message = state?.context instanceof GameContext || state?.context instanceof RoundContext
          ? new ScoresByPointsMessage(Scores.fromRounds(state.context.rounds))
          : new BasicMessage(`No game is running; start a game with \`!witty\``)
        return Send(command.source, message)
      }
      const rounds = await db.scores(command.source.guild, command.unit)
      const scoreView = await Promise.all(rounds.map(round => RoundScoreView.fromDbView(this.context.client, round)))
      const scores = Scores.fromRoundViews(scoreView)
      const timeframe = command.unit === 'alltime' ? "since the dawn of time itself" : `from the last ${command.unit}`
      return Send(command.source, new ScoresByRatingMessage(scores, timeframe))
    }
  }

  run() {
    this.context.client.on('message', async message => {
      if (message.author.bot) {
        return
      }

      const command = this.getCommand(message)
      if (!command) {
        return
      }

      const action = await this.getAction(command)
      if (!action) {
        return
      }

      this.interpret(action)
    });
  }

  interpret = (action: Action): Exclude<any, typeof unhandled> => {
    this.logAction(action)
    switch (action.type) {
      case 'composite-action':
        action.actions.forEach(this.interpret)
        return
      case 'promise-action':
        action.promise.then(action => this.interpret(action))
        return
      case 'from-state-action':
        this.interpret(action.getAction(this.getState(action.guild)))
        return
      case 'new-state':
        this.states.set(action.newState.context.guild, action.newState)
        return
      case 'send-message':
        const embedColor = '#A4218A'
        const content = action.message.content
        if (content instanceof Discord.MessageEmbed) {
          content.setColor(embedColor)
        } else if (typeof content !== "string") {
          content.embed.setColor(embedColor)
        }
        action.destination.send(content)
          .then(msg => {
            const {guild} = msg
            if (guild) {
              action.message.onSent?.(msg, () => this.getState(guild))
            }
          })
        return
      case 'add-user-to-role':
        action.member.roles.add(action.role)
        return
      case 'remove-user-from-role':
        action.member.roles.remove(action.role)
        return
      case 'save-round':
        db.saveRound(action.round)
        return
      case 'null-action':
        return
      default:
        return unhandled
    }
  }

  logAction = (action: Action) => {
    const event = `action:${action.type}`
    if (action.type === 'new-state') {
      const {newState} = action
      log(event, logGuild(newState.context.guild), { state: name(newState) }, logState(newState))
    } else if (action.type === 'send-message') {
      const {message, destination} = action
      log(event, logSource(destination), { message: name(message) }, logMessage(message))
    } else if (action.type === 'save-round') {
      log(event, logChannel(action.round.channel), { round: action.round.id.value })
    }
  }

  logCommand = (input: Command | ScopedCommand) => {
    const command = input instanceof ScopedCommand ? input.command : input
    const guild = input instanceof ScopedCommand ? logGuild(input.guild) : undefined
    const event = `command:${command.type}`
    switch (command.type) {
      case 'begin':
        log(event, guild, logUser(command.user))
        break;

      case 'get-scores':
        log(event, guild, { unit: command.unit }, logSource(command.source))
        break;

      case 'help':
        log(event, guild, logSource(command.source))
        break;

      case 'interested':
      case 'notify-me':
      case 'unnotify-me':
        log(event, guild, logMember(command.member))
        break;

      case 'skip':
        log(event, guild)
        break;

      case 'submit':
        log(event, guild, logUser(command.user), { submission: command.submission })
        break;

      case 'vote':
        log(event, guild, logUser(command.user), { entry: command.entry })
        break;
    
      default:
        break;
    }
  }
}

const usernames = (users: Iterable<Discord.User>) => Array.from(users).map(u => u.username).join(',')
const logGuild = (guild?: Discord.Guild) => ({ guildId: guild?.id, guildName: guild?.name })
const logUser = (user?: Discord.User) => ({ userId: user?.id, userName: user?.username })
const logMember = (member: Discord.GuildMember) => ({ ...logGuild(member.guild), ...logUser(member.user) })
const logChannel = (channel: Discord.TextChannel) => ({ ...logGuild(channel.guild), channel: channel.name })
const logSource = (source: Discord.TextChannel | Discord.User) => source instanceof Discord.TextChannel ? logChannel(source): logUser(source)
const logState = (state: GameState<any>) =>
  state instanceof SubmissionState ? { submissions: usernames(state.submissions.keys()) }
  : state instanceof VotingState ? { submissions: usernames(state.submissions.map(x => x.user)), votes: usernames(state.votes.keys()) }
  : undefined

const logMessage = (message: Message) =>
  message instanceof BasicMessage ? { content: message.content }
  : undefined

const name = (obj: any) => obj?.constructor?.name

const unhandled = Symbol()