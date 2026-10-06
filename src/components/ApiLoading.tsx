interface ApiLoadingProps {
  message: string;
  compact?: boolean;
}

export default function ApiLoading({ message, compact = false }: ApiLoadingProps) {
  return (
    <div
      aria-label={message}
      className={`api-loading${compact ? " api-loading-compact" : ""}`}
      role="status"
    >
      <img alt="" height="72" src="/media/carga.gif" width="72" />
      <span>{message}</span>
    </div>
  );
}
