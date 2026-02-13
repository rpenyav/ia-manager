import { IconStatus } from "./icons/IconStatus";

type StatusBadgeIconProps = {
  status?: string | boolean | null;
  title?: string;
  className?: string;
};

export const StatusBadgeIcon = ({
  status,
  title,
  className,
}: StatusBadgeIconProps) => {
  const isActive = status === true || status === "active";
  const resolvedTitle =
    title ??
    (typeof status === "string"
      ? status
      : isActive
        ? "active"
        : "disabled");
  const resolvedClassName = `status-icon ${
    isActive ? "is-active" : "is-disabled"
  }${className ? ` ${className}` : ""}`;

  return (
    <span
      className={resolvedClassName}
      title={resolvedTitle}
      aria-label={resolvedTitle}
      data-tooltip={resolvedTitle}
    >
      <IconStatus title={resolvedTitle} />
    </span>
  );
};
