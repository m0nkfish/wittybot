import * as Discord from 'discord.js'
import { Case } from '../../case'

import { Duration } from '../../duration';

export const Begin = Case('witty-begin', (user: Discord.User, channel: Discord.TextChannel, timeout: Duration, minPlayers: number, race: number) => ({ channel, user, timeout, minPlayers, race }))
