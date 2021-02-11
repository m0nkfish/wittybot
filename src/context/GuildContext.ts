import { GlobalContext } from './GlobalContext';
import * as Discord from 'discord.js';
import { Option } from 'fp-ts/Option';
import { GameContext } from '../witty/context';
import { Id } from '../id';

export class GuildContext extends GlobalContext {
  constructor(
    readonly globalCtx: GlobalContext,
    readonly guild: Discord.Guild
  ) {
    super(globalCtx.client, globalCtx.config)
  }

  newWittyGame = (channel: Discord.TextChannel, initiator: Discord.User, timeoutSec: number, minPlayers: number, race: Option<number>) =>
    new GameContext(this, channel, Id.create(), initiator, [], timeoutSec, minPlayers, race)
}