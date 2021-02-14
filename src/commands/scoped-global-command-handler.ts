import { ScopedCommand } from "./command";
import { GuildStates } from "../GuildStates";
import { CommandHandler } from "./scoped-command-handler";
import { GlobalCommandHandler } from "./global-command-handler";

export class ScopedGlobalCommandHandler extends GlobalCommandHandler {
  constructor(
    guilds: GuildStates,
    scopedFactory: CommandHandler) {
    super(async command => {
      if (command.type === ScopedCommand.type) {
        const state = guilds.getState(command.guild)
        return scopedFactory.handle(state, command.scopedCommand)
      }
    })
  }
}