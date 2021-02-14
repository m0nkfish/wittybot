import { Command, ScopedCommand, GlobalCommandHandler, Help } from '../commands';
import { log, loggableError } from '../log';
import { logUser, logMember, logSource, logGuild } from '../witty/loggable';
import { Begin, Skip, Submit, Vote, GetScores, In, Out, Notify, Unnotify } from '../witty/commands';

export const LoggedCommandHandler = (handler: GlobalCommandHandler) =>
  new GlobalCommandHandler(async command => {
    try {
      logCommand(command)
      return handler.handle(command)
    } catch (err) {
      log.error('error:handle_command', loggableError(err))
    }
  })

export function logCommand(input: Command) {
  const command = input.type === ScopedCommand.type ? input.scopedCommand : input
  const guild = input.type === ScopedCommand.type ? logGuild(input.guild) : undefined
  const event = `command:${command.type}`
  switch (command.type) {
    case Begin.type:
      log(event, guild, logUser(command.user))
      break;

    case GetScores.type:
      log(event, guild, { unit: command.unit }, logSource(command.source))
      break;

    case Help.type:
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