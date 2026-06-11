// Keyword-based classification mapped onto the badge classes in globals.css,
// so every status renders consistently across all admin tables.
function classify(status: string): string {
    const s = status.toLowerCase();
    if (/(reject|fail|cancel|expir|inactive|suspend)/.test(s)) return 'badge-danger';
    if (/(verified|approved|onboarded|completed|complete|active|operational|signed|success|paid)/.test(s)) return 'badge-success';
    if (/(pending|requested|uploaded|submitted|awaiting|review|lead)/.test(s)) return 'badge-warning';
    if (/(scheduled|invited|in_progress|in progress|created)/.test(s)) return 'badge-info';
    return 'badge-secondary';
}

export function formatStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
}

export default function StatusBadge({
    status,
    className = '',
}: {
    status: string | null | undefined;
    className?: string;
}) {
    if (!status) return null;
    return (
        <span className={`badge ${classify(status)} ${className}`}>
            {formatStatusLabel(status)}
        </span>
    );
}
