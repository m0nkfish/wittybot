import { Case } from "../../case";
import { Player } from '../model/Player';

export const Kill = Case('mafia-kill', (user: Player, target: Player) => ({ user, target }))