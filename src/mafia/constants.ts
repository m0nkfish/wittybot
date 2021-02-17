import { Duration } from "../duration"
import { CommandReacts } from "./messages/text"

export const StartingStateDelay = Duration.minutes(3)
export const MinPlayers = 2 //5
export const MaxPlayers = CommandReacts.length
export const NightDuration = Duration.minutes(1)
export const DayDuration = Duration.minutes(1)