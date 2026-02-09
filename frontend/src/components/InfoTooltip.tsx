import { fieldHelp, type FieldHelpKey } from '../constants/fieldHelp';

type Props = {
  field?: FieldHelpKey;
  text?: string;
};

export function InfoTooltip({ field, text }: Props) {
  const message = text ?? (field ? fieldHelp[field] : '');
  if (!message) {
    return null;
  }

  return (
    <span className="info-tooltip" tabIndex={0} aria-label={message}>
      <span className="info-icon">i</span>
      <span className="info-tooltip-text">{message}</span>
    </span>
  );
}
