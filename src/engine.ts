import { GlobalContext, GuildContext } from './context';
import { IdleState, AnyGameState } from './state';
import { Action, AddUserToRole, RemoveUserFromRole, CompositeAction, Send } from './actions';
import * as Discord from 'discord.js';
import { Command, Help, NotifyMe, UnnotifyMe, GetScores } from './commands';
import { getNotifyRole } from './notify';
import { BasicMessage, HelpMessage, Message, ScoresMessage } from './messages';
import * as db from './db'
import { SubmissionState } from './state/SubmissionState';
import { VotingState } from './state/VotingState';
import { RoundScoreView } from './round';
import { Scores, ScoreUnit } from './scores';
import { log } from './log';
import { GameState } from './state/GameState';

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
      const scores = /^!scores(?: (day|week|month|year|alltime))?$/.exec(message.content)
      if (scores) {
        const unit = (scores[1] ?? 'day') as ScoreUnit
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
      const rounds = await db.scores(command.source.guild, command.unit)
      const scoreView = await Promise.all(rounds.map(round => RoundScoreView.fromDbView(this.context.client, round)))
      const scores = Scores.fromRoundViews(scoreView)
      const timeframe = command.unit === 'alltime' ? "since the dawn of time itself" : `from the last ${command.unit}`
      return Send(command.source, new ScoresMessage(scores, timeframe))
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

  interpret = (action: Action): typeof handled => {
    this.log(action)
    switch (action.type) {
      case 'composite-action':
        action.actions.forEach(this.interpret)
        return handled
      case 'promise-action':
        action.promise.then(action => this.interpret(action))
        return handled
      case 'from-state-action':
        this.interpret(action.getAction(this.getState(action.guild)))
        return handled
      case 'new-state':
        this.states.set(action.newState.context.guild, action.newState)
        return handled
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
        return handled
      case 'add-user-to-role':
        action.member.roles.add(action.role)
        return handled
      case 'remove-user-from-role':
        action.member.roles.remove(action.role)
        return handled
      case 'save-round':
        db.saveRound(action.round)
        return handled
      case 'null-action':
        return handled
    }
  }

  log = (action: Action) => {
    if (action.type === 'promise-action') {
      log('promise_action')
    } else if (action.type === 'new-state') {
      const {newState} = action
      log('new_state_action', logGuild(newState.context.guild), { state: name(newState) }, logState(newState))
    } else if (action.type === 'send-message') {
      const {message, destination} = action
      const recipient = destination instanceof Discord.User ? `@${destination.username}` : `#${destination.name}`
      log('send_message', logGuild(destination instanceof Discord.TextChannel ? destination.guild : undefined), { message: name(message), recipient }, logMessage(message))
    }
  }
}

const usernames = (users: Iterable<Discord.User>) => Array.from(users).map(u => u.username).join(',')
const logGuild = (guild?: Discord.Guild) => ({ guildId: guild?.id, guildName: guild?.name })
const logState = (state: GameState<any>) =>
  state instanceof SubmissionState ? { submissions: usernames(state.submissions.keys()) }
  : state instanceof VotingState ? { submissions: usernames(state.submissions.map(x => x.user)), votes: usernames(state.votes.keys()) }
  : undefined

const logMessage = (message: Message) =>
  message instanceof BasicMessage ? { content: message.content }
  : undefined

const name = (obj: any) => obj?.constructor?.name

const handled = Symbol()