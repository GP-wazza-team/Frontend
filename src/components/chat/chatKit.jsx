/* ═══════════════════════════════════════════════════════════════════════════
   CHAT KIT — the one thing the chat surface needs that the foundation does
   not ship, plus the chat scope's bilingual strings.

   Nothing here talks to a store beyond uiStore.language (read-only) and
   nothing here calls a service. It is presentation only.

     useChatText()   the chat scope's strings in both languages. uiStore's t()
                     covers the shell's vocabulary; the transcript, the plan
                     docket and the clarification card have their own, and the
                     app ships Arabic-first — an English-only work order on an
                     Arabic console is the two-class interface again.
     <TurnRow>       one row on the app-wide 56px gutter grid. Every turn, every
                     card and the composer hint sit on the same spine, so a
                     scene number, a turn index and a seam figure line up on one
                     axis all the way down a two-hour session.
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'
import { useUIStore } from '../../store/uiStore'

/* ── STRINGS ─────────────────────────────────────────────────────────────── */

const STRINGS = {
  en: {
    you: 'you',
    turn: 'turn',

    /* transcript */
    retry: 'Retry',
    retryHint: "Picks up where it stopped — finished scenes aren't charged again.",
    scene: 'Scene',
    openOriginal: 'Open full size',
    working: 'Working',

    /* empty state */
    emptyLegend: 'Start a job',
    starterLegend: 'Or start from one of these',
    starter1: 'A 5-second product shot of a glass perfume bottle on wet stone',
    starter2: 'Four scenes: a courier crossing a city at dawn',
    starter3: 'A portrait of a falconer at golden hour, 9:16',

    /* run strip */
    runLegend: 'Run',
    elapsed: 'Elapsed',

    /* composer */
    attach: 'Attach an image',
    removeAttachment: 'Remove the attachment',
    sendHint: 'Enter to send · Shift+Enter for a new line',
    costsCredits: 'Starts a run — this costs credits',

    /* plan docket */
    workOrder: 'Work order',
    reviewBefore: 'Review before generating',
    summary: 'Summary',
    characters: 'Characters',
    environment: 'Environment',
    scenario: 'Scenario',
    script: 'Script',
    scenes: 'scenes',
    onePerLine: 'One scene per line.',
    edit: 'Edit',
    save: 'Save',
    saveScript: 'Save script',
    saving: 'Saving…',
    cancel: 'Cancel',
    back: 'Back',
    revise: 'Revise',
    whatShouldChange: 'What should change?',
    sendFeedback: 'Send feedback',
    spec: 'Spec',
    model: 'Model',
    imageModel: 'Image',
    quality: 'Quality',
    aspect: 'Aspect',
    sceneCount: 'Scenes',
    seconds: 'Seconds',
    estimate: 'Est.',
    previews: 'Previews',
    previewCharacter: 'Preview character',
    previewEnvironment: 'Preview environment',
    previewCosts: 'Generates a real image — this costs credits',
    commit: 'Commit',
    commitCosts: 'Authorises the spend and starts the render',
    cancelled: 'Cancelled.',
    authorised: 'Authorised',
    empty: '—',

    /* clarification */
    detailsFirst: 'A few details first',
    typeYourOwn: 'or type your own…',
    continueLabel: 'Continue',
    skipHint: 'Anything you skip is filled in with a sensible default.',
    answered: 'Answered.',
  },
  ar: {
    you: 'أنت',
    turn: 'دور',

    retry: 'إعادة المحاولة',
    retryHint: 'يكمل من حيث توقف — المشاهد المكتملة لا تُحتسب مرة أخرى.',
    scene: 'مشهد',
    openOriginal: 'عرض بالحجم الكامل',
    working: 'جارٍ العمل',

    emptyLegend: 'ابدأ مهمة',
    starterLegend: 'أو ابدأ من أحد هذه',
    starter1: 'لقطة منتج مدتها ٥ ثوانٍ لزجاجة عطر زجاجية على حجر مبلل',
    starter2: 'أربعة مشاهد: مندوب توصيل يعبر المدينة عند الفجر',
    starter3: 'صورة لصقّار وقت الغروب، بنسبة ٩:١٦',

    runLegend: 'التشغيل',
    elapsed: 'المدة',

    attach: 'إرفاق صورة',
    removeAttachment: 'إزالة المرفق',
    sendHint: 'Enter للإرسال · Shift+Enter لسطر جديد',
    costsCredits: 'يبدأ تشغيلاً — هذا يستهلك رصيداً',

    workOrder: 'أمر العمل',
    reviewBefore: 'راجع قبل التنفيذ',
    summary: 'الملخص',
    characters: 'الشخصيات',
    environment: 'البيئة',
    scenario: 'السيناريو',
    script: 'النص',
    scenes: 'مشاهد',
    onePerLine: 'مشهد واحد في كل سطر.',
    edit: 'تعديل',
    save: 'حفظ',
    saveScript: 'حفظ النص',
    saving: 'جارٍ الحفظ…',
    cancel: 'إلغاء',
    back: 'رجوع',
    revise: 'مراجعة',
    whatShouldChange: 'ما الذي يجب تغييره؟',
    sendFeedback: 'إرسال الملاحظات',
    spec: 'المواصفات',
    model: 'النموذج',
    imageModel: 'الصورة',
    quality: 'الجودة',
    aspect: 'الأبعاد',
    sceneCount: 'المشاهد',
    seconds: 'الثواني',
    estimate: 'التقدير',
    previews: 'المعاينات',
    previewCharacter: 'معاينة الشخصية',
    previewEnvironment: 'معاينة البيئة',
    previewCosts: 'ينتج صورة حقيقية — هذا يستهلك رصيداً',
    commit: 'اعتماد',
    commitCosts: 'يعتمد المبلغ ويبدأ التنفيذ',
    cancelled: 'أُلغي.',
    authorised: 'معتمد',
    empty: '—',

    detailsFirst: 'بعض التفاصيل أولاً',
    typeYourOwn: 'أو اكتب إجابتك…',
    continueLabel: 'متابعة',
    skipHint: 'أي سؤال تتخطاه يُملأ بقيمة افتراضية مناسبة.',
    answered: 'تمت الإجابة.',
  },
}

export function useChatText() {
  const language = useUIStore((s) => s.language)
  const ar = language === 'ar'
  const tx = (key) => (ar ? STRINGS.ar[key] : STRINGS.en[key]) ?? STRINGS.en[key] ?? key
  return { tx, ar }
}

/* ── THE GUTTER ROW ──────────────────────────────────────────────────────────
   56px leading gutter + the content column, the same spine every other route
   in the application is laid on. `span` drops the gutter and runs the child
   across the whole grid — the plan docket is a work order, not a message, and
   it is allowed to be wider than the prose measure. */

export const TURN_GRID = 'grid grid-cols-[56px_minmax(0,1fr)]'

export function TurnRow({ gutter = null, span = false, className = '', children, ...rest }) {
  return (
    <div className={`${TURN_GRID}${className ? ' ' + className : ''}`} {...rest}>
      {!span && (
        <div className="wz-gutter" style={{ paddingBlockStart: 2 }}>
          {gutter}
        </div>
      )}
      <div className="min-w-0" style={span ? { gridColumn: '1 / -1' } : undefined}>
        {children}
      </div>
    </div>
  )
}

/* THE FRAME is not here. Every piece of generated media in the application —
   the transcript, the plan docket, the library, the run drawer and the
   lightbox — goes through the ONE implementation in ../ui/Frame. A second
   construction living in the chat scope is exactly what stops a preview in
   chat and a print in the library from being the same artifact. */
