/* ═══════════════════════════════════════════════════════════════════════════
   CHAT KIT — the chat scope's bilingual strings, plus the ONE media object the
   chat surface draws generated work into.

   WHAT WAS DELETED. `TurnRow` and `TURN_GRID` — a 56px leading gutter that ran
   zero-padded turn ordinals down the edge of every message. It was the loudest
   thing on the screen and it numbered the wrong noun: nobody refers to "turn
   07". Scene numbers are real and they stay; turn ordinals are gone, and with
   them the whole `.wz-page` / `.wz-gutter` apparatus.

   WHAT ARRIVED. <MediaWell>. This is a video product, and its main screen used
   to show generated video as a 520px-wide attachment inside a chat transcript.
   Media now sits in a DARK WELL at a size worth judging, because a dark
   surround is how you judge video colour honestly — the reason every editor is
   dark and the reason this application is light everywhere except here.

   A4 / A5. The player subtree carries dir="ltr". A scrubber and a transport
   refer to the direction of the tape, not the direction of reading, so they do
   not mirror even though the Arabic page around them does. Native controls are
   used rather than a hand-built scrubber precisely so A5 is satisfied by
   construction: there is no input[type=range] anywhere in this scope.

   Nothing here talks to a store beyond uiStore.language (read-only) and
   nothing here calls a service. It is presentation only.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useMediaDownload } from '../../hooks/useMediaDownload'
import { Download } from '../Icon'

/* ── STRINGS ─────────────────────────────────────────────────────────────── */

const STRINGS = {
  en: {
    /* the workspace — the no-project-open state */
    workspace: 'Workspace',
    workspaceSub: 'Open a project to carry on, or start something new.',
    projects: 'Your projects',
    projectsSub: 'Open one to carry on, or start something new.',
    newProject: 'New project',
    noProjects: 'No projects yet',
    noProjectsLine: 'Start one and everything you make will collect here.',
    untitled: 'Untitled project',
    stReady: 'Has work',
    stEmpty: 'Not started',
    loadingProjects: 'Loading',

    /* transcript */
    you: 'You',
    /* The assistant is named in Arabic in BOTH languages — it is the brand
       mark, not a translatable noun like "You" beside it. */
    wazza: 'مِخيال',
    retry: 'Resume',
    retryHint: "Picks up where it stopped — finished scenes aren't charged again.",
    somethingFailed: 'Something failed',
    copyDetail: 'Copy detail',
    copied: 'Copied',
    runRef: 'Run',
    scene: 'Scene',
    openOriginal: 'Open full size',
    working: 'Working',
    result: 'Result',
    attachment: 'Attachment',

    /* empty transcript */
    emptyLegend: 'Describe what you want made',
    starterLegend: 'Or start from one of these',
    starter1: 'A 5-second product shot of a glass perfume bottle on wet stone',
    starter2: 'Four scenes: a courier crossing a city at dawn',
    starter3: 'A portrait of a falconer at golden hour, 9:16',

    /* the run band */
    runLegend: 'Run',
    elapsed: 'Elapsed',
    stRunning: 'Running',
    stWaiting: 'Waiting for you',

    /* composer */
    attach: 'Attach an image',
    removeAttachment: 'Remove the attachment',
    sendHint: 'Enter to send · Shift+Enter for a new line',
    costsCredits: 'Plans a run. Nothing is spent until you authorise it.',
    sketchMode: 'This is a sketch',
    // The composer control is an icon, so its name has to carry on hover and
    // to a screen reader — the sentence below is the explanation, not the name.
    sketchToggle: 'Sketch',
    sketchModeTitle: 'Redraw this rough drawing into a finished shot, then animate that — instead of animating the drawing itself.',
    sketchOnHint: 'Your drawing sets the shot. It gets redrawn properly, then animated.',
    sketchOffHint: 'Used as the opening frame, as-is.',
    sketchNeedsFile: 'Attach the drawing you want redrawn.',

    /* the work order */
    workOrder: 'Work order',
    reviewBefore: 'Awaiting your approval',
    approved: 'Approved',
    summary: 'Summary',
    characters: 'Characters',
    environment: 'Environment',
    scenario: 'Scenario',
    style: 'Style',
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
    output: 'Output',
    renderMode: 'Mode',
    draft: 'Draft',
    final: 'Final',
    renderModeWhy: 'Draft renders on the cheapest capable model at 480p, so you can iterate for less. Final restores exactly the settings draft replaced.',
    draftNote: 'Draft mode — cheapest model, 480p. Switch to Final before the render you keep.',
    model: 'Model',
    imageModel: 'Image model',
    quality: 'Quality',
    aspect: 'Aspect',
    sceneCount: 'Scenes',
    seconds: 'Seconds',
    previews: 'Reference images',
    previewCharacter: 'Preview character',
    previewEnvironment: 'Preview environment',
    previewCosts: 'Generates a real image — this costs credits',
    whichCharacter: 'Which character to draw a reference sheet for',
    noCharacters: 'No named characters in this plan',
    total: 'Total to authorise',
    authorise: 'Authorise',
    /* Was "The authorisation sits in the bar at the top of the screen." The
       bar is gone and the button is directly below this line, so the sentence
       had stopped being true. It now says the thing worth saying instead. */
    authoriseHint: 'Nothing has been charged yet. Authorising starts the render.',
    /* Said BEFORE the button, not after the bill. Every character needs a
       reference sheet for their face to survive from one shot to the next, so
       authorising draws the ones that are missing — which is a real charge the
       card used to make silently. Previewing by hand does not add to it; it
       spends the same money earlier and lets you look at the result. */
    pendingPreview: 'Authorising first draws 1 reference sheet —',
    pendingPreviews: 'Authorising first draws {n} reference sheets —',
    pendingPreviewsWhy: 'One per character, plus the environment, so faces and setting stay the same across shots. Anything you have already previewed is reused, not redrawn.',
    commitCosts: 'Authorises the total above and starts the render',
    cancelled: 'Cancelled',
    empty: '—',

    /* clarification */
    detailsFirst: 'A few details first',
    detailsSub: 'Answer what matters; the rest is filled in sensibly.',
    typeYourOwn: 'or type your own…',
    continueLabel: 'Continue',
    skipHint: 'Anything you skip is filled in with a sensible default.',
    answered: 'Answered',
  },
  ar: {
    workspace: 'مساحة العمل',
    workspaceSub: 'افتح مشروعاً لتكمله، أو ابدأ مشروعاً جديداً.',
    projects: 'مشاريعك',
    projectsSub: 'افتح مشروعاً لتكمله، أو ابدأ مشروعاً جديداً.',
    newProject: 'مشروع جديد',
    noProjects: 'لا توجد مشاريع بعد',
    noProjectsLine: 'ابدأ مشروعاً وسيتجمع هنا كل ما تنتجه.',
    untitled: 'مشروع بدون عنوان',
    stReady: 'يحتوي على أعمال',
    stEmpty: 'لم يبدأ',
    loadingProjects: 'جارٍ التحميل',

    you: 'أنت',
    wazza: 'مِخيال',
    retry: 'استئناف',
    retryHint: 'يكمل من حيث توقف — المشاهد المكتملة لا تُحتسب مرة أخرى.',
    somethingFailed: 'حدث خطأ',
    copyDetail: 'نسخ التفاصيل',
    copied: 'تم النسخ',
    runRef: 'التشغيل',
    scene: 'مشهد',
    openOriginal: 'عرض بالحجم الكامل',
    working: 'جارٍ العمل',
    result: 'الناتج',
    attachment: 'مرفق',

    emptyLegend: 'صف ما تريد إنتاجه',
    starterLegend: 'أو ابدأ من أحد هذه',
    starter1: 'لقطة منتج مدتها ٥ ثوانٍ لزجاجة عطر زجاجية على حجر مبلل',
    starter2: 'أربعة مشاهد: مندوب توصيل يعبر المدينة عند الفجر',
    starter3: 'صورة لصقّار وقت الغروب، بنسبة ٩:١٦',

    runLegend: 'التشغيل',
    elapsed: 'المدة',
    stRunning: 'قيد التنفيذ',
    stWaiting: 'بانتظارك',

    attach: 'إرفاق صورة',
    removeAttachment: 'إزالة المرفق',
    sendHint: 'Enter للإرسال · Shift+Enter لسطر جديد',
    costsCredits: 'يجهّز خطة التنفيذ. لا يُصرف شيء قبل اعتمادك.',
    sketchMode: 'هذا رسم تخطيطي',
    sketchToggle: 'رسم تخطيطي',
    sketchModeTitle: 'يعيد رسم هذا المخطط كلقطة نهائية مكتملة ثم يحرّكها، بدلاً من تحريك الرسم نفسه.',
    sketchOnHint: 'رسمك يحدّد اللقطة. سيُعاد رسمه بشكل كامل ثم يُحرَّك.',
    sketchOffHint: 'يُستخدم كأول إطار في الفيديو كما هو.',
    sketchNeedsFile: 'أرفق الرسم الذي تريد إعادة رسمه.',

    workOrder: 'أمر العمل',
    reviewBefore: 'بانتظار اعتمادك',
    approved: 'معتمد',
    summary: 'الملخص',
    characters: 'الشخصيات',
    environment: 'البيئة',
    scenario: 'السيناريو',
    style: 'الأسلوب',
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
    output: 'المخرجات',
    renderMode: 'الوضع',
    draft: 'مسودة',
    final: 'نهائي',
    renderModeWhy: 'المسودة تُنفَّذ على أرخص نموذج مناسب وبدقة 480p لتجرّب بتكلفة أقل، و«نهائي» يعيد الإعدادات التي استبدلتها المسودة كما كانت.',
    draftNote: 'وضع المسودة — أرخص نموذج وبدقة 480p. بدّل إلى «نهائي» قبل التنفيذ الذي ستحتفظ به.',
    model: 'النموذج',
    imageModel: 'نموذج الصورة',
    quality: 'الجودة',
    aspect: 'الأبعاد',
    sceneCount: 'المشاهد',
    seconds: 'الثواني',
    previews: 'الصور المرجعية',
    previewCharacter: 'معاينة الشخصية',
    previewEnvironment: 'معاينة البيئة',
    previewCosts: 'ينتج صورة حقيقية — هذا يستهلك رصيداً',
    whichCharacter: 'الشخصية التي ستُرسم لها ورقة مرجعية',
    noCharacters: 'لا توجد شخصيات مسماة في هذه الخطة',
    total: 'الإجمالي المطلوب اعتماده',
    authorise: 'اعتماد',
    authoriseHint: 'لم يُخصم شيء بعد. الاعتماد يبدأ التنفيذ.',
    /* الصيغة تتجنّب مطابقة العدد للمعدود: العدد بين قوسين بعد الاسم، فتصحّ
       للواحد وللجمع دون فرعين. */
    pendingPreview: 'الاعتماد يرسم أولاً ورقة مرجعية واحدة —',
    pendingPreviews: 'الاعتماد يرسم أولاً أوراقاً مرجعية ({n}) —',
    pendingPreviewsWhy: 'ورقة لكل شخصية، إضافةً إلى البيئة، لتبقى الوجوه والمكان ثابتة بين اللقطات. وما سبقت معاينته يُعاد استخدامه ولا يُرسم من جديد.',
    commitCosts: 'يعتمد الإجمالي أعلاه ويبدأ التنفيذ',
    cancelled: 'أُلغي',
    empty: '—',

    detailsFirst: 'بعض التفاصيل أولاً',
    detailsSub: 'أجب عمّا يهمك، والباقي يُملأ بقيم مناسبة.',
    typeYourOwn: 'أو اكتب إجابتك…',
    continueLabel: 'متابعة',
    skipHint: 'أي سؤال تتخطاه يُملأ بقيمة افتراضية مناسبة.',
    answered: 'تمت الإجابة',
  },
}

export function useChatText() {
  const language = useUIStore((s) => s.language)
  const ar = language === 'ar'
  const tx = (key) => (ar ? STRINGS.ar[key] : STRINGS.en[key]) ?? STRINGS.en[key] ?? key
  return { tx, ar }
}

/* ── DATES ───────────────────────────────────────────────────────────────────
   A3: a date is Latin numerals inside an Arabic run, so it is rendered numeric
   and .mono in BOTH languages. Month names would need a locale-specific script
   and would then have to be excluded from .mono, which costs the tabular
   alignment down a column of tiles for nothing. */
export function isoDay(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function clockTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

/* ── MEDIA ───────────────────────────────────────────────────────────────────
   THE MEDIA IS THE HERO. One object, used by the transcript and by the work
   order's reference images, so a preview and a finished cut are visibly the
   same artifact.

     · a --card shell so the caption rail is chrome and reads as chrome
     · the media itself on --well, dark, never cropped (no object-fit: cover —
       this product sells 9:16 and 21:9 and must never trim what was paid for)
     · at most three facts in the caption rail (principle 7)

   The player subtree carries dir="ltr" (A4). Native controls, so there is no
   input[type=range] scrubber anywhere in this scope (A5). */

export function MediaWell({
  type,
  url,
  caption = [],
  onOpen,
  openLabel,
  maxHeight = '58vh',
  maxWidth,
  assetId,
  downloadable = true,
}) {
  // A dead URL must not leave a broken-image glyph sitting in the transcript.
  const [broken, setBroken] = useState(false)
  const { download, saving, label: downloadLabel } = useMediaDownload()

  /* The save sits on the artifact itself, so the clip a user just watched
     render can be kept without going to the library to find it again. Audio
     and a URL we already know is dead are the exceptions. */
  const canDownload = downloadable && !broken && url && type !== 'audio'
  const facts = caption.filter((c) => c !== null && c !== undefined && c !== '')

  const mediaStyle = {
    display: 'block',
    inlineSize: '100%',
    blockSize: 'auto',
    maxBlockSize: maxHeight,
    margin: '0 auto',
  }

  let body
  if (broken) {
    body = (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mono break-anywhere"
        style={{ color: 'var(--on-well)', fontSize: 12, padding: 20, display: 'block', textDecoration: 'underline' }}
      >
        {url}
      </a>
    )
  } else if (type === 'audio') {
    body = (
      <div dir="ltr" style={{ padding: 16 }}>
        <audio controls src={url} style={{ inlineSize: '100%' }} />
      </div>
    )
  } else if (type === 'video') {
    body = (
      /* A4/A5 — the transport does not mirror. */
      <div dir="ltr">
        <video controls preload="metadata" src={url} style={mediaStyle} onError={() => setBroken(true)} />
      </div>
    )
  } else {
    body = (
      <img
        src={url}
        alt=""
        loading="lazy"
        style={{ ...mediaStyle, cursor: onOpen ? 'zoom-in' : 'default' }}
        onClick={onOpen}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <figure
      className="card"
      style={{ margin: 0, overflow: 'hidden', ...(maxWidth ? { maxInlineSize: maxWidth } : null) }}
    >
      <div className="well" style={{ borderRadius: 0, display: 'block' }}>
        {body}
      </div>

      {(facts.length > 0 || onOpen || canDownload) && (
        <figcaption className="tile__row" style={{ padding: '9px 12px' }}>
          {/* A3 — each fact is isolated with <bdi> so a resolution, a scene
              number or a model name inside an Arabic run keeps its own
              direction without being forced into the mono face. */}
          <span className="truncate" style={{ flex: 1 }}>
            {facts.map((f, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true" style={{ padding: '0 6px' }}>·</span>}
                <bdi>{f}</bdi>
              </React.Fragment>
            ))}
          </span>
          {onOpen && (
            <button type="button" className="btn-t" onClick={onOpen} title={openLabel} aria-label={openLabel}>
              {openLabel}
            </button>
          )}
          {canDownload && (
            <button
              type="button"
              className="btn-t"
              onClick={() => download({ id: assetId, url })}
              disabled={saving}
              title={downloadLabel}
              aria-label={downloadLabel}
              aria-busy={saving || undefined}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              {downloadLabel}
            </button>
          )}
        </figcaption>
      )}
    </figure>
  )
}
