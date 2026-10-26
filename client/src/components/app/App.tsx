import { lazy, Suspense } from 'react';
import { OverviewPage, ProjectsPage, ResponsiblesPage } from '../pages';
import { Alert, Button } from 'antd';
import { DashboardLayout } from '../dashboardLayout/DashboardLayout';
import { PortfolioStats } from '../portfolioStats/PortfolioStats';
import { useDashboardController } from '../../hooks/useDashboardController';

const ProjectDialog = lazy(() =>
  import('../projectDialog/ProjectDialog').then((module) => ({
    default: module.ProjectDialog,
  })),
);
const ResponsibleDialog = lazy(() =>
  import('../responsibleDialog/ResponsibleDialog').then((module) => ({
    default: module.ResponsibleDialog,
  })),
);
const TaskDialog = lazy(() =>
  import('../taskDialog/TaskDialog').then((module) => ({ default: module.TaskDialog })),
);

export function App() {
  const {
    grid,
    section,
    setSection,
    mobileMenuOpen,
    setMobileMenuOpen,
    savedFilters,
    searchDraft,
    setSearchDraft,
    ownerDraft,
    setOwnerDraft,
    selected,
    setSelected,
    taskRows,
    selectedTask,
    setSelectedTask,
    projectDialog,
    setProjectDialog,
    taskDialog,
    setTaskDialog,
    responsibleDialog,
    setResponsibleDialog,
    responsibles,
    loadingResponsibles,
    responsibleSearch,
    setResponsibleSearch,
    overview,
    loadingTasks,
    error,
    setError,
    showSavedProjectsWarning,
    setFilterValue,
    addFilter,
    removeFilter,
    resetFilters,
    refreshVisibleData,
    datasource,
    projectColumns,
    taskColumns,
    saveProject,
    removeProject,
    saveTask,
    removeTask,
    saveResponsible,
    removeResponsible,
    filteredResponsibles,
  } = useDashboardController();

  return (
    <>
      <DashboardLayout
        section={section}
        mobileMenuOpen={mobileMenuOpen}
        onSectionChange={(next) => {
          setSection(next);
          setMobileMenuOpen(false);
        }}
        onToggleMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMenu={() => setMobileMenuOpen(false)}
      >
        {error && (
          <Alert
            className="api-alert"
            type="error"
            showIcon
            message={error}
            action={
              <Button
                size="small"
                onClick={() => {
                  setError('');
                  void refreshVisibleData();
                }}
              >
                Повторить
              </Button>
            }
          />
        )}
        {showSavedProjectsWarning && (
          <Alert
            className="api-alert"
            type="warning"
            showIcon
            message="Сервер недоступен: показаны сохранённые проекты"
            action={
              <Button
                size="small"
                onClick={() => {
                  void refreshVisibleData();
                }}
              >
                Повторить
              </Button>
            }
          />
        )}
        {section !== 'responsibles' && <PortfolioStats overview={overview} />}
        {section === 'overview' ? (
          <OverviewPage overview={overview} />
        ) : section === 'responsibles' ? (
          <ResponsiblesPage
            rows={filteredResponsibles}
            search={responsibleSearch}
            onSearch={setResponsibleSearch}
            loading={loadingResponsibles}
            onCreate={() => setResponsibleDialog({ type: 'new' })}
            onEdit={(responsible) => setResponsibleDialog({ type: 'edit', responsible })}
            onRemove={removeResponsible}
          />
        ) : (
          <ProjectsPage
            grid={grid}
            datasource={datasource}
            projectColumns={projectColumns}
            taskColumns={taskColumns}
            selected={selected}
            selectedTask={selectedTask}
            taskRows={taskRows}
            loadingTasks={loadingTasks}
            setSelected={setSelected}
            setSelectedTask={setSelectedTask}
            savedFilters={savedFilters}
            searchDraft={searchDraft}
            setSearchDraft={setSearchDraft}
            ownerDraft={ownerDraft}
            setOwnerDraft={setOwnerDraft}
            addFilter={addFilter}
            removeFilter={removeFilter}
            setFilterValue={setFilterValue}
            resetFilters={resetFilters}
            refreshVisibleData={refreshVisibleData}
            onCreateProject={() => setProjectDialog('new')}
            onEditProject={() => setProjectDialog('edit')}
            onRemoveProject={removeProject}
            onCreateTask={() => setTaskDialog('new')}
            onEditTask={() => setTaskDialog('edit')}
            onRemoveTask={removeTask}
          />
        )}
      </DashboardLayout>
      <Suspense fallback={null}>
        {projectDialog && (
          <ProjectDialog
            key={`${projectDialog}-${selected?.id ?? 'new'}`}
            initial={projectDialog === 'edit' ? selected : null}
            responsibles={responsibles}
            loadingResponsibles={loadingResponsibles}
            onManageResponsibles={() => {
              setProjectDialog(null);
              setSection('responsibles');
            }}
            onClose={() => setProjectDialog(null)}
            onSave={saveProject}
          />
        )}
        {taskDialog && selected && (
          <TaskDialog
            key={`${taskDialog}-${selectedTask?.id ?? 'new'}`}
            project={selected}
            initial={taskDialog === 'edit' ? selectedTask : null}
            onClose={() => setTaskDialog(null)}
            onSave={saveTask}
          />
        )}
        {responsibleDialog && (
          <ResponsibleDialog
            key={
              responsibleDialog.type === 'edit' ? responsibleDialog.responsible.id : 'new'
            }
            initial={
              responsibleDialog.type === 'edit' ? responsibleDialog.responsible : null
            }
            onClose={() => setResponsibleDialog(null)}
            onSave={saveResponsible}
          />
        )}
      </Suspense>
    </>
  );
}
