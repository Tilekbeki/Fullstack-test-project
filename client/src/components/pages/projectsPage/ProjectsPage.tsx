import type { RefObject } from 'react';
import type { ColDef, IDatasource } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Button, Empty, Popconfirm, Spin, Tag } from 'antd';
import { ProjectFilterBar } from '../../projectFilterBar/ProjectFilterBar';
import type {
  FilterKey,
  Project,
  ProjectQuery,
  Task,
} from '../../../models/dashboard.type';

export interface ProjectsPageProps {
  grid: RefObject<AgGridReact<Project>>;
  datasource: IDatasource;
  projectColumns: ColDef<Project>[];
  taskColumns: ColDef<Task>[];
  selected: Project | null;
  selectedTask: Task | null;
  taskRows: Task[];
  loadingTasks: boolean;
  setSelected: (project: Project | null) => void;
  setSelectedTask: (task: Task | null) => void;
  savedFilters: { query: ProjectQuery; active: FilterKey[] };
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  ownerDraft: string;
  setOwnerDraft: (value: string) => void;
  addFilter: (key: FilterKey) => void;
  removeFilter: (key: FilterKey) => void;
  setFilterValue: (key: FilterKey, value: string) => void;
  resetFilters: () => void;
  refreshVisibleData: () => Promise<void>;
  onCreateProject: () => void;
  onEditProject: () => void;
  onRemoveProject: () => Promise<void>;
  onCreateTask: () => void;
  onEditTask: () => void;
  onRemoveTask: () => Promise<void>;
}

export function ProjectsPage(props: ProjectsPageProps) {
  const {
    grid,
    datasource,
    projectColumns,
    taskColumns,
    selected,
    selectedTask,
    taskRows,
    loadingTasks,
    setSelected,
    setSelectedTask,
    savedFilters,
    searchDraft,
    setSearchDraft,
    ownerDraft,
    setOwnerDraft,
    addFilter,
    removeFilter,
    setFilterValue,
    resetFilters,
    refreshVisibleData,
    onCreateProject,
    onEditProject,
    onRemoveProject,
    onCreateTask,
    onEditTask,
    onRemoveTask,
  } = props;

  return (
    <>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Проекты</h2>
            <p>Загрузка записей с сервера по мере прокрутки</p>
          </div>
          <div className="panel-actions">
            <Button onClick={refreshVisibleData}>Обновить</Button>
            <Button
              type="primary"
              onClick={onCreateProject}
            >
              + Добавить проект
            </Button>
          </div>
        </div>
        <ProjectFilterBar
          searchDraft={searchDraft}
          onSearchChange={setSearchDraft}
          ownerDraft={ownerDraft}
          onOwnerChange={setOwnerDraft}
          query={savedFilters.query}
          active={savedFilters.active}
          onAdd={addFilter}
          onRemove={removeFilter}
          onValueChange={setFilterValue}
          onReset={resetFilters}
        />
        <div className="grid-wrap ag-theme-quartz">
          <AgGridReact<Project>
            key={JSON.stringify(savedFilters.query)}
            ref={grid}
            columnDefs={projectColumns}
            rowModelType="infinite"
            datasource={datasource}
            cacheBlockSize={20}
            maxBlocksInCache={5}
            rowSelection="single"
            onRowClicked={(event) => {
              setSelected(event.data ?? null);
              setSelectedTask(null);
            }}
            getRowId={(params) => String(params.data.id)}
            overlayNoRowsTemplate="Проекты не найдены"
          />
        </div>
        <div className="panel-footer">
          <span>Выберите проект, чтобы увидеть связанные задачи</span>
          <div>
            <Button
              disabled={!selected}
              onClick={onEditProject}
            >
              Изменить
            </Button>
            <Popconfirm
              title="Удалить проект и все его задачи?"
              onConfirm={onRemoveProject}
              disabled={!selected}
            >
              <Button
                danger
                disabled={!selected}
              >
                Удалить
              </Button>
            </Popconfirm>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>
              Задачи {selected ? <Tag color="geekblue">{selected.name}</Tag> : null}
            </h2>
            <p>
              {selected
                ? `${taskRows.length} связанных записей`
                : 'Сначала выберите проект в таблице выше'}
            </p>
          </div>
          <div className="panel-actions">
            <Button
              type="primary"
              disabled={!selected}
              onClick={onCreateTask}
            >
              + Добавить задачу
            </Button>
            <Button
              disabled={!selectedTask}
              onClick={onEditTask}
            >
              Изменить
            </Button>
            <Popconfirm
              title="Удалить задачу?"
              onConfirm={onRemoveTask}
              disabled={!selectedTask}
            >
              <Button
                danger
                disabled={!selectedTask}
              >
                Удалить
              </Button>
            </Popconfirm>
          </div>
        </div>
        {!selected ? (
          <div className="empty-panel">
            <Empty description="Выберите проект" />
          </div>
        ) : loadingTasks ? (
          <div className="empty-panel">
            <Spin />
          </div>
        ) : (
          <div className="grid-wrap task-grid ag-theme-quartz">
            <AgGridReact<Task>
              columnDefs={taskColumns}
              rowData={taskRows}
              rowSelection="single"
              onRowClicked={(event) => setSelectedTask(event.data ?? null)}
              getRowId={(params) => String(params.data.id)}
              overlayNoRowsTemplate="Задач пока нет"
            />
          </div>
        )}
      </section>
    </>
  );
}
