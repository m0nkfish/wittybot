import * as io from 'io-ts'
import { query } from '../../db';

export async function allReplacements() {
  const tReplacement = io.type({
    id: io.number,
    replacement: io.string,
    type: io.string
  })
  return query(tReplacement, `SELECT * FROM replacements`)
}
