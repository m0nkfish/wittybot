import { GameState, IdleState } from "../../state";
import { Timer } from '../../util';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../PlayerStatuses";
import { DayDuration } from '../constants';
import * as Discord from 'discord.js';
import { Action, Send, CompositeAction, NewState, FromStateAction, OptionalAction, DelayedAction } from '../../actions';
import { PlayerVotes } from "../PlayerVotes";
import { WinnersMessage, VotingOverMessage, DayBeginsPublicMessage} from '../messages';
import { NightState } from "./NightState";

export class DayState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaGameContext,
    readonly players: PlayerStatuses,
    readonly playerVotes: PlayerVotes,
    readonly round: number,
    readonly timer: Timer
  ) { }

  remaining = () => DayDuration.subtract(this.timer.duration())

  vote = (voter: Discord.User, votee: Discord.User) =>
    new DayState(this.context, this.players, this.playerVotes.vote(voter, votee), this.round, this.timer)

  sundown = (): Action => {
    const toBeKilled = this.playerVotes.winner()
    const newStatus = toBeKilled ? this.players.kill([toBeKilled]) : this.players
    const winners = newStatus.checkWinners()

    const nextState = winners
      ? CompositeAction(
          NewState(new IdleState(this.context.guildCtx)),
          Send(this.context.channel, new WinnersMessage(winners, newStatus)))
      : NightState.enter(this.context, newStatus, this.round + 1)

    return CompositeAction(
      Send(this.context.channel, new VotingOverMessage(this.context, toBeKilled)),
      nextState
    )
  }

  static enter(context: MafiaGameContext, deaths: Discord.User[], statuses: PlayerStatuses, round: number): Action {
    const onTimeout = FromStateAction(context.guild, state =>
      OptionalAction(state instanceof DayState && state.context.sameGame(context) && state.sundown()))

    return CompositeAction(
      NewState(new DayState(context, statuses, new PlayerVotes(new Map()), round + 1, Timer.begin())),
      Send(context.channel, new DayBeginsPublicMessage(context, round + 1, deaths, statuses)),
      DelayedAction(DayDuration, onTimeout)
    )
  }

}