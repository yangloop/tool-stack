import { Plus, Trash2 } from 'lucide-react';

interface KeyValueItem {
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps<T extends KeyValueItem> {
  items: T[];
  onChange: (items: T[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addButtonText?: string;
  showEnabled?: boolean;
  renderExtra?: (item: T, index: number) => React.ReactNode;
}

export function KeyValueEditor<T extends KeyValueItem>({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addButtonText = 'Add',
  showEnabled = true,
  renderExtra,
}: KeyValueEditorProps<T>) {
  const addItem = () => {
    onChange([...items, { key: '', value: '', enabled: true } as T]);
  };

  const updateItem = (index: number, field: keyof T, value: T[keyof T]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <button 
          onClick={addItem} 
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {addButtonText}
        </button>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-xs">
          暂无数据，点击"{addButtonText}"添加
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 group">
              {showEnabled && (
                <input
                  type="checkbox"
                  id={`kv-enabled-${index}`}
                  name={`kv-enabled-${index}`}
                  checked={item.enabled}
                  onChange={(e) => updateItem(index, 'enabled', e.target.checked as T[keyof T])}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
              )}
              <input
                type="text"
                id={`kv-key-${index}`}
                name={`kv-key-${index}`}
                value={item.key}
                onChange={(e) => updateItem(index, 'key', e.target.value as T[keyof T])}
                placeholder={keyPlaceholder}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {renderExtra ? (
                renderExtra(item, index)
              ) : (
                <input
                  type="text"
                  id={`kv-value-${index}`}
                  name={`kv-value-${index}`}
                  value={item.value}
                  onChange={(e) => updateItem(index, 'value', e.target.value as T[keyof T])}
                  placeholder={valuePlaceholder}
                  className="flex-1 min-w-0 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              <button
                onClick={() => removeItem(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
