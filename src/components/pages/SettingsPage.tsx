"use client";
/**
 * components/pages/SettingsPage.tsx
 *
 * General settings form and Export & Backup panel.
 *
 * i18n: every visible label, option text, and button is sourced from t.settings.
 * Field labels and button texts update when the language changes.
 * The loan duration options are translated strings from t.settings.loan30/60/90.
 */

import {useLanguage} from "@/src/lib/i18n/context";

export default function SettingsPage() {
    const {t} = useLanguage();

    return (
        <div data-testid="settings-page">
            <div className="flex items-end justify-between mb-7 pb-5 border-b border-[rgba(61,28,2,0.1)]">
                <div>
                    <h2 className="font-playfair text-4xl font-black text-[#3d1c02] leading-none">{t.settings.title}</h2>
                    <p className="text-sm text-[#6b4c2a] mt-1.5 italic">{t.settings.subtitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-6">
                {/* General settings panel */}
                <div
                    className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[rgba(61,28,2,0.08)]">
                        <div
                            className="font-playfair text-[1.05rem] font-bold text-[#3d1c02]">{t.settings.generalTitle}</div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label={t.settings.fieldLibraryName}>
                                <input type="text" defaultValue="My Personal Library" className={inputCls}/>
                            </FieldGroup>
                            <FieldGroup label={t.settings.fieldOwnerName}>
                                <input type="text" defaultValue="Bibliophile" className={inputCls}/>
                            </FieldGroup>
                            <FieldGroup label={t.settings.fieldLoanDuration}>
                                {/* Option values stay as "30 days" etc. — these are data values.
                    The displayed text is translated via t.settings.loan30/60/90. */}
                                <select className={inputCls}>
                                    <option value="30">{t.settings.loan30}</option>
                                    <option value="60">{t.settings.loan60}</option>
                                    <option value="90">{t.settings.loan90}</option>
                                </select>
                            </FieldGroup>
                            <FieldGroup label={t.settings.fieldDateFormat}>
                                <select className={inputCls}>
                                    <option>DD MMM YYYY</option>
                                    <option>MM/DD/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                </select>
                            </FieldGroup>
                            <FieldGroup label={t.settings.fieldMotto} className="col-span-2">
                <textarea
                    defaultValue="A carefully curated collection of literature, philosophy and art."
                    rows={3}
                    className={`${inputCls} resize-y leading-relaxed`}
                />
                            </FieldGroup>
                        </div>
                        <div className="mt-5 flex gap-2.5 justify-end">
                            <button
                                className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase bg-transparent text-[#6b4c2a] border border-[rgba(61,28,2,0.18)] hover:bg-[#ede5d5] transition-colors">
                                {t.common.reset}
                            </button>
                            <button
                                className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase bg-[#3d1c02] text-[#f5f0e8] hover:bg-[#5c2d0a] transition-colors">
                                {t.common.save}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Export & Backup panel */}
                <div
                    className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[rgba(61,28,2,0.08)]">
                        <div
                            className="font-playfair text-[1.05rem] font-bold text-[#3d1c02]">{t.settings.exportTitle}</div>
                    </div>
                    <div className="p-6 flex flex-col gap-3">
                        <ExportBtn>{t.settings.exportCsv}</ExportBtn>
                        <ExportBtn>{t.settings.exportJson}</ExportBtn>
                        <ExportBtn>{t.settings.printCatalogue}</ExportBtn>
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputCls =
    "bg-[#ede5d5] border border-[rgba(61,28,2,0.15)] rounded px-3 py-2 font-serif text-[0.82rem] text-[#1a0f00] outline-none focus:border-[#c4742a] focus:shadow-[0_0_0_3px_rgba(196,116,42,0.1)] w-full transition-all";

function FieldGroup({label, children, className = ""}: {
    label: string;
    children: React.ReactNode;
    className?: string
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#6b4c2a]">{label}</label>
            {children}
        </div>
    );
}

function ExportBtn({children}: { children: React.ReactNode }) {
    return (
        <button
            className="w-full text-center px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase bg-transparent text-[#6b4c2a] border border-[rgba(61,28,2,0.18)] hover:bg-[#ede5d5] transition-colors">
            {children}
        </button>
    );
}
