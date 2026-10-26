import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IDatasource } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { api, mutationStorageKey } from '../services/api';
import type { FilterKey } from '../models/dashboard.type';
import { loadProjectFilters, saveProjectFilters } from '../services/projectFilterStorage';
import type { DashboardSection, Overview, Project, ProjectInput, Responsible, Task, TaskInput } from '../models/dashboard.type';
import { useToast } from '../providers/ToastProvider';
import { errorText } from '../utils/presentation';
import { projectColumns, taskColumns } from '../config/gridColumns';

export function useDashboardController() {
  const toast = useToast();
  const grid = useRef<AgGridReact<Project>>(null);
  const tasksRequestId = useRef(0);
  const selectedProjectId = useRef<number | null>(null);
  const lastReadError = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const [section, setSection] = useState<DashboardSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState(loadProjectFilters);
  const [searchDraft, setSearchDraft] = useState(savedFilters.query.search);
  const [ownerDraft, setOwnerDraft] = useState(savedFilters.query.owner ?? '');
  const [selected, setSelected] = useState<Project | null>(null);
  selectedProjectId.current = selected?.id ?? null;
  const [taskRows, setTaskRows] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectDialog, setProjectDialog] = useState<'new' | 'edit' | null>(null);
  const [taskDialog, setTaskDialog] = useState<'new' | 'edit' | null>(null);
  const [responsibleDialog, setResponsibleDialog] = useState<{ type: 'new' } | { type: 'edit'; responsible: Responsible } | null>(null);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loadingResponsibles, setLoadingResponsibles] = useState(false);
  const [responsibleSearch, setResponsibleSearch] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState('');
  const [showSavedProjectsWarning, setShowSavedProjectsWarning] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSavedFilters(current => current.query.search === searchDraft ? current : { ...current, query: { ...current.query, search: searchDraft } }), 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSavedFilters(current => (current.query.owner ?? '') === ownerDraft ? current : { ...current, query: { ...current.query, owner: ownerDraft } }), 350);
    return () => window.clearTimeout(timer);
  }, [ownerDraft]);
  useEffect(() => {
    try {
      saveProjectFilters(savedFilters);
    } catch { toast.error('Не удалось сохранить фильтры в браузере'); }
  }, [savedFilters, toast]);
  const setFilterValue = (key: FilterKey, value: string) => setSavedFilters(current => ({ ...current, query: { ...current.query, [key]: value } }));
  const addFilter = (key: FilterKey) => setSavedFilters(current => current.active.includes(key) ? current : { ...current, active: [...current.active, key] });
  const removeFilter = (key: FilterKey) => {
    if (key === 'owner') setOwnerDraft('');
    setSavedFilters(current => ({ active: current.active.filter(item => item !== key), query: { ...current.query, [key]: '' } }));
  };
  const resetFilters = () => { setSearchDraft(''); setOwnerDraft(''); setSavedFilters({ query: { search: '' }, active: [] }); };

  const reportReadError = useCallback((cause: unknown) => {
    const text = errorText(cause);
    setError(text);
    const now = Date.now();
    if (lastReadError.current.text !== text || now - lastReadError.current.at > 10_000) {
      toast.error(text);
      lastReadError.current = { text, at: now };
    }
  }, [toast]);
  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await api.overview());
    } catch (cause) {
      reportReadError(cause);
    }
  }, [reportReadError]);
  useEffect(() => { void refreshOverview(); }, [refreshOverview]);
  const refreshTasks = useCallback(async (projectId: number) => {
    if (selectedProjectId.current !== projectId) return;
    const requestId = ++tasksRequestId.current;
    setLoadingTasks(true);
    try {
      const rows = await api.tasks(projectId);
      if (requestId !== tasksRequestId.current || selectedProjectId.current !== projectId) return;
      setTaskRows(rows);
      setError('');
    } catch (e) {
      if (requestId !== tasksRequestId.current || selectedProjectId.current !== projectId) return;
      reportReadError(e);
      setTaskRows([]);
    } finally {
      if (requestId === tasksRequestId.current && selectedProjectId.current === projectId) setLoadingTasks(false);
    }
  }, [reportReadError]);
  const refreshResponsibles = useCallback(async () => {
    setLoadingResponsibles(true);
    try { setResponsibles(await api.responsibles()); setError(''); }
    catch (e) { reportReadError(e); }
    finally { setLoadingResponsibles(false); }
  }, [reportReadError]);
  useEffect(() => {
    if (section === 'responsibles' || projectDialog) void refreshResponsibles();
  }, [section, projectDialog, refreshResponsibles]);
  useEffect(() => {
    if (selected) void refreshTasks(selected.id);
    else { tasksRequestId.current++; setTaskRows([]); setSelectedTask(null); setLoadingTasks(false); }
    return () => { tasksRequestId.current++; };
  }, [selected?.id, refreshTasks]);

  const refreshVisibleData = useCallback(async () => {
    try {
      await api.invalidateQueries({ preserveSavedPages: true, networkFirst: true });
      void refreshOverview();
      if (selected) void refreshTasks(selected.id);
      if (section === 'responsibles' || projectDialog) void refreshResponsibles();
      grid.current?.api.purgeInfiniteCache();
    } catch (cause) {
      reportReadError(cause);
    }
  }, [refreshOverview, refreshTasks, refreshResponsibles, selected?.id, section, projectDialog, reportReadError]);
  useEffect(() => api.onProjectPageEvent(event => {
    if (event.type === 'unavailable') { setShowSavedProjectsWarning(true); return; }
    setShowSavedProjectsWarning(false);
    if (event.type === 'updated') {
      setSelected(current => current ? event.page.rows.find(row => row.id === current.id) ?? current : null);
      grid.current?.api.refreshInfiniteCache();
    }
  }), []);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshVisibleData(); };
    document.addEventListener('visibilitychange', onVisible);
    const onOnline = () => { void refreshVisibleData(); };
    const onStorage = (event: StorageEvent) => { if (event.key === mutationStorageKey) void refreshVisibleData(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshVisibleData]);

  const datasource = useMemo<IDatasource>(() => ({
    getRows: params => {
      api.projects(params.startRow, params.endRow - params.startRow, savedFilters.query)
        .then(({ rows, total }) => { params.successCallback(rows, total); setError(''); })
        .catch(e => { params.failCallback(); reportReadError(e); });
    },
  }), [savedFilters.query, reportReadError]);
  useEffect(() => { setSelected(null); setSelectedTask(null); setShowSavedProjectsWarning(false); }, [savedFilters.query]);


  const afterProjectMutation = () => { grid.current?.api.purgeInfiniteCache(); void refreshOverview(); };
  const saveProject = async (data: ProjectInput) => {
    const editing = projectDialog === 'edit';
    let saved: Project;
    if (editing) {
      if (!selected) throw new Error('Выберите проект для изменения');
      saved = await api.updateProject(selected.id, data);
    } else {
      saved = await api.createProject(data);
    }
    if (editing) setSelected(saved);
    afterProjectMutation();
    toast.success(editing ? 'Проект обновлён' : 'Проект создан');
  };
  const removeProject = async () => {
    if (!selected) return;
    try { await api.deleteProject(selected.id); setSelected(null); afterProjectMutation(); toast.success('Проект удалён'); }
    catch (e) { toast.error(errorText(e)); }
  };
  const saveTask = async (data: TaskInput) => {
    if (!selected) throw new Error('Выберите проект для задачи');
    const editing = taskDialog === 'edit' && selectedTask;
    if (editing) await api.updateTask(selected.id, selectedTask.id, data);
    else await api.createTask(selected.id, data);
    setSelectedTask(null); await refreshTasks(selected.id); void refreshOverview();
    toast.success(editing ? 'Задача обновлена' : 'Задача создана');
  };
  const removeTask = async () => {
    if (!selected || !selectedTask) return;
    try { await api.deleteTask(selected.id, selectedTask.id); setSelectedTask(null); await refreshTasks(selected.id); void refreshOverview(); toast.success('Задача удалена'); }
    catch (e) { toast.error(errorText(e)); }
  };
  const saveResponsible = async (data: { name: string }) => {
    if (!responsibleDialog) return;
    const editing = responsibleDialog.type === 'edit';
    const saved = editing ? await api.updateResponsible(responsibleDialog.responsible.id, data) : await api.createResponsible(data);
    if (editing) setSelected(current => current?.owner_id === saved.id ? { ...current, owner: saved.name } : current);
    toast.success(editing ? 'Ответственный обновлён' : 'Ответственный создан');
    void refreshResponsibles();
    grid.current?.api.purgeInfiniteCache();
  };
  const removeResponsible = async (responsible: Responsible) => {
    try {
      await api.deleteResponsible(responsible.id);
      toast.success('Ответственный удалён');
      void refreshResponsibles();
    } catch (cause) { toast.error(errorText(cause)); }
  };
  const filteredResponsibles = useMemo(() => responsibles.filter(item => item.name.toLocaleLowerCase('ru').includes(responsibleSearch.trim().toLocaleLowerCase('ru'))), [responsibles, responsibleSearch]);
  return {
    grid, section, setSection, mobileMenuOpen, setMobileMenuOpen,
    savedFilters, searchDraft, setSearchDraft, ownerDraft, setOwnerDraft,
    selected, setSelected, taskRows, selectedTask, setSelectedTask,
    projectDialog, setProjectDialog, taskDialog, setTaskDialog,
    responsibleDialog, setResponsibleDialog, responsibles, loadingResponsibles,
    responsibleSearch, setResponsibleSearch, overview, loadingTasks, error, setError,
    showSavedProjectsWarning, setFilterValue, addFilter, removeFilter, resetFilters,
    refreshVisibleData, datasource, projectColumns, taskColumns,
    saveProject, removeProject, saveTask, removeTask, saveResponsible, removeResponsible,
    filteredResponsibles,
  };
}
