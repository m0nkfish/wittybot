import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, Send } from '../../actions';
import { GameState, IdleState } from "../../state";
import { Timer } from '../../util';
import { MafiaGameContext, MafiaRoundContext } from '../context';
import { DayBeginsPublicMessage, VotingOverMessage, WinnersMessage } from '../messages';
import { Player } from '../model/Player';
import { Players } from "../model/Players";
import { PlayerVotes } from "../model/PlayerVotes";
import { NightState } from "./NightState";

export class DayState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaRoundContext,
    readonly players: Players,
    readonly votes: PlayerVotes,
    readonly timer: Timer
  ) { }

  remaining = () => this.context.settings.dayDuration.subtract(this.timer.duration())

  vote = (voter: Player, votee: Player) =>
    new DayState(this.context, this.players, this.votes.vote(voter, votee), this.timer)

  cancelVote = (voter: Player) =>
    new DayState(this.context, this.players, this.votes.cancel(voter), this.timer)

  sundown = (): Action => {
    const toBeKilled = this.votes.winner()
    const newStatus = toBeKilled ? this.players.execute(toBeKilled, this.context.round) : this.players
    const winners = newStatus.checkWinners()

    const nextState = winners
      ? CompositeAction(
          NewState(new IdleState(this.context.guildCtx)),
          Send(this.context.channel, new WinnersMessage(winners, newStatus)))
      : NightState.enter(this.context.nextRound(), newStatus)

    return CompositeAction(
      Send(this.context.channel, new VotingOverMessage(this.context, toBeKilled)),
      nextState
    )
  }

  static enter(context: MafiaRoundContext, statuses: Players): Action {
    const onTimeout = FromStateAction(context.guild, state =>
      OptionalAction(state instanceof DayState && state.context.sameGame(context) && state.sundown()))

    const newContext = context.nextRound()

    return CompositeAction(
      NewState(new DayState(newContext, statuses, new PlayerVotes(new Map()), Timer.begin())),
      Send(newContext.channel, new DayBeginsPublicMessage(newContext, statuses)),
      DelayedAction(context.settings.dayDuration, onTimeout)
    )
  }

}