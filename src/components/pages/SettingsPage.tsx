"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardHeader, CardBody, CardFooter } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import { DateFormat, UserPreference } from "@/src/lib/types";

interface PreferencesFormState {
    libraryName: string;
    ownerName: string;
    description: string;
    defaultLoanDurationDays: string;
    dateFormat: DateFormat;
}

const DEFAULT_FORM: PreferencesFormState = {
    libraryName: "",
    ownerName: "",
    description: "",
    defaultLoanDurationDays: "30",
    dateFormat: "DD MMM YYYY",
};

function toFormState(prefs: UserPreference): PreferencesFormState {
    return {
        libraryName: prefs.libraryName ?? "",
        ownerName: prefs.ownerName ?? "",
        description: prefs.description ?? "",
        defaultLoanDurationDays: String(prefs.defaultLoanDurationDays ?? 30),
        dateFormat: prefs.dateFormat ?? "DD MMM YYYY",
    };
}

export default function SettingsPage() {
    const { t, language, setLanguage } = useLanguage();

    const [form, setForm] = useState<PreferencesFormState>(DEFAULT_FORM);
    const [savedForm, setSavedForm] = useState<PreferencesFormState>(DEFAULT_FORM);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const loadPreferences = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const res = await fetch("/api/preferences");
            if (!res.ok) throw new Error("failed to load preferences");
            const data: UserPreference = await res.json();
            const next = toFormState(data);
            setForm(next);
            setSavedForm(next);
            if (data.language) setLanguage(data.language);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, [setLanguage]);

    useEffect(() => {
        loadPreferences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        setSaveError(null);
        try {
            const payload: UserPreference = {
                libraryName: form.libraryName,
                ownerName: form.ownerName,
                description: form.description,
                defaultLoanDurationDays: parseInt(form.defaultLoanDurationDays, 10) || 30,
                dateFormat: form.dateFormat,
                language,
            };
            const res = await fetch("/api/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("failed to save preferences");
            const data: UserPreference = await res.json();
            const next = toFormState(data);
            setForm(next);
            setSavedForm(next);
        } catch {
            setSaveError(t.settings.saveError);
        } finally {
            setSaving(false);
        }
    }, [form, language, t.settings.saveError]);

    const handleReset = useCallback(() => {
        setForm(savedForm);
        setSaveError(null);
    }, [savedForm]);

    const formDisabled = loading || loadError || saving;

    return (
        <div data-testid="settings-page">
            <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
                {/* General settings */}
                <Card>
                    <CardHeader>
                        <span className="text-sm font-semibold text-[var(--foreground)]">{t.settings.generalTitle}</span>
                    </CardHeader>
                    <CardBody>
                        {loading && (
                            <p className="text-sm text-[var(--muted)]">{t.common.loading}</p>
                        )}
                        {!loading && loadError && (
                            <div className="flex flex-col items-start gap-2">
                                <p className="text-sm font-semibold text-[var(--foreground)]">{t.common.errorHeading}</p>
                                <p className="text-sm text-[var(--muted)]">{t.common.errorDescription}</p>
                                <Button variant="secondary" size="sm" onClick={loadPreferences}>{t.common.retry}</Button>
                            </div>
                        )}
                        {!loading && !loadError && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label={t.settings.fieldLibraryName}
                                    value={form.libraryName}
                                    onChange={(e) => setForm((f) => ({ ...f, libraryName: e.target.value }))}
                                />
                                <Input
                                    label={t.settings.fieldOwnerName}
                                    value={form.ownerName}
                                    onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                                />
                                <Select
                                    label={t.settings.fieldLoanDuration}
                                    value={form.defaultLoanDurationDays}
                                    onChange={(e) => setForm((f) => ({ ...f, defaultLoanDurationDays: e.target.value }))}
                                >
                                    <option value="30">{t.settings.loan30}</option>
                                    <option value="60">{t.settings.loan60}</option>
                                    <option value="90">{t.settings.loan90}</option>
                                </Select>
                                <Select
                                    label={t.settings.fieldDateFormat}
                                    value={form.dateFormat}
                                    onChange={(e) => setForm((f) => ({ ...f, dateFormat: e.target.value as DateFormat }))}
                                >
                                    <option value="DD MMM YYYY">DD MMM YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </Select>
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        {t.settings.fieldMotto}
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        rows={3}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                                    />
                                </div>
                            </div>
                        )}
                        {saveError && (
                            <p role="alert" className="mt-4 text-sm text-[var(--destructive)]">{saveError}</p>
                        )}
                    </CardBody>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={handleReset} disabled={formDisabled}>
                            {t.common.reset}
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSave} disabled={loading || loadError} loading={saving}>
                            {t.common.save}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Right column */}
                <div className="flex flex-col gap-5">
                    {/* Language */}
                    <Card>
                        <CardHeader>
                            <span className="text-sm font-semibold text-[var(--foreground)]">
                                {t.sidebar.languageSwitcherLabel}
                            </span>
                        </CardHeader>
                        <CardBody>
                            <LanguageSwitcher />
                        </CardBody>
                    </Card>

                    {/* Export & Backup */}
                    <Card>
                        <CardHeader>
                            <span className="text-sm font-semibold text-[var(--foreground)]">{t.settings.exportTitle}</span>
                        </CardHeader>
                        <CardBody className="flex flex-col gap-2">
                            <Button variant="secondary" size="sm" className="w-full justify-center">{t.settings.exportCsv}</Button>
                            <Button variant="secondary" size="sm" className="w-full justify-center">{t.settings.exportJson}</Button>
                            <Button variant="secondary" size="sm" className="w-full justify-center">{t.settings.printCatalogue}</Button>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
