import type { User } from '@privy-io/react-auth'

type LinkedAccount = User['linkedAccounts'][number]

function getAccountDisplay(account: LinkedAccount): { type: string; name: string } | null {
  switch (account.type) {
    case 'google_oauth':
      return { type: 'Google', name: (account as { name?: string }).name ?? (account as { email?: string }).email ?? '' }
    case 'twitter_oauth':
      return { type: 'Twitter', name: `@${(account as { username?: string }).username ?? ''}` }
    case 'discord_oauth':
      return { type: 'Discord', name: (account as { username?: string }).username ?? '' }
    case 'github_oauth':
      return { type: 'GitHub', name: (account as { username?: string }).username ?? '' }
    case 'email':
      return { type: 'Email', name: (account as { address?: string }).address ?? '' }
    case 'phone':
      return { type: 'Phone', name: (account as { phoneNumber?: string }).phoneNumber ?? '' }
    default:
      return null
  }
}

export default function UserCard({ user }: { user: User }) {
  const socials = user.linkedAccounts
    .map(getAccountDisplay)
    .filter((a): a is { type: string; name: string } => a !== null)

  return (
    <div className="card">
      <div className="user-card-header">
        <div>
          <div className="user-id-label">Privy User ID</div>
          <div className="user-id-value">{user.id}</div>
        </div>
      </div>
      {socials.length > 0 && (
        <div className="linked-accounts">
          {socials.map((account, i) => (
            <div key={i} className="linked-account-row">
              <span className="account-type-badge">{account.type}</span>
              <span className="account-name">{account.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
