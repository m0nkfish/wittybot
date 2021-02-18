import { Case } from "../../case";
import { Player } from '../model/Player';

export const Protect = Case('mafia-protect', (user: Player, target: Player) => ({ user, target }))