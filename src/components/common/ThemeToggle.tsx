import { Monitor, Moon, Sun } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';
import type { ResolvedTheme, ThemePreference } from '../../hooks/useThemePreference';

type ThemeToggleProps = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onChange: (preference: ThemePreference) => void;
};

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: 'system', label: 'Seguir tema do sistema', icon: Monitor },
  { value: 'light', label: 'Tema claro', icon: Sun },
  { value: 'dark', label: 'Tema escuro', icon: Moon }
];

const ThemeToggle = ({ preference, resolvedTheme, onChange }: ThemeToggleProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const offset = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex = (index + offset + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[nextIndex].value);
  };

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Preferência de tema">
      {OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isActive = preference === option.value;
        const description = option.value === 'system'
          ? `${option.label} (atual: tema ${resolvedTheme === 'dark' ? 'escuro' : 'claro'})`
          : option.label;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn('theme-toggle__option', isActive && 'theme-toggle__option--active')}
            title={description}
          >
            <Icon aria-hidden="true" className="theme-toggle__icon" />
            <span className="sr-only">{description}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
