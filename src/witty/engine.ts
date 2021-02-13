import { WittyRoundContext, WittyGameContext } from './context';
import { GlobalContext, GuildContext } from '../context'
import { IdleState, AnyGameState } from '../state';
import { Action, AddUserToRole, RemoveUserFromRole, CompositeAction, Send } from './actions';
import * as Discord from 'discord.js';
import { Command, Help, NotifyMe, UnnotifyMe } from './commands';
import { getNotifyRole } from './notify';
import { ScoresByRatingMessage } from './messages';
import { BasicMessage, HelpMessage } from '../messages';
import * as db from './db'
import { RoundScoreView } from './round';
import { Scores } from './scores';
import { log } from '../log';
import { ScoresByPointsMessage } from './messages/ScoresMessage';
import { logUser, logMember, logSource, logGuild, logChannel, getName, logMessage, logState } from './loggable';
import { beginTimer } from '../util';
import { RoundDbView } from './db';
import { Begin, Skip, Submit, Vote, GetScores, GetScoresFactory } from './command-factory';

class ScopedCommand {
  constructor(readonly command: Command, readonly guild: Discord.Guild) {}
}

export class Engine {
  guildStates: Map<Discord.Guild, AnyGameState>

  constructor(readonly context: GlobalContext) {
    this.guildStates = new Map()
  }

  getState(guild: Discord.Guild): AnyGameState {
    let state = this.guildStates.get(guild)
    if (!state) {
      state = new IdleState(new GuildContext(this.context, guild))
      this.guildStates.set(guild, state)
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
      const state = this.getState(message.channel.guild)
      const getScores = GetScoresFactory.process(state, message)
      if (getScores) { 
        return getScores
      }

      const command = state.interpreter(message)
      if (command) {
        return new ScopedCommand(command, message.channel.guild)
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

    if (command.type === GetScores.type) {
      if (command.unit === 'game') {
        const state = this.guildStates.get(command.source.guild)
        const message = state?.context instanceof WittyGameContext || state?.context instanceof WittyRoundContext
          ? new ScoresByPointsMessage(Scores.fromRounds(state.context.rounds))
          : new BasicMessage(`No game is running; start a game with \`!witty\``)
        return Send(command.source, message)
      }

      const rounds = await db.scores(command.source.guild, command.unit)

      const fetchUsersTime = beginTimer()
      log(`fetching_user_cache`)
      const users = await this.getUserLookup(rounds)
      log(`fetched_user_cache`, { unit: command.unit, rounds: rounds.length, users: users.size, duration_ms: fetchUsersTime.getMs() })

      const getScoresTime = beginTimer()
      log(`building_scores`, { unit: command.unit, rounds: rounds.length })
      const scoreView = rounds.map(round => RoundScoreView.fromDbView(round, users))
      log(`built_scores`, { unit: command.unit, duration_ms: getScoresTime.getMs() })

      const scores = Scores.fromRoundViews(scoreView)
      const timeframe = command.unit === 'alltime' ? "since the dawn of time itself" : `from the last ${command.unit}`
      return Send(command.source, new ScoresByRatingMessage(scores, timeframe))
    }
  }

  async getUser(id: string): Promise<Discord.User> {
    const t = beginTimer()
    const user = await this.context.client.users.fetch(id, true)
    log.trace(`fetched_user`, logUser(user), { duration_ms: t.getMs() })
    return user
  }

  async getUserLookup(rounds: RoundDbView[]): Promise<Map<string, Discord.User>> {
    const ids = getUniqueIds(rounds)
    const users = await Promise.all(ids.map(id => this.getUser(id)))
    return new Map(users.map((u, i) => [ids[i], u]))
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
        this.guildStates.set(action.newState.context.guild, action.newState)
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
      log(event, logGuild(newState.context.guild), { state: getName(newState) }, logState(newState))
    } else if (action.type === 'send-message') {
      const {message, destination} = action
      log(event, logSource(destination), { message: getName(message) }, logMessage(message))
    } else if (action.type === 'save-round') {
      log(event, logChannel(action.round.channel), { round: action.round.id })
    }
  }

  logCommand = (input: Command | ScopedCommand) => {
    const command = input instanceof ScopedCommand ? input.command : input
    const guild = input instanceof ScopedCommand ? logGuild(input.guild) : undefined
    const event = `command:${command.type}`
    switch (command.type) {
      case Begin.type:
        log(event, guild, logUser(command.user))
        break;

      case GetScores.type:
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

      case Skip.type:
        log(event, guild)
        break;

      case Submit.type:
        log(event, guild, logUser(command.user), { submission: command.submission })
        break;

      case Vote.type:
        log(event, guild, logUser(command.user), { entry: command.entry })
        break;
    
      default:
        break;
    }
  }
}

const unhandled = Symbol()


function getUniqueIds(rounds: RoundDbView[]): string[] {
  const ids = new Set<string>()
  for (const r of rounds) {
    for (const s of r.submissions.values()) {
      ids.add(s.submitterId)
      // we can skip the voters because every voter must have submitted
    }
  }

  return Array.from(ids)
}