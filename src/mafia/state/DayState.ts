import { GameState } from "../../state";
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../PlayerStatuses";

export class DayState implements GameState<MafiaGameContext> {

  constructor(
    readonly context: MafiaGameContext,
    readonly playerStatuses: PlayerStatuses,
    readonly round: number
  ) { }

}