import { Case } from "../../case";
import { Player } from '../model/Player';

export const Vote = Case('mafia-vote', (user: Player, target: Player) => ({ user, target }))