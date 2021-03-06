import * as Discord from 'discord.js';
import { Subject } from 'rxjs';
import { Action, AddUserToRole, CompositeAction, FromStateAction, NewState, NullAction, PromiseAction, RegisterCommand, RemoveUserFromRole, SaveRound, Send } from './actions';
import { Command } from './commands';
import { DiscordIO } from './DiscordIO';
import { GuildStates } from './GuildStates';
import { log, logType } from './log';
import { Message } from './messages';
import { saveRound } from "./witty/db";
import { logChannel, logGuild, logMessage, logSource, logState } from './witty/loggable';

export class ActionExecutor {
  constructor(private readonly guilds: GuildStates, private readonly io: DiscordIO) {}

  private readonly commandSubject = new Subject<Command>()
  private readonly messageSubject = new Subject<[Discord.Message, Message]>()

  public readonly commandStream = this.commandSubject.asObservable()
  public readonly messageStream = this.messageSubject.asObservable()

  execute = (action: Action) => {
    logAction(action)

    switch (action.type) {
      case CompositeAction.type:
        action.actions.forEach(this.execute)
        return

      case PromiseAction.type:
        action.promise.then(action => this.execute(action))
        return

      case FromStateAction.type:
        this.execute(action.getAction(this.guilds.getState(action.guild)))
        return

      case NewState.type:
        this.guilds.setState(action.newState.context.guild, action.newState)
        return

      case Send.type:
        this.io.send(action.destination, action.message)
        return

      case AddUserToRole.type:
        action.member.roles.add(action.role)
        return

      case RemoveUserFromRole.type:
        action.member.roles.remove(action.role)
        return

      case SaveRound.type:
        saveRound(action.round)
        return

      case RegisterCommand.type:
        this.commandSubject.next(action.command)
        return

      case NullAction.type:
        return
    }
  }
}

export function logAction(action: Action) {
  try {
    const event = `execute-action:${action.type}`
    if (action.type === 'new-state') {
      const { newState } = action
      log(event, logGuild(newState.context.guild), logType(newState), logState(newState))
    } else if (action.type === 'send-message') {
      const { message, destination } = action
      log(event, logSource(destination), logMessage(message))
    } else if (action.type === 'save-round') {
      log(event, logChannel(action.round.channel), { round: action.round.id })
    } else if (action.type === RegisterCommand.type) {
      log(event, { command: action.command.type })
    }
  } catch { }
}
