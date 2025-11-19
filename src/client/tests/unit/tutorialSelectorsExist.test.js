import fs from 'fs'
import path from 'path'
import { presentationTutorialSteps, homePageTutorialSteps } from '../../components/data/tutorialSteps'

/*
#########################################################################
This test ensures that all CSS selectors referenced in the tutorial steps
actually exist somewhere in the source code. This is important to prevent
broken tutorials that reference non-existent elements.

It works by extracting all selectors from the tutorial steps, converting
them into regex patterns, and searching all source files under src/ for
matches.

If a selector is not found, the test fails with an error indicating which
selector is missing.

For ids/classes that are dynamically generated and cannot be checked, they
should be excluded from this test by adding them to the excludeSelectors array.
#########################################################################
*/

// Helper to search files under src for a given regex
function searchRepoForPattern(regex) {
  const root = path.resolve(__dirname, '..', '..', '..', '..') // project root
  const src = path.join(root, 'src')
  const exts = ['.js', '.jsx', '.ts', '.tsx', '.html']

  const files = []
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        walk(p)
      } else if (exts.includes(path.extname(ent.name))) {
        files.push(p)
      }
    }
  }

  walk(src)

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8')
    if (regex.test(content)) return true
  }
  return false
}

function normalizeSelectorToPatterns(selector) {
  if (!selector) return []
  const escape = (s) => s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
  if (selector.startsWith('#')) {
    const name = escape(selector.slice(1))
    return [
      new RegExp(`id\\s*=\\s*["']${name}["']`, 'm'),
      new RegExp(`querySelector\\([^"']*["']#${name}["']\\)`, 'm'),
      new RegExp(`getElementById\\(\\s*["']${name}["']\\s*\\)`, 'm'),
      // also accept the literal string appearing in source (e.g., passed as a prop)
      new RegExp(`["']${name}["']`, 'm'),
    ]
  }
  if (selector.startsWith('.')) {
    const name = escape(selector.slice(1))
    return [
      new RegExp(`class(Name)?\\s*=\\s*["'][^"']*\\b${name}\\b[^"']*["']`, 'm'),
      new RegExp(`querySelector\\([^"']*["']\\.${name}["']\\)`, 'm'),
    ]
  }
  // fallback: literal search
  return [new RegExp(escape(selector), 'm')]
}

describe('tutorial selectors are referenced in source', () => {
  const allSteps = [...presentationTutorialSteps, ...homePageTutorialSteps]
  const excludeSelectors = [
    "#cue-screen-1-index-0" // dynamically generated, cannot check existence
  ]
  const stepsWithSelectors = allSteps.filter(s => s.selector && !excludeSelectors.includes(s.selector))

  test.each(stepsWithSelectors.map(s => [s.selector, s.id || s.selector]))(
    'selector %s (%s) is used in source files',
    (selector, id) => {
      const patterns = normalizeSelectorToPatterns(selector)
      expect(patterns.length).toBeGreaterThan(0)
      const found = patterns.some((pat) => searchRepoForPattern(pat))
      if (!found) {
        throw new Error(`Selector ${selector} (step ${id}) not found in source files. Tutorial will break.`) 
      }
    }
  )
})
