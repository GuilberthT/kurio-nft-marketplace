/**
 * Auditoria Lighthouse do Kurio.
 * Sobe o build de produção (com os mocks, cenário padrão), mede cada página
 * 3 vezes por perfil (mobile e desktop) e grava os relatórios e a mediana.
 *
 * Uso: npm run build && npm run lighthouse
 */
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const PORT = 4174
const BASE = `http://localhost:${PORT}`
const RUNS = 3
const OUT_DIR = path.resolve(import.meta.dirname, 'reports')
const PAGES = [
  { name: 'inicio', path: '/' },
  { name: 'detalhe', path: '/nft/emerald-ape-042' },
]
const PROFILES = {
  mobile: undefined, // padrão do Lighthouse: Moto G Power, 4G lenta, CPU 4x mais lenta
  desktop: desktopConfig,
}
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Servidor não respondeu em ${url}`)
}

const server = spawn(`npx vite preview --port ${PORT} --strictPort`, {
  shell: true,
  stdio: 'ignore',
})

const summary = []
let chrome
try {
  await waitForServer(BASE)
  await mkdir(OUT_DIR, { recursive: true })
  chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })

  for (const [profile, config] of Object.entries(PROFILES)) {
    for (const page of PAGES) {
      const runs = []
      for (let run = 1; run <= RUNS; run++) {
        const result = await lighthouse(
          `${BASE}${page.path}`,
          { port: chrome.port, output: ['html', 'json'], onlyCategories: CATEGORIES, logLevel: 'error' },
          config,
        )
        const base = path.join(OUT_DIR, `${page.name}-${profile}-${run}`)
        await writeFile(`${base}.html`, result.report[0])
        await writeFile(`${base}.json`, result.report[1])
        const { categories, audits } = result.lhr
        runs.push({
          scores: Object.fromEntries(CATEGORIES.map((key) => [key, Math.round(categories[key].score * 100)])),
          lcp: audits['largest-contentful-paint'].numericValue,
          cls: audits['cumulative-layout-shift'].numericValue,
          tbt: audits['total-blocking-time'].numericValue,
        })
        console.log(`${page.name} · ${profile} · medição ${run}:`, runs.at(-1).scores)
      }
      summary.push({
        page: page.name,
        profile,
        ...Object.fromEntries(CATEGORIES.map((key) => [key, median(runs.map((item) => item.scores[key]))])),
        lcpMs: Math.round(median(runs.map((item) => item.lcp))),
        cls: Number(median(runs.map((item) => item.cls)).toFixed(3)),
        tbtMs: Math.round(median(runs.map((item) => item.tbt))),
      })
    }
  }

  const environment = {
    date: new Date().toISOString(),
    lighthouse: JSON.parse(await readFile(new URL('../node_modules/lighthouse/package.json', import.meta.url), 'utf8')).version,
    chrome: (await (await fetch(`http://localhost:${chrome.port}/json/version`)).json()).Browser,
    node: process.version,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()[0]?.model,
    runsPerPage: RUNS,
    server: 'vite preview (build de produção, mocks ligados, cenário padrão)',
  }
  await writeFile(path.join(OUT_DIR, 'summary.json'), JSON.stringify({ environment, medians: summary }, null, 2))
  console.log('\nMedianas:')
  console.table(summary)
  console.log(environment)
} finally {
  await chrome?.kill()
  server.kill()
}