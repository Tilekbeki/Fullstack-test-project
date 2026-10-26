import { Button, DatePicker, Dropdown, Input, InputNumber, Select } from 'antd';
import dayjs from 'dayjs';
import type { FilterKey, ProjectQuery } from '../../models/dashboard.type';
import { filterKeys, filterLabels } from '../../config/projectFilters';

export interface ProjectFilterBarProps {
  searchDraft: string;
  onSearchChange: (value: string) => void;
  ownerDraft: string;
  onOwnerChange: (value: string) => void;
  query: ProjectQuery;
  active: FilterKey[];
  onAdd: (key: FilterKey) => void;
  onRemove: (key: FilterKey) => void;
  onValueChange: (key: FilterKey, value: string) => void;
  onReset: () => void;
}

export function ProjectFilterBar({
  searchDraft,
  onSearchChange,
  ownerDraft,
  onOwnerChange,
  query,
  active,
  onAdd,
  onRemove,
  onValueChange,
  onReset,
}: ProjectFilterBarProps) {
  const available = filterKeys.filter((key) => !active.includes(key));
  return (
    <div className="project-filter-bar">
      <div className="filter-main-row">
        <Input.Search
          aria-label="Поиск проектов"
          placeholder="Поиск по названию проекта"
          value={searchDraft}
          maxLength={100}
          onChange={(event) => onSearchChange(event.target.value)}
          onSearch={onSearchChange}
          allowClear
        />
        <Dropdown
          menu={{
            items: available.map((key) => ({ key, label: filterLabels[key] })),
            onClick: ({ key }) => onAdd(key as FilterKey),
          }}
          disabled={!available.length}
          trigger={['click']}
        >
          <Button>+ Фильтр</Button>
        </Dropdown>
        <Button
          onClick={onReset}
          disabled={!searchDraft && !active.length}
        >
          Сбросить
        </Button>
      </div>
      {active.length > 0 && (
        <div className="filter-fields">
          {active.map((key) => (
            <div
              className="filter-field"
              key={key}
            >
              <label htmlFor={`project-filter-${key}`}>{filterLabels[key]}</label>
              {key === 'owner' ? (
                <Input
                  id={`project-filter-${key}`}
                  value={ownerDraft}
                  maxLength={100}
                  onChange={(event) => onOwnerChange(event.target.value)}
                  placeholder="Фамилия или имя"
                  allowClear
                />
              ) : key === 'priority' ? (
                <Select
                  id={`project-filter-${key}`}
                  aria-label="Приоритет"
                  value={query.priority || undefined}
                  placeholder="Любой"
                  allowClear
                  options={[
                    { value: '1', label: 'Низкий' },
                    { value: '2', label: 'Средний' },
                    { value: '3', label: 'Высокий' },
                  ]}
                  onChange={(value) => onValueChange(key, value ?? '')}
                />
              ) : key === 'budgetMin' || key === 'budgetMax' ? (
                <InputNumber
                  id={`project-filter-${key}`}
                  aria-label={filterLabels[key]}
                  value={query[key] ? Number(query[key]) : null}
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="₽"
                  onChange={(value) =>
                    onValueChange(key, value === null ? '' : String(value))
                  }
                />
              ) : (
                <DatePicker
                  id={`project-filter-${key}`}
                  aria-label={filterLabels[key]}
                  value={query[key] ? dayjs(query[key]) : null}
                  onChange={(value) =>
                    onValueChange(key, value?.format('YYYY-MM-DD') ?? '')
                  }
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              )}
              <button
                type="button"
                className="filter-remove"
                aria-label={`Убрать фильтр ${filterLabels[key]}`}
                onClick={() => onRemove(key)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
