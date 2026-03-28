"use client";

type CategoryRow = { code: string; name: string };

type MerchantServiceTypesPickerProps = {
  categories: CategoryRow[];
  title: string;
  selectedCodes: string[];
  onToggle: (code: string) => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
  savingLabel: string;
};

export default function MerchantServiceTypesPicker({
  categories,
  title,
  selectedCodes,
  onToggle,
  onSave,
  saving,
  saveLabel,
  savingLabel
}: MerchantServiceTypesPickerProps) {
  return (
    <div className="merchant-editor-section">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {categories.map((category) => {
          const selected = selectedCodes.includes(category.code);
          return (
            <button
              key={category.code}
              type="button"
              className={`rounded-xl border px-3 py-3 text-left text-sm ${selected ? "text-white" : ""}`}
              style={{
                borderColor: selected ? "var(--accent)" : "var(--border)",
                backgroundColor: selected ? "var(--accent)" : "transparent"
              }}
              onClick={() => onToggle(category.code)}
            >
              <div className="font-semibold">{category.name}</div>
              <div className="mt-1 opacity-80">{category.code}</div>
            </button>
          );
        })}
      </div>
      <button
        className="apple-btn-primary mt-3 w-full"
        disabled={!selectedCodes.length || saving}
        onClick={onSave}
        type="button"
      >
        {saving ? savingLabel : saveLabel}
      </button>
    </div>
  );
}
