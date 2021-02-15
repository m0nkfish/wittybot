import { AnyGameState } from "../state";
import * as Discord from 'discord.js';
import { GlobalCommandFactory } from './global-command-factory';
import { ScopedCommand } from "./command";
import { GuildStates } from "../GuildStates";
import { CommandFactory } from "./scoped-command-factory";
import { isNonNull } from '../util';
import { MessageReceived } from "../discord-events";

export class ScopedGlobalCommandFactory extends GlobalCommandFactory {
  constructor(
    guilds: GuildStates,
    scopedFactory: CommandFactory<ScopedCommand>) {
    super(event => {
      if (event.type === MessageReceived.type) {
        const {message} = event
        if (message instanceof Discord.NewsChannel) {
          return
        }

        if (message.guild) {
          const state = guilds.getState(message.guild)
          const command = scopedFactory.process(state, event)
          if (command) {
            return ScopedCommand(message.guild, command)
          }
        }

        if (message.channel instanceof Discord.DMChannel) {
          const commands = guilds.all
            .filter(([guild]) => guild.member(message.author) !== null)
            .map(([guild, state]) => {
              const command = scopedFactory.process(state, event)
              if (command) {
                return ScopedCommand(guild, command)
              }
            })
            .filter(isNonNull)

          if (commands.length === 1) {
            return commands[0]
          }

          if (commands.length > 1) {
            message.reply(`Sorry, could not establish which server you meant to send this command to`)
          }
        }
      }
    })
  }
}