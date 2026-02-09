import type { ReactNode } from 'react';
import type { FieldHelpKey } from '../constants/fieldHelp';
import { InfoTooltip } from './InfoTooltip';

type Props = {
  help: FieldHelpKey;
  children: ReactNode;
  className?: string;
};

export function FieldWithHelp({ help, children, className }: Props) {
  return (
    <div className={`field-with-help${className ? ` ${className}` : ''}`}>
      {children}
      <InfoTooltip field={help} />
    </div>
  );
}
