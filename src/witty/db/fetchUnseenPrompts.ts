import * as io from 'io-ts'
import * as Discord from 'discord.js';
import { query } from '../../db';

/** fetches prompts that have not been seen in the last (total/2) rounds */
export async function fetchUnseenPrompts(guild: Discord.Guild) {
  const tPrompt = io.type({
    id: io.number,
    text: io.string,
    type: io.string
  })
  const sql = `
    select id, text, type from prompts p
    left join (
      select prompt_id
      from rounds
      where guild_id = $1
      group by (prompt_id)
      order by max(finished) desc
      limit (select count(*) / 2 from prompts where active = true)
    ) seen on seen.prompt_id = p.id
    where seen.prompt_id is null and p.active = true
  `
  return query(tPrompt, sql, [guild.id], "fetch_prompts")
}