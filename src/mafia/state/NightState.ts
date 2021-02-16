import { Action, NullAction } from '../../actions';
import { GameState } from "../../state";
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../PlayerStatuses";

export class NightState implements GameState<MafiaGameContext> {
  
  constructor(
    readonly context: MafiaGameContext,
    readonly statuses: PlayerStatuses,
    readonly round: number
  ) {}

  static enter(context: MafiaGameContext, statuses: PlayerStatuses, round: number): Action {
    return NullAction // TODO
  }
}