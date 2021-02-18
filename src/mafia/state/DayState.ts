import * as Discord from 'discord.js';
import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, Send } from '../../actions';
import { GameState, IdleState } from "../../state";
import { Timer } from '../../util';
import { DayDuration } from '../constants';
import { MafiaGameContext } from '../context';
import { DayBeginsPublicMessage, VotingOverMessage, WinnersMessage } from '../messages';
import { Player } from '../model/Player';
import { Players } from "../model/Players";
import { PlayerVotes } from "../model/PlayerVotes";
import { NightState } from "./NightState";

export class DayState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaGameContext,
    readonly players: Players,
    readonly playerVotes: PlayerVotes,
    readonly round: number,
    readonly timer: Timer
  ) { }

  remaining = () => DayDuration.subtract(this.timer.duration())

  vote = (voter: Player, votee: Player) =>
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

  static enter(context: MafiaGameContext, deaths: Discord.User[], statuses: Players, round: number): Action {
    const onTimeout = FromStateAction(context.guild, state =>
      OptionalAction(state instanceof DayState && state.context.sameGame(context) && state.sundown()))

    return CompositeAction(
      NewState(new DayState(context, statuses, new PlayerVotes(new Map()), round + 1, Timer.begin())),
      Send(context.channel, new DayBeginsPublicMessage(context, round + 1, deaths, statuses)),
      DelayedAction(DayDuration, onTimeout)
    )
  }

}