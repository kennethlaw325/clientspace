export function PortalHeader({
  workspaceName,
  brandColor,
  logoUrl,
}: {
  workspaceName: string;
  brandColor: string;
  logoUrl: string | null;
}) {
  return (
    <header className="border-b bg-white px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={workspaceName} className="h-8 w-8 rounded" />
        ) : (
          <div className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: brandColor }}>
            {workspaceName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-lg">{workspaceName}</span>
      </div>
    </header>
  );
}
