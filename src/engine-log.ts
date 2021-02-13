import { Action } from './actions';
import { log } from './log';
import { logUser, logMember, logSource, logGuild, logChannel, getName, logMessage, logState } from './witty/loggable';
import { Command, Begin, Skip, Submit, Vote, GetScores, In, Out, Notify, Unnotify } from './witty/commands';
import { ScopedCommand } from './engine';

export function logAction(action: Action) {
  const event = `action:${action.type}`
  if (action.type === 'new-state') {
    const { newState } = action
    log(event, logGuild(newState.context.guild), { state: getName(newState) }, logState(newState))
  } else if (action.type === 'send-message') {
    const { message, destination } = action
    log(event, logSource(destination), { message: getName(message) }, logMessage(message))
  } else if (action.type === 'save-round') {
    log(event, logChannel(action.round.channel), { round: action.round.id })
  }
}

export function logCommand(input: Command | ScopedCommand) {
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

    case In.type:
    case Out.type:
    case Notify.type:
    case Unnotify.type:
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