import { appendFile, mkdir, writeFile } from 'node:fs/promises'

const repo = process.env.GITHUB_REPOSITORY
const sha = process.env.REVIEW_HEAD_SHA
const pr = process.env.REVIEW_PR_NUMBER
const token = process.env.GITHUB_TOKEN
if (!repo || !sha || !pr || !token) throw new Error('Repository, exact head, PR number and read token are required.')
const expectedHost = `deploy-preview-${pr}--avenews-platform.netlify.app`
const headers = {Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'}
const deadline = Date.now() + 10 * 60 * 1000
let preview = null
while (Date.now() < deadline) {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/statuses?per_page=100`, {headers})
  if (!response.ok) throw new Error(`Cannot read commit statuses: HTTP ${response.status}`)
  const statuses = await response.json()
  const status = statuses.find(item => item.context === 'netlify/avenews-platform/deploy-preview')
  if (status?.state === 'success') {
    const url = new URL(status.target_url)
    if (url.protocol !== 'https:' || url.hostname !== expectedHost) throw new Error('The deploy status returned an unexpected preview URL.')
    const page = await fetch(new URL('/login',url), {redirect:'follow'})
    if (!page.ok) throw new Error(`The successful preview is not accessible: HTTP ${page.status}`)
    preview = {commit:sha, repository:repo, pullRequest:Number(pr), context:status.context, state:status.state, url:url.origin, checkedAt:new Date().toISOString()}
    break
  }
  if (status?.state === 'failure' || status?.state === 'error') throw new Error(`Netlify failed for ${sha}. Check the deploy log before reviewing.`)
  console.log(`Waiting for the Netlify Deploy Preview for ${sha.slice(0,8)}: ${status?.state ?? 'not posted yet'}`)
  await new Promise(resolve => setTimeout(resolve,10000))
}
if (!preview) throw new Error('The exact-head Netlify preview did not become ready within ten minutes.')
await mkdir('review-evidence',{recursive:true})
await writeFile('review-evidence/deploy.json',JSON.stringify(preview,null,2))
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,`url=${preview.url}\n`)
console.log(`Verified commit status and reachable preview: ${preview.url} @ ${sha}`)
