import { Action, CompositeAction, Send, NewState } from '../../actions';
import { GameState } from "../../state";
import { Timer, isNonNull } from '../../util';
import { NightDuration } from '../constants';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../PlayerStatuses";
import { roleCommands } from '../role';
import { NightBeginsPublicMessage, NightRoleMessage } from '../messages';
import { PlayerIntentions, PlayerIntention } from '../PlayerIntentions';
import * as Discord from 'discord.js';

export class NightState implements GameState<MafiaGameContext> {
  
  constructor(
    readonly context: MafiaGameContext,
    readonly players: PlayerStatuses,
    readonly intentions: PlayerIntentions,
    readonly round: number,
    readonly timer: Timer,
  ) {}

  remaining = () => NightDuration.subtract(this.timer.duration())

  withIntention = (user: Discord.User, intention: PlayerIntention) =>
    new NightState(this.context, this.players, this.intentions.withIntention(user, intention), this.round, this.timer)

  static enter(context: MafiaGameContext, statuses: PlayerStatuses, round: number): Action {
    const nightRolePMs = statuses
      .alive()
      .map(([user, { role }]) => {
        const command = roleCommands.get(role)?.night
        if (command) {
          return Send(user, new NightRoleMessage(context, role, command, statuses, round))
        }
      })
      .filter(isNonNull)

    return CompositeAction(
      ...nightRolePMs,
      Send(context.channel, new NightBeginsPublicMessage(context, round)),
      NewState(new NightState(context, statuses, new PlayerIntentions(new Map()), round, Timer.begin()))
    )
  }
}