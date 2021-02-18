import { Case } from "../../case";
import { Player } from '../model/Player';

export const Retract = Case('retract', (player: Player) => ({ player }))