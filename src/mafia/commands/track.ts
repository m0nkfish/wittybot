import { Case } from "../../case";
import { Player } from '../model/Player';

export const Track = Case('mafia-track', (user: Player, target: Player) => ({ user, target }))