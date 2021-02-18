import { Case } from "../../case";
import { Player } from '../model/Player';

export const Distract = Case('mafia-distract', (user: Player, target: Player) => ({ user, target }))