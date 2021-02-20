import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, Send, toAction } from '../../actions';
import { Duration } from '../../duration';
import { GameState, IdleState, pause } from "../../state";
import { Timer } from '../../util';
import { MafiaGameContext, MafiaRoundContext } from '../context';
import { DayBeginsPublicMessage, DayEndsPublicMessage, WinnersMessage } from '../messages';
import { NotifyRoleCountsMessage } from '../messages/NotifyRoleCountsMessage';
import { Player } from '../model/Player';
import { Players } from "../model/Players";
import { Votes } from "../model/Votes";
import { NightState } from "./NightState";

export class DayState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaRoundContext,
    readonly players: Players,
    readonly votes: Votes,
    readonly timer: Timer
  ) { }

  remaining = () => this.context.settings.dayDuration.subtract(this.timer.duration())

  vote = (voter: Player, votee: Player) =>
    new DayState(this.context, this.players, this.votes.vote(voter, votee), this.timer)

  cancelVote = (voter: Player) =>
    new DayState(this.context, this.players, this.votes.cancel(voter), this.timer)

  allVoted = () =>
    this.players.alive().length === this.votes.votes.size

  sundown = (): Action => {
    const { context, players, votes } = this
    return toAction(function* () {
      const toBeKilled = votes.winner()

      yield Send(context.channel, new DayEndsPublicMessage(context, toBeKilled))

      const newStatus = toBeKilled ? players.execute(toBeKilled, context.round) : players
      const winners = newStatus.checkWinners()
      if (winners) {
        yield NewState(new IdleState(context.guildCtx))
        yield Send(context.channel, new WinnersMessage(winners, newStatus))
      } else {
        yield Send(context.channel, new NotifyRoleCountsMessage(newStatus)),
          yield NightState.enter(context.nextRound(), newStatus)
      }
    })
  }

  static enter(context: MafiaRoundContext, statuses: Players): Action {
    return pause(Duration.seconds(5), context, () => CompositeAction(
      NewState(new DayState(context, statuses, new Votes, Timer.begin())),
      Send(context.channel, new DayBeginsPublicMessage(context, statuses)),
      DelayedAction(context.settings.dayDuration, FromStateAction(context.guild, state =>
        OptionalAction(state instanceof DayState && state.context.sameRound(context) && state.sundown())))
    ))
  }

}