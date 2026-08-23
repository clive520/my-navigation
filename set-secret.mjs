import { readFileSync } from 'fs'

const config = readFileSync(`${process.env.APPDATA}/xdg.config/.wrangler/config/default.toml`, 'utf-8')
const token = config.match(/oauth_token\s*=\s*"(.+?)"/)[1]
const ACCOUNT_ID = 'ca5d155a8d1dcb2a9ee6770606e12a15'
const PROJECT = 'my-navigation'

const getRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}`, {
  headers: { Authorization: `Bearer ${token}` }
})
const project = await getRes.json()

const currentVars = project.result.deployment_configs.production.env_vars || {}
const updatedVars = { ...currentVars, ADMIN_PASSWORD: { value: 'admin123' } }

const patchRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deployment_configs: {
      production: {
        env_vars: updatedVars
      }
    }
  })
})
const result = await patchRes.json()
console.log('Success:', result.success)
if (result.errors?.length) console.log('Errors:', result.errors)

// Verify
const verifyRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}`, {
  headers: { Authorization: `Bearer ${token}` }
})
const verify = await verifyRes.json()
console.log('Password value now:', verify.result.deployment_configs.production.env_vars?.ADMIN_PASSWORD?.value || 'EMPTY')
