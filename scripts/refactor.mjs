import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const oldComponentsDir = path.join(rootDir, 'components')
const newComponentsDir = path.join(rootDir, 'src', 'components')

// 1. Move files
if (fs.existsSync(oldComponentsDir)) {
  const items = fs.readdirSync(oldComponentsDir)
  for (const item of items) {
    const oldPath = path.join(oldComponentsDir, item)
    const newPath = path.join(newComponentsDir, item)
    fs.renameSync(oldPath, newPath)
    console.log(`Moved: ${item}`)
  }
  fs.rmdirSync(oldComponentsDir)
  console.log('Removed old components directory.')
}

// 2. Update imports in src directory
function walkAndReplace(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      walkAndReplace(fullPath)
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      let changed = false
      
      // Regex to match imports like: from '../../components/something' or from '../components/something'
      const importRegex = /(['"])(?:\.\.\/)+components\/([^'"]+)(['"])/g
      if (importRegex.test(content)) {
        content = content.replace(importRegex, '$1@/components/$2$3')
        changed = true
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log(`Updated imports in: ${fullPath.replace(rootDir, '')}`)
      }
    }
  }
}

const srcDir = path.join(rootDir, 'src')
walkAndReplace(srcDir)
console.log('Done fixing component imports.')
