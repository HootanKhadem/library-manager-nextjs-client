"use client";

import { useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardHeader, CardBody, CardFooter } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";

export default function SettingsPage() {
    const { t } = useLanguage();

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label={t.settings.fieldLibraryName} defaultValue="My Personal Library" />
                            <Input label={t.settings.fieldOwnerName} defaultValue="Bibliophile" />
                            <Select label={t.settings.fieldLoanDuration}>
                                <option value="30">{t.settings.loan30}</option>
                                <option value="60">{t.settings.loan60}</option>
                                <option value="90">{t.settings.loan90}</option>
                            </Select>
                            <Select label={t.settings.fieldDateFormat}>
                                <option>DD MMM YYYY</option>
                                <option>MM/DD/YYYY</option>
                                <option>YYYY-MM-DD</option>
                            </Select>
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-sm font-medium text-[var(--foreground)]">
                                    {t.settings.fieldMotto}
                                </label>
                                <textarea
                                    defaultValue="A carefully curated collection of literature, philosophy and art."
                                    rows={3}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                                />
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" size="sm">{t.common.reset}</Button>
                        <Button variant="primary" size="sm">{t.common.save}</Button>
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
