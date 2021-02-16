import { Action, CompositeAction, Send, NewState } from '../../actions';
import { GameState } from "../../state";
import { Timer, isNonNull } from '../../util';
import { NightDuration } from '../constants';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../PlayerStatuses";
import { Role, roleCommands } from '../role';
import { NightBeginsPublicMessage, NightRoleMessage } from '../messages';

export class NightState implements GameState<MafiaGameContext> {
  
  constructor(
    readonly context: MafiaGameContext,
    readonly statuses: PlayerStatuses,
    readonly round: number,
    readonly timer: Timer
  ) {}

  remaining = () => NightDuration.subtract(this.timer.duration())

  static enter(context: MafiaGameContext, statuses: PlayerStatuses, round: number): Action {
    const nightRolePMs = statuses.alive()
      .filter(([_, { role }]) => role !== Role.Villager)
      .map(([user, { role }]) => {
        const command = roleCommands.get(role)?.night
        if (command) {
          return Send(user, new NightRoleMessage(role, command, statuses, round))
        }
      })
      .filter(isNonNull)

    return CompositeAction(
      ...nightRolePMs,
      Send(context.channel, new NightBeginsPublicMessage(context, round)),
      NewState(new NightState(context, statuses, round, Timer.begin()))
    )
  }
}