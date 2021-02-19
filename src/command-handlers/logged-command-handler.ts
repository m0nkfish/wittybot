import { Command, GlobalCommandHandler, Help, In, Notify, Out, ScopedCommand } from '../commands';
import { log, Loggable, loggableError } from '../log';
import * as Mafia from '../mafia/commands';
import * as Witty from '../witty/commands';
import { logGuild, logMember, logSource, logUser } from '../witty/loggable';

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
  const toLog: Loggable[] = []

  switch (command.type) {
    case Mafia.Begin.type:
    case Witty.Begin.type:
      toLog.push(logUser(command.user))
      break

    case Witty.GetScores.type:
      toLog.push({ unit: command.unit }, logSource(command.source))
      break

    case Help.type:
      toLog.push(logSource(command.source))
      break

    case In.type:
    case Out.type:
    case Notify.type:
      toLog.push(logMember(command.member))
      break

    case Witty.Submit.type:
      toLog.push(logUser(command.user), { submission: command.submission })
      break

    case Witty.Vote.type:
      toLog.push(logUser(command.user), { entry: command.entry })
      break

    case Mafia.Begin.type:
      toLog.push(logUser(command.user))
      break;

    case Mafia.Distract.type:
    case Mafia.Kill.type:
    case Mafia.Protect.type:
    case Mafia.Track.type:
    case Mafia.Vote.type:
      toLog.push(logUser(command.user.user), { target: command.user.user.username })
      break;

    case Mafia.Retract.type:
      toLog.push(logUser(command.player.user))
      break;

    case Mafia.Idle.type:
      toLog.push(logUser(command.user.user))
      break
  }

  log(event, guild, ...toLog)
}