import { StatusMessage } from './StatusMessage';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <StatusMessage
      icon="alert-circle"
      title={title}
      message={message}
      actionLabel={onRetry ? retryLabel : undefined}
      onAction={onRetry}
      variant="outline"
    />
  );
}
