#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * Fix Payload media filename drift after repeated seeding.
 *
 * Safe strategy for Payload + SQLite:
 * 1) Back up payload.db.
 * 2) Group media rows by canonical filename (remove trailing -digits).
 * 3) For each duplicate group, keep the newest/highest ID row, repoint known
 *    media relationship columns to that keeper ID, delete duplicate media rows.
 * 4) Normalize keeper filename/url/size filenames to clean canonical names.
 * 5) Clear .next, run build, start dev on localhost:3000.
 */

const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { spawn, spawnSync, execSync } = require('node:child_process')
const { DatabaseSync } = require('node:sqlite')

const ROOT = process.cwd()
const DB_PATH = path.join(ROOT, 'payload.db')
const MEDIA_DIR = path.join(ROOT, 'public', 'media')
const NEXT_DIR = path.join(ROOT, '.next')
const LOG_PATH = path.join(ROOT, 'dev-server.log')
const PID_PATH = path.join(ROOT, '.dev-server.pid')

const MEDIA_REL_COLS = new Set([
  'media_id',
  'image_id',
  'background_image_id',
  'mobile_image_id',
  'hero_image_id',
  'portrait_id',
  'seo_image_id',
  'og_image_id',
  'footer_logo_id',
  'version_portrait_id',
  'version_hero_image_id',
  'version_seo_image_id',
])

function sh(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`)
  const res = spawnSync(cmd, { cwd: ROOT, shell: true, stdio: 'inherit', ...opts })
  if (res.status !== 0) throw new Error(`Command failed (${res.status}): ${cmd}`)
}

function qIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`
}

function normalizeFilename(name) {
  if (!name || typeof name !== 'string') return name
  const parsed = path.posix.parse(name)
  if (!parsed.ext) return name
  const normalizedBase = parsed.name.replace(/-\d+$/, '')
  return path.posix.join(parsed.dir, `${normalizedBase}${parsed.ext}`)
}

function normalizeUrl(value) {
  if (!value || typeof value !== 'string') return value
  const qIndex = value.search(/[?#]/)
  const main = qIndex >= 0 ? value.slice(0, qIndex) : value
  const suffix = qIndex >= 0 ? value.slice(qIndex) : ''
  const slash = main.lastIndexOf('/')
  if (slash < 0) return normalizeFilename(main) + suffix
  return main.slice(0, slash + 1) + normalizeFilename(main.slice(slash + 1)) + suffix
}

function normalizeCell(column, value) {
  if (value == null || typeof value !== 'string') return value
  if (column === 'filename' || column.endsWith('_filename')) return normalizeFilename(value)
  if (column === 'url' || column.endsWith('_url') || column === 'thumbnail_u_r_l') return normalizeUrl(value)
  return value
}

function stopPort3000() {
  try {
    const out = execSync("ss -ltnp | grep ':3000' || true", { encoding: 'utf8' })
    if (out.trim()) {
      console.log('\nStopping existing process on port 3000:')
      console.log(out.trim())
      execSync("ss -ltnp | awk '/:3000/ {print $0}' | sed -n 's/.*pid=\\([0-9]*\\).*/\\1/p' | sort -u | xargs -r kill", { stdio: 'inherit' })
    }
  } catch (err) {
    console.warn('[warn] Could not stop port 3000 automatically:', err.message)
  }
}

function backupDb() {
  if (!fs.existsSync(DB_PATH)) throw new Error(`Database not found: ${DB_PATH}`)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(ROOT, `payload.db.backup-before-media-fix-${stamp}`)
  fs.copyFileSync(DB_PATH, backupPath)
  console.log(`Backup created: ${backupPath}`)
  return backupPath
}

function mediaRefTargets(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name)
  const targets = []
  for (const table of tables) {
    const cols = db.prepare(`PRAGMA table_info(${qIdent(table)})`).all()
    for (const col of cols) {
      if (table === 'media' && col.name === 'id') continue
      if (MEDIA_REL_COLS.has(col.name)) targets.push({ table, column: col.name })
    }
  }
  return targets
}

function mergeMediaLocales(db, duplicateIds, keeperId) {
  const existingLocales = new Set(
    db.prepare('SELECT _locale FROM media_locales WHERE _parent_id = ?').all(keeperId).map((r) => r._locale),
  )
  for (const dupId of duplicateIds) {
    const rows = db.prepare('SELECT * FROM media_locales WHERE _parent_id = ?').all(dupId)
    for (const row of rows) {
      if (!existingLocales.has(row._locale)) {
        db.prepare('UPDATE media_locales SET _parent_id = ? WHERE id = ?').run(keeperId, row.id)
        existingLocales.add(row._locale)
      } else {
        db.prepare('DELETE FROM media_locales WHERE id = ?').run(row.id)
      }
    }
  }
}

function fixMediaRows() {
  const db = new DatabaseSync(DB_PATH)
  const mediaCols = db.prepare('PRAGMA table_info(media)').all().map((c) => c.name)
  const normalizableCols = mediaCols.filter((c) =>
    c === 'filename' || c.endsWith('_filename') || c === 'url' || c.endsWith('_url') || c === 'thumbnail_u_r_l',
  )

  const rows = db.prepare(`SELECT ${mediaCols.map(qIdent).join(', ')} FROM media ORDER BY id`).all()
  const groups = new Map()
  for (const row of rows) {
    const canonical = normalizeFilename(row.filename)
    if (!groups.has(canonical)) groups.set(canonical, [])
    groups.get(canonical).push(row)
  }

  const refTargets = mediaRefTargets(db)
  let duplicateRowsDeleted = 0
  let referencesRepointed = 0
  let canonicalRowsUpdated = 0
  const duplicateGroups = []
  const missingOriginals = []

  db.exec('BEGIN')
  try {
    for (const [canonical, group] of groups.entries()) {
      const localPath = path.join(MEDIA_DIR, canonical)
      if (!fs.existsSync(localPath)) missingOriginals.push(canonical)

      // Keep highest ID: after repeated seed runs, the newest rows are usually
      // what current page/artist/work records reference.
      const sorted = [...group].sort((a, b) => Number(a.id) - Number(b.id))
      const keeper = sorted[sorted.length - 1]
      const duplicateIds = sorted.slice(0, -1).map((r) => r.id)

      if (duplicateIds.length) {
        duplicateGroups.push({ canonical, keeperId: keeper.id, duplicateIds })
        for (const { table, column } of refTargets) {
          const stmt = db.prepare(`UPDATE ${qIdent(table)} SET ${qIdent(column)} = ? WHERE ${qIdent(column)} = ?`)
          for (const dupId of duplicateIds) {
            const res = stmt.run(keeper.id, dupId)
            referencesRepointed += Number(res.changes || 0)
          }
        }
        mergeMediaLocales(db, duplicateIds, keeper.id)
        for (const dupId of duplicateIds) {
          db.prepare('DELETE FROM media_locales WHERE _parent_id = ?').run(dupId)
          db.prepare('DELETE FROM media WHERE id = ?').run(dupId)
          duplicateRowsDeleted++
        }
      }

      const fresh = db.prepare('SELECT * FROM media WHERE id = ?').get(keeper.id)
      const patch = {}
      for (const col of normalizableCols) {
        const next = normalizeCell(col, fresh[col])
        if (next !== fresh[col]) patch[col] = next
      }
      if (Object.keys(patch).length) {
        const cols = Object.keys(patch)
        db.prepare(`UPDATE media SET ${cols.map((c) => `${qIdent(c)} = ?`).join(', ')} WHERE id = ?`).run(
          ...cols.map((c) => patch[c]),
          keeper.id,
        )
        canonicalRowsUpdated++
      }
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    db.close()
    throw err
  }

  const remainingSuffixed = db.prepare("SELECT COUNT(*) AS n FROM media WHERE filename GLOB '*-[0-9]*.*'").get().n
  console.log('\nMedia normalization summary:')
  console.log(`- media rows before: ${rows.length}`)
  console.log(`- duplicate groups collapsed: ${duplicateGroups.length}`)
  console.log(`- duplicate media rows deleted: ${duplicateRowsDeleted}`)
  console.log(`- relationship cells repointed: ${referencesRepointed}`)
  console.log(`- canonical media rows normalized: ${canonicalRowsUpdated}`)
  console.log(`- remaining suffixed filenames in DB: ${remainingSuffixed}`)
  if (duplicateGroups.length) {
    console.log('\nSample collapsed groups:')
    for (const g of duplicateGroups.slice(0, 30)) console.log(`  ${g.canonical}: keep #${g.keeperId}, delete [${g.duplicateIds.join(', ')}]`)
    if (duplicateGroups.length > 30) console.log(`  ... ${duplicateGroups.length - 30} more`)
  }
  if (missingOriginals.length) {
    console.log('\nWarning: normalized filenames missing from public/media:')
    for (const name of missingOriginals.slice(0, 40)) console.log(`  ${name}`)
    if (missingOriginals.length > 40) console.log(`  ... ${missingOriginals.length - 40} more`)
  }

  db.close()
  return { mediaRowsBefore: rows.length, duplicateGroups: duplicateGroups.length, duplicateRowsDeleted, referencesRepointed, canonicalRowsUpdated, remainingSuffixed, missingOriginals: missingOriginals.length }
}

function clearNextCache() {
  if (fs.existsSync(NEXT_DIR)) {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true })
    console.log(`\nRemoved cache: ${NEXT_DIR}`)
  } else {
    console.log(`\nNo .next cache found: ${NEXT_DIR}`)
  }
}

function startDevServer() {
  stopPort3000()
  console.log(`\nStarting dev server; log: ${LOG_PATH}`)
  const logFd = fs.openSync(LOG_PATH, 'a')
  const child = spawn('npm', ['run', 'dev'], { cwd: ROOT, detached: true, stdio: ['ignore', logFd, logFd], env: { ...process.env, PORT: '3000' } })
  child.unref()
  fs.writeFileSync(PID_PATH, String(child.pid))
  fs.closeSync(logFd)
  console.log(`Dev server PID: ${child.pid}`)
  return child.pid
}

function waitForHttp(url, timeoutMs = 90000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    function attempt() {
      const req = http.get(url, (res) => { res.resume(); resolve({ statusCode: res.statusCode }) })
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error(`Timed out waiting for ${url}`))
        else setTimeout(attempt, 1500)
      })
      req.setTimeout(3000, () => {
        req.destroy()
        if (Date.now() - started > timeoutMs) reject(new Error(`Timed out waiting for ${url}`))
        else setTimeout(attempt, 1500)
      })
    }
    attempt()
  })
}

async function main() {
  console.log('=== Aurora media filename repair ===')
  stopPort3000()
  const backupPath = backupDb()
  const summary = fixMediaRows()
  clearNextCache()
  sh('npm run build')
  const pid = startDevServer()
  const probe = await waitForHttp('http://127.0.0.1:3000/')
  console.log('\n=== DONE ===')
  console.log(JSON.stringify({ backupPath, summary, devServerPid: pid, localhost3000: probe }, null, 2))
}

main().catch((err) => {
  console.error('\nFAILED:', err)
  process.exit(1)
})
