interface QuickActionsProps {
  unreadMessages: number
  adminId:        string
}

export default function QuickActions({ unreadMessages, adminId }: QuickActionsProps) {
  const actions = [
    {
      label: '📍 Add new property →',
      href:  '/dashboard/add',
    },
    {
      label: '💬 View messages →',
      href:  '/dashboard/messages',
      badge: unreadMessages > 0 ? unreadMessages : null,
    },
    {
      label: '👁 View your listings →',
      href:  `/browse?adminId=${adminId}`,
    },
    {
      label: '⚙ Edit profile →',
      href:  '/dashboard/profile',
    },
  ]

  return (
    <div className="bg-surface border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-sans font-bold text-[13px] text-ink">Quick actions</h3>
      </div>
      <div className="p-4 flex flex-col gap-2">
        {actions.map(action => (
          <a
            key={action.label}
            href={action.href}
            className="flex items-center justify-between w-full border border-border px-4 py-2.5 font-sans font-medium text-[12px] text-accent hover:bg-accent-l hover:border-accent/30 transition-colors"
          >
            <span>{action.label}</span>
            {action.badge !== null && action.badge !== undefined && (
              <span className="bg-accent text-white font-sans font-bold text-[9px] px-1.5 py-0.5 min-w-[18px] text-center">
                {action.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
