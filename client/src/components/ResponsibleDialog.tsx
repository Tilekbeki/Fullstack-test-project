import { useState } from 'react';
import { Form, Input, Modal } from 'antd';
import type { Responsible } from '../models/dashboard.type';
import { errorText } from '../utils/presentation';
import { useToast } from '../providers/ToastProvider';

export interface ResponsibleDialogProps {
  initial: Responsible | null; onClose: () => void; onSave: (data: { name: string }) => Promise<void>;
}

export function ResponsibleDialog({ initial, onClose, onSave }: ResponsibleDialogProps) {
  const [form] = Form.useForm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const submit = async (values: { name: string }) => {
    setBusy(true);
    try { await onSave({ name: values.name.trim() }); onClose(); }
    catch (error) { toast.error(errorText(error)); }
    finally { setBusy(false); }
  };
  return <Modal open title={initial ? 'Изменить ответственного' : 'Новый ответственный'} onCancel={onClose} onOk={() => form.submit()} confirmLoading={busy} okText="Сохранить" cancelText="Отмена" destroyOnHidden>
    <Form form={form} layout="vertical" initialValues={initial ? { name: initial.name } : undefined} onFinish={submit}>
      <Form.Item name="name" label="Имя" rules={[{ required: true, whitespace: true, max: 100, message: 'Укажите имя (до 100 символов)' }]}><Input autoFocus maxLength={100} placeholder="Имя ответственного" /></Form.Item>
    </Form>
  </Modal>;
}

