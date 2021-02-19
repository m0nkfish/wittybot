import { Case } from "../../case";
import { Player } from '../model/Player';

export const Idle = Case('mafia-idle', (user: Player) => ({ user, target: undefined }))