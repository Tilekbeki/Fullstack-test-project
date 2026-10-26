import { Button, Input, Popconfirm, Table } from 'antd';
import type { Responsible } from '../../../models/dashboard.type';

export interface ResponsiblesPageProps {
  rows: Responsible[];
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
  onCreate: () => void;
  onEdit: (responsible: Responsible) => void;
  onRemove: (responsible: Responsible) => Promise<void>;
}

export function ResponsiblesPage({
  rows,
  search,
  onSearch,
  loading,
  onCreate,
  onEdit,
  onRemove,
}: ResponsiblesPageProps) {
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>Список ответственных</h2>
          <p>Добавляйте и редактируйте людей, которых можно назначить на проект</p>
        </div>
        <div className="panel-actions">
          <Button
            type="primary"
            onClick={onCreate}
          >
            + Добавить ответственного
          </Button>
        </div>
      </div>
      <div className="responsibles-toolbar">
        <Input.Search
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Найти по имени"
          allowClear
          aria-label="Найти ответственного"
        />
      </div>
      <Table<Responsible>
        className="responsibles-table"
        rowKey="id"
        size="small"
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
        locale={{ emptyText: search ? 'Ничего не найдено' : 'Ответственных пока нет' }}
        scroll={{ x: 480 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: 'Имя', dataIndex: 'name' },
          {
            title: 'Действия',
            key: 'actions',
            width: 195,
            render: (_, responsible) => (
              <div className="responsible-actions">
                <Button
                  size="small"
                  onClick={() => onEdit(responsible)}
                >
                  Изменить
                </Button>
                <Popconfirm
                  title="Удалить ответственного?"
                  description="Удаление доступно, если он не назначен ни на один проект."
                  okText="Удалить"
                  okButtonProps={{ danger: true }}
                  cancelText="Отмена"
                  onConfirm={() => onRemove(responsible)}
                >
                  <Button
                    size="small"
                    danger
                  >
                    Удалить
                  </Button>
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}
