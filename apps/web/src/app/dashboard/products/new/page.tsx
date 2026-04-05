'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProductSchema } from '@kaffza/validators';
import { api } from '../../../../lib/api';
import { authHeader } from '../../../../lib/auth';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';
import { Card } from '../../../../components/Card';
import { useStore } from '../../store-context';

type Category = { id: string; nameAr?: string; nameEn?: string };

// Extend the shared schema to include the isActive toggle
const newProductFormSchema = createProductSchema.extend({
  isActive: z.boolean().optional().default(true),
});

type FormValues = z.infer<typeof newProductFormSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { storeId } = useStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(newProductFormSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      isActive: true,
    },
  });

  const isActiveValue = watch('isActive') ?? true;

  // Fetch categories for the dropdown
  useEffect(() => {
    if (!storeId) return;
    (async () => {
      try {
        const res = await api.get(`/stores/${storeId}/categories/tree`, {
          headers: { ...authHeader(), 'x-client': 'web' },
        });
        const flattenCategories = (nodes: any[]): Category[] =>
          nodes.flatMap((n: any) => [
            { id: String(n.id), nameAr: n.nameAr, nameEn: n.nameEn },
            ...(n.children ? flattenCategories(n.children) : []),
          ]);
        setCategories(flattenCategories(res?.data?.data || []));
      } catch {
        // Categories are optional – gracefully ignore failures
      }
    })();
  }, [storeId]);

  async function onSubmit(data: FormValues) {
    if (!storeId) {
      setSubmitError('لا يوجد متجر محدد. يرجى اختيار متجر من القائمة أعلاه.');
      return;
    }
    setSubmitError(null);

    try {
      const payload: Record<string, unknown> = {
        nameAr: data.nameAr.trim(),
        nameEn: data.nameEn.trim(),
        price: Number(data.price),
        stock: Number(data.stock),
        isActive: data.isActive ?? true,
      };
      if (data.descriptionAr?.trim()) payload.descriptionAr = data.descriptionAr.trim();
      if (data.descriptionEn?.trim()) payload.descriptionEn = data.descriptionEn.trim();
      if (data.categoryId) payload.categoryId = Number(data.categoryId);

      await api.post(`/stores/${storeId}/products`, payload, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });

      setSubmitSuccess(true);
      setTimeout(() => router.push('/dashboard/products'), 1200);
    } catch (e: any) {
      setSubmitError(
        e?.response?.data?.message || e?.message || 'فشل حفظ المنتج. يرجى المحاولة مرة أخرى.'
      );
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-kaffza-primary text-2xl font-extrabold">إضافة منتج جديد</h1>
          <p className="text-kaffza-text/80 mt-1 text-sm">
            أدخل تفاصيل المنتج الجديد لإضافته إلى متجرك.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/dashboard/products')}>
          ← العودة للمنتجات
        </Button>
      </header>

      {/* Success Banner */}
      {submitSuccess ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          ✅ تم حفظ المنتج بنجاح! جاري التحويل...
        </div>
      ) : null}

      {/* Error Banner */}
      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Fields */}
          <div className="space-y-5 lg:col-span-2">
            {/* Names */}
            <Card>
              <h2 className="text-kaffza-primary mb-4 text-base font-extrabold">اسم المنتج</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الاسم بالعربية *" error={errors.nameAr?.message}>
                  <Input {...register('nameAr')} placeholder="مثال: حذاء رياضي" dir="rtl" />
                </Field>
                <Field label="الاسم بالإنجليزية *" error={errors.nameEn?.message}>
                  <Input {...register('nameEn')} placeholder="e.g. Sports Shoes" dir="ltr" />
                </Field>
              </div>
            </Card>

            {/* Descriptions */}
            <Card>
              <h2 className="text-kaffza-primary mb-4 text-base font-extrabold">الوصف (اختياري)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الوصف بالعربية" error={errors.descriptionAr?.message}>
                  <textarea
                    {...register('descriptionAr')}
                    rows={4}
                    placeholder="وصف تفصيلي للمنتج بالعربية..."
                    dir="rtl"
                    className="focus:border-kaffza-primary w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </Field>
                <Field label="الوصف بالإنجليزية" error={errors.descriptionEn?.message}>
                  <textarea
                    {...register('descriptionEn')}
                    rows={4}
                    placeholder="Detailed product description in English..."
                    dir="ltr"
                    className="focus:border-kaffza-primary w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </Field>
              </div>
            </Card>

            {/* Pricing & Stock */}
            <Card>
              <h2 className="text-kaffza-primary mb-4 text-base font-extrabold">السعر والمخزون</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="السعر (ر.ع) *" error={errors.price?.message}>
                  <Input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    dir="ltr"
                  />
                </Field>
                <Field label="المخزون *" error={errors.stock?.message}>
                  <Input
                    {...register('stock', { valueAsNumber: true })}
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    dir="ltr"
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* Sidebar Options */}
          <div className="space-y-5">
            {/* Category */}
            <Card>
              <h2 className="text-kaffza-primary mb-4 text-base font-extrabold">التصنيف</h2>
              <Field label="التصنيف (اختياري)" error={errors.categoryId?.message}>
                <select
                  {...register('categoryId', { setValueAs: (v) => (v ? Number(v) : undefined) })}
                  className="focus:border-kaffza-primary w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr || c.nameEn || c.id}
                    </option>
                  ))}
                  {categories.length === 0 ? (
                    <option value="" disabled>
                      لا توجد تصنيفات — أضف من صفحة التصنيفات
                    </option>
                  ) : null}
                </select>
              </Field>
            </Card>

            {/* Status */}
            <Card>
              <h2 className="text-kaffza-primary mb-4 text-base font-extrabold">حالة المنتج</h2>
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <div>
                  <div className="text-kaffza-text text-sm font-bold">منتج نشط</div>
                  <div className="text-kaffza-text/60 text-xs">سيظهر المنتج في المتجر للعملاء</div>
                </div>
                {/* Toggle Switch */}
                <div
                  className="relative inline-block"
                  onClick={() => setValue('isActive', !isActiveValue)}
                >
                  <div
                    className={
                      'h-6 w-11 cursor-pointer rounded-full transition-colors ' +
                      (isActiveValue ? 'bg-kaffza-primary' : 'bg-slate-200')
                    }
                  />
                  <div
                    className={
                      'pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ' +
                      (isActiveValue ? 'left-0.5 translate-x-5' : 'left-0.5')
                    }
                  />
                </div>
              </label>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={isSubmitting || submitSuccess || !storeId}>
                {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ المنتج'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/products')}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-kaffza-text text-sm font-bold">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
