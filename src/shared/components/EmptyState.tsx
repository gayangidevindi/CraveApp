import { StatusMessage } from './StatusMessage';
import type { ComponentProps } from 'react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ComponentProps<typeof StatusMessage>['icon'];
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'Try again later or explore something new.',
  icon = 'inbox',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <StatusMessage
      icon={icon}
      title={title}
      message={message}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
