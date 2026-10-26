import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import type { Project, ProjectInput, Responsible } from '../../models/dashboard.type';
import { dateOnly } from '../../utils/date';
import { errorText, priorities } from '../../utils/presentation';
import { useToast } from '../../providers/ToastProvider';

export interface ProjectDialogProps {
  initial: Project | null;
  responsibles: Responsible[];
  loadingResponsibles: boolean;
  onManageResponsibles: () => void;
  onClose: () => void;
  onSave: (data: ProjectInput) => Promise<void>;
}

export function ProjectDialog({
  initial,
  responsibles,
  loadingResponsibles,
  onManageResponsibles,
  onClose,
  onSave,
}: ProjectDialogProps) {
  const [form] = Form.useForm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const submit = async (values: {
    name: string;
    owner_id: number;
    budget: number;
    start_date: dayjs.Dayjs;
    priority: number;
  }) => {
    setBusy(true);
    try {
      await onSave({
        name: values.name,
        owner_id: values.owner_id,
        budget: String(values.budget),
        start_date: values.start_date.format('YYYY-MM-DD'),
        priority: values.priority,
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
      title={initial ? 'Изменить проект' : 'Новый проект'}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={busy}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={
          initial
            ? {
                ...initial,
                budget: Number(initial.budget),
                start_date: dayjs(dateOnly(initial.start_date)),
              }
            : { budget: 50000, priority: 2, start_date: dayjs() }
        }
      >
        <Form.Item
          name="name"
          label="Название"
          rules={[{ required: true, max: 120 }]}
        >
          <Input placeholder="Например, Обновление портала" />
        </Form.Item>
        <Form.Item
          name="owner_id"
          label="Ответственный"
          extra={
            <Button
              type="link"
              className="manage-responsibles-link"
              onClick={onManageResponsibles}
            >
              Управлять ответственными
            </Button>
          }
          rules={[{ required: true, message: 'Выберите ответственного' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={loadingResponsibles}
            placeholder="Выберите ответственного"
            options={responsibles.map((item) => ({ label: item.name, value: item.id }))}
          />
        </Form.Item>
        <div className="form-grid">
          <Form.Item
            name="budget"
            label="Бюджет, ₽"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={9_999_999_999.99}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="start_date"
            label="Дата начала"
            rules={[{ required: true }]}
          >
            <DatePicker
              format="DD.MM.YYYY"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="priority"
          label="Приоритет"
          rules={[{ required: true }]}
        >
          <Select
            options={priorities.map((label, index) => ({ label, value: index + 1 }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
