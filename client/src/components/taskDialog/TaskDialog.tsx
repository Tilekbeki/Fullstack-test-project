import { useState } from 'react';
import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import type { Project, Task, TaskInput } from '../../models/dashboard.type';
import { dateOnly } from '../../utils/date';
import { errorText, statuses } from '../../utils/presentation';
import { useToast } from '../../providers/ToastProvider';

export interface TaskDialogProps {
  project: Project;
  initial: Task | null;
  onClose: () => void;
  onSave: (data: TaskInput) => Promise<void>;
}

export function TaskDialog({ project, initial, onClose, onSave }: TaskDialogProps) {
  const [form] = Form.useForm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const submit = async (values: {
    title: string;
    assignee: string;
    estimate: number;
    due_date: dayjs.Dayjs;
    status_code: number;
  }) => {
    setBusy(true);
    try {
      await onSave({
        title: values.title,
        assignee: values.assignee,
        estimate: String(values.estimate),
        due_date: values.due_date.format('YYYY-MM-DD'),
        status_code: values.status_code,
      });
      onClose();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={initial ? 'Изменить задачу' : 'Новая задача'}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={busy}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnHidden
    >
      <p className="modal-context">Проект: {project.name}</p>
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={
          initial
            ? {
                ...initial,
                estimate: Number(initial.estimate),
                due_date: dayjs(dateOnly(initial.due_date)),
              }
            : { estimate: 8, due_date: dayjs().add(7, 'day'), status_code: 1 }
        }
      >
        <Form.Item
          name="title"
          label="Название"
          rules={[{ required: true, max: 160 }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="assignee"
          label="Исполнитель"
          rules={[{ required: true, max: 100 }]}
        >
          <Input />
        </Form.Item>
        <div className="form-grid">
          <Form.Item
            name="estimate"
            label="Оценка, ч"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={9_999_999.9}
              precision={1}
              step={0.5}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="due_date"
            label="Срок"
            rules={[{ required: true }]}
          >
            <DatePicker
              format="DD.MM.YYYY"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="status_code"
          label="Статус"
          rules={[{ required: true }]}
        >
          <Select
            options={statuses.map((label, index) => ({ label, value: index + 1 }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
