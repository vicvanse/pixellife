'use client';

interface ToggleIOSProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function ToggleIOS({ checked, onChange, disabled = false }: ToggleIOSProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: checked ? '#34C759' : '#E5E5E7',
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
        style={{
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
          transition: 'transform 0.2s ease-in-out',
        }}
      />
    </button>
  );
}

