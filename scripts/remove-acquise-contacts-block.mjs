import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const p = path.join(__dirname, '..', 'pages', 'admin.vue')
let s = fs.readFileSync(p, 'utf8')
const startMarker = '      <!-- Sub-Tab: Kontakte -->'
const nutzerMarker = '      <!-- Sub-Tab: Nutzer -->'
const a = s.indexOf(startMarker)
const b = s.indexOf(nutzerMarker)
if (a < 0 || b < 0) throw new Error('markers not found')
const tplNeedle = "      <template v-else-if=\"acquiseSubTab === 'users'\">"
const c = s.indexOf(tplNeedle, b)
if (c < 0) throw new Error('users template not found: ' + s.slice(b, b + 200))
const lineEnd = s.indexOf('\n', c)
const after = s.slice(lineEnd + 1)
const before = s.slice(0, a)
const ins =
  '      <!-- Sub-Tab: Nutzer -->\n      <template v-if="acquiseSubTab === \'users\'">\n'
fs.writeFileSync(p, before + ins + after, 'utf8')
console.log('Removed Kontakte block.')
