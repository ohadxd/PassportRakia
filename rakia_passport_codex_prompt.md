# Codex Prompt — אפליקציית PWA פספורט לתערוכת רקיע

> Use this document as the full build prompt. This is not a short demo request. Build the complete application in **pursue-goal mode**: keep implementing until the full passport flow works end-to-end.

---

## 0. תמצית המוצר

בנה אפליקציית **PWA Web Passport** לתערוכת “משימת רקיע”. המשתמשים הם קהל רחב ובוגר, וגם ילדים יכולים להשתתף, אבל האפליקציה **לא מיועדת להיראות ילדותית**. היא צריכה להרגיש כמו **דרכון אמיתי של משימת חלל**: רשמי, מוזיאוני, יפה, איכותי, RTL, עם דפים, חותמות, ניקוד, תוצרים אישיים ו־PDF סופי.

המשתמש נכנס דרך QR, מכניס שם, מצלם תמונת פספורט, ואז עובר במסלול תחנות לפי הסדר הפיזי בתערוכה. בכל תחנה יש עמוד דרכון עם חידון, סרטון, הפניה ל־AR באפליקציית רקיע, משחקון, סימולציית Three.js או יצירה. בסיום תחנה מקבלים חותמת ירוקה במרכז העמוד. מותר לדלג, אבל דילוג נותן 0 נקודות ואין חותמת. אפשר לדפדף אחורה ולחזור להשלים תחנות.

בסוף המסלול המשתמש מקבל PDF רב־עמודי להורדה עם תמונה, שם, חותמות, ניקוד, דירוג, פאץ׳, תכשיט/ניסוי תכשיט, חלום אישי וסיכום.

בנוסף יש מסך טלוויזיה נפרד שמציג בזמן אמת תמונה, שם, חלום וניקוד של משתתפים.

---

## 1. מצב עבודה חובה — Pursue Goal

Do not build only a small demo. Do not create only 3–5 sample missions. Do not leave core TODO placeholders.

You must implement the full app structure and every station in a functional way.

Complex missions can start with a simple but polished functional version, but every mission must:

- exist in the route
- render correctly
- have Hebrew content
- be completable
- be skippable
- save progress to Firebase
- participate in scoring
- show a stamp when completed
- appear in the final PDF summary

No “TODO: implement later” for core product flow.

If the repository already exists, inspect it and adapt. If the repository is empty, create a Nuxt 3 / Vue 3 / TypeScript project.

---

## 2. טכנולוגיה נדרשת

Preferred stack:

- Nuxt 3
- Vue 3
- TypeScript
- Firebase Hosting
- Firebase Firestore
- Firebase Storage
- Firebase Anonymous Auth if useful, but do not require login from the user
- PWA support
- Three.js for interactive 3D scenes
- Canvas/SVG for patch designer and visual outputs
- jsPDF + html2canvas or equivalent for PDF export
- CSS/GSAP/framer-like animation for realistic page flip; choose the best available library or implement manually

Important:

- UI language: Hebrew.
- Direction: RTL.
- Main target: mobile phone in portrait mode.
- Must work on iPhone and Android browsers as PWA.
- Wi-Fi in the exhibit is available and reliable.
- Do not require offline mode for all data.

---

## 3. החלטה סופית לגבי סרטונים

Do **not** use `public/videos`.

Do **not** bundle videos inside the PWA.

Do **not** precache mission videos in the service worker.

All mission videos must be loaded from **Firebase Storage** by configurable storage paths or download URLs.

The PWA shell must remain lightweight and fast.

Cache only small static app assets:

- JS/CSS app shell
- icons
- passport textures
- stamp sound
- small UI images
- small 3D assets if needed

Videos:

- stored in Firebase Storage under paths such as `mission-videos/<id>.mp4`
- loaded on demand when the user reaches the relevant station
- optionally preload only the next mission video in the background
- never preload the whole set of videos at startup

---

## 4. עיצוב וחוויית משתמש

### 4.1 אופי חזותי

The app must look like a **realistic official mission passport**, not a childish quiz app.

Visual style:

- passport cover
- paper/cream pages
- official-looking typography
- subtle space elements
- stamps
- page numbers
- mission labels
- elegant museum-level design
- no childish cartoons unless used as tiny decorative icons

The exhibit audience is adults and families. Keep it clear for children, but visually mature.

### 4.2 פתיחה

Flow:

1. User opens `/`.
2. Sees a passport cover.
3. Enters name.
4. Takes a passport photo using device camera.
5. Can retake photo.
6. Photo is saved to Firebase Storage.
7. Session is saved to Firestore.
8. Session id is stored in localStorage/session cookie.
9. User sees a transition screen: **“מוכן למשימה”**.
10. Passport opens into the sequential mission flow.

If camera permission fails:

- allow retry
- allow upload from file as fallback
- only if both fail, allow continue without photo with a neutral silhouette

### 4.3 דפדוף פספורט

The page flip is a core feature.

It must not be a regular swipe. It should visually feel like the user is grabbing the edge of a physical passport page.

Required behavior:

- Forward navigation: drag the **left edge** of the page **to the right**.
- Backward navigation: drag the **right edge** of the page **to the left**.
- Show a visible page curl/fold at the grabbed edge.
- Show the page underneath while dragging.
- If drag passes a threshold, complete the page turn.
- If released before threshold, page returns to its original position.
- Support touch and pointer events.
- Also include subtle visual hints at page edges so users understand they can drag.
- User can go backward to earlier pages.
- User moves by sequence only. No QR per station.

### 4.4 חותמת

Completed mission = green circular stamp in the center of the page.

Skipped mission = no stamp.

Stamp requirements:

- CSS/SVG based, not a flat PNG.
- Green color.
- Round official passport stamp style.
- Center of the page.
- Slight rotation/random imperfection.
- Stamp animation: quick scale/impact like real stamping.
- Short stamp sound.
- Stamp text can include:
  - “משימת רקיע”
  - “הושלם”
  - “RAKIA MISSION”
  - station number/date if visually appropriate

Use the style inspiration of a circular CSS stamp like: `https://codepen.io/chris22smith/pen/nKGvgO`, but do not copy blindly; adapt to the passport design.

### 4.5 כפתורי חידון

Before a quiz, show the station title and a button with exactly this text:

```text
התחל שאלון
```

Do not write: “קראתי את הקיר — התחל שאלון”.

The timer starts only after the user presses **התחל שאלון**, so the visitor can read the physical wall without time pressure.

---

## 5. ניקוד ודירוג

All route stations are part of the sequence, but the user may skip.

Rules:

- Skip = 0 points.
- Skip = no stamp.
- User can later flip backward and complete a skipped station.
- Wrong answer = allow another attempt.
- Do not block the user forever.
- More interactive/creative missions give more points.
- Faster correct completion gives a speed bonus, but only after pressing **התחל שאלון** or starting the actual game.

Suggested scoring model:

```ts
const SCORE_BY_TYPE = {
  introVideo: 40,
  arConfirmation: 50,
  videoConfirmation: 60,
  quizSimple: 80,
  quizMulti: 120,
  sortGame: 150,
  classificationGame: 150,
  threeInfoQuiz: 160,
  threeGame: 180,
  designer: 200,
  dreamInput: 80,
  summary: 0
}
```

Speed bonus:

- Up to +30% of base score.
- Starts only after quiz/game start.
- No speed pressure while reading the wall.

Attempts:

- First correct attempt: full question points.
- Second attempt: reduce bonus but still allow completion.
- Do not give negative score.

Ranks in Hebrew only:

```ts
const RANKS = [
  { min: 0, title: "צוער רקיע" },
  { min: 700, title: "חוקר תחנת חלל" },
  { min: 1400, title: "מומחה משימה" },
  { min: 2200, title: "מהנדס טיסה" },
  { min: 3000, title: "מפקד משימת רקיע" }
]
```

Adjust thresholds after implementing total possible score.

---

## 6. Firebase Data Model

### 6.1 Firestore collections

#### `sessions/{sessionId}`

```ts
interface PassportSession {
  id: string
  name: string
  photoUrl?: string
  photoStoragePath?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  currentPageIndex: number
  totalScore: number
  rank: string
  completedCount: number
  skippedCount: number
  lastActiveAt: Timestamp
}
```

#### `sessions/{sessionId}/missionProgress/{missionId}`

```ts
interface MissionProgress {
  missionId: string
  order: number
  status: 'not-started' | 'started' | 'completed' | 'skipped'
  score: number
  baseScore: number
  speedBonus: number
  attempts: number
  startedAt?: Timestamp
  completedAt?: Timestamp
  skippedAt?: Timestamp
  stamped: boolean
  answers?: Array<{
    questionId: string
    selected: string | number | string[]
    correct: boolean
    attempts: number
  }>
}
```

#### `dreams/{dreamId}`

```ts
interface DreamEntry {
  id: string
  sessionId: string
  name: string
  photoUrl?: string
  dream: string
  scoreAtSubmit: number
  approved: boolean
  rejectedReason?: string
  createdAt: Timestamp
}
```

No admin interface is required. Filtering is automatic.

#### `creations/{creationId}`

```ts
interface Creation {
  id: string
  sessionId: string
  type: 'patch' | 'jewelry'
  imageUrl: string
  storagePath: string
  data: unknown
  createdAt: Timestamp
}
```

Optional PDF storage:

```ts
interface PdfExport {
  sessionId: string
  pdfUrl?: string
  pdfStoragePath?: string
  generatedAt: Timestamp
}
```

The user must be able to download the PDF even if it is not saved permanently.

### 6.2 Firebase Storage paths

Use paths like:

```text
user-photos/{sessionId}/passport-photo.jpg
mission-videos/{missionId}.mp4
creations/{sessionId}/patch.png
creations/{sessionId}/jewelry.png
pdf/{sessionId}/rakia-passport.pdf
```

### 6.3 Session persistence

Store `sessionId` locally so if the user refreshes, the passport resumes.

---

## 7. Routes

Implement these routes:

```text
/
/passport/[sessionId]
/tv/dreams
/export/[sessionId]
```

### `/`

Onboarding: passport cover, name, camera photo, create session.

### `/passport/[sessionId]`

Main passport engine. Shows one page at a time. Handles page flip, missions, stamps, skip, score, persistence.

### `/tv/dreams`

TV display connected to Firestore. Shows participants live.

### `/export/[sessionId]`

Generates/downloads multi-page PDF.

No admin route required.

---

## 8. Suggested project structure

```text
src/
  app.vue
  pages/
    index.vue
    passport/[sessionId].vue
    tv/dreams.vue
    export/[sessionId].vue

  components/
    passport/
      PassportCover.vue
      PassportShell.vue
      PassportPage.vue
      PageFlip.vue
      Stamp.vue
      ScoreBar.vue
      MissionHeader.vue
      SkipButton.vue
      RankBadge.vue

    missions/
      MissionRenderer.vue
      IntroVideoMission.vue
      QuizMission.vue
      VideoMission.vue
      ARMission.vue
      SortMission.vue
      ClassificationMission.vue
      ThreeInfoQuizMission.vue
      ThreeGameMission.vue
      PatchDesignerMission.vue
      JewelryDesignerMission.vue
      DreamMission.vue
      ConfirmationMission.vue
      SummaryMission.vue

    three/
      ISSScene.vue
      MicrogravityVelcroScene.vue
      EarthWindowScene.vue
      LiquidOpticsScene.vue
      JewelryGravityScene.vue
      AsteroidBlinkingScene.vue

    tv/
      DreamWall.vue
      DreamCard.vue

    pdf/
      PassportPdfDocument.vue
      PdfStampGrid.vue
      PdfCreationPage.vue

  data/
    missions.ts
    forbiddenWords.ts
    videoSources.ts

  composables/
    useFirebase.ts
    usePassportSession.ts
    useMissionProgress.ts
    useScore.ts
    usePageFlip.ts
    useStamp.ts
    usePdfExport.ts
    useDreamWall.ts
    useProfanityFilter.ts

  assets/
    sounds/
      stamp.mp3
    textures/
      passport-paper.jpg
      passport-cover.jpg
```

Adjust paths according to Nuxt conventions.

---

## 9. Mission Config Model

Use a mission config file. The app must not hard-code mission logic in many unrelated pages.

Example:

```ts
export type MissionType =
  | 'transition'
  | 'intro-video'
  | 'quiz'
  | 'video-quiz'
  | 'video-confirmation'
  | 'ar-confirmation'
  | 'sort-game'
  | 'classification-game'
  | 'three-info-quiz'
  | 'three-game'
  | 'patch-designer'
  | 'jewelry-designer'
  | 'dream-input'
  | 'confirmation-quiz'
  | 'summary'

export interface MissionConfig {
  id: string
  order: number
  title: string
  subtitle?: string
  type: MissionType
  baseScore: number
  allowSkip: boolean
  stampLabel?: string
  estimatedSeconds?: number
  wallContentSummary?: string
  video?: {
    storagePath: string
    sourceTitle?: string
    sourceReferenceUrl?: string
    loadMode: 'on-demand' | 'preload-next-only'
  }
  questions?: QuizQuestion[]
  sortItems?: SortItem[]
  classificationItems?: ClassificationItem[]
}
```

All missions must be defined in `data/missions.ts`.

---

## 10. סדר התחנות הסופי

Important correction: **היגיינה בחלל comes before מיקרו־כבידה**.

The order is exactly:

0. פתיחה — שם + צילום פספורט — onboarding, not a scored mission
1. מוכן למשימה — transition, no score, no stamp
2. סרטון משימה — intro video/confirmation page
3. משימת רקיע — wall quiz
4. תחנת החלל הבינלאומית — Three.js info + quiz
5. חללית דרגון — external Rakia app AR confirmation
6. AR תחנת החלל — external Rakia app AR confirmation
7. משיגור ועד נחיתה — sort game
8. כושר בחלל — video + quiz
9. ספירה לאחור AR — Rakia app AR + countdown interaction
10. היגיינה בחלל — quiz/sequence
11. מיקרו־כבידה — Three.js Velcro game
12. עיצוב פאץ׳ — patch designer
13. תכשיטי חלל — scientific jewelry designer + microgravity behavior
14. תא שינה — video/quiz based on sleep in microgravity
15. תהיו הכוכב של החלומות שלכם — dream input
16. ארוחה חללית — video + quiz
17. ארוחת בוקר שאפשר לעוף עליה — classification game
18. חלון כדור הארץ — ISS tracker / Earth window
19. ייצור אופטיקה בחלל באמצעות נוזלים — liquid lens demo + quiz
20. חדר בקרה — confirmation + simple quiz
21. משימת רקיע במספרים — number matching quiz
22. שירותים בחלל — video + quiz
23. מציאת אסטרואידים בגרובטק — asteroid blinking game
24. חזרה הביתה — return home video confirmation
25. סיום והורדת PDF — summary/export, no score

---

# 11. Detailed Station Requirements

## 11.0 פתיחה — יצירת פספורט

Type: onboarding, not in mission scoring.

UI:

- passport cover
- input: שם מלא / שם להצגה
- camera capture
- retake button
- continue button

Save:

- Firestore session
- Firebase Storage photo

Display photo on passport cover, final PDF and TV dream wall.

---

## 11.1 מוכן למשימה

Type: transition.

No score. No stamp.

UI text:

```text
מוכן למשימה?
דרכון רקיע שלך נפתח. בכל תחנה תוכל להשלים משימה, לצבור ניקוד ולקבל חותמת.
```

Short page opening animation into passport.

---

## 11.2 סרטון משימה

Type: intro-video or video-confirmation.

Purpose: the visitor watches the physical mission video screen in the exhibition, or watches a short uploaded intro clip if provided.

UI:

```text
סרטון המשימה
צפו בסרטון הפתיחה של משימת רקיע והמשיכו לתחנה הראשונה.
```

Button:

```text
ראיתי
```

Score: small score, e.g. 40, or 0 if configured as transition. Prefer 40 because it is a route action.

---

## 11.3 משימת רקיע

Type: quiz.
Base score: 120.

Wall content summary:

- משימת רקיע שוגרה לחלל ב־8 באפריל 2022 כחלק ממשימת AX-1.
- זו הייתה טיסת החלל הפרטית הראשונה אל תחנת החלל הבינלאומית.
- במשימה השתתפו 4 אסטרונאוטים.
- ביניהם האסטרונאוט הישראלי איתן סטיבה.
- המשימה נמשכה 17 ימים.
- במהלך המשימה בוצעו עשרות ניסויים מדעיים, יצירות אמנות מעוררות השראה ופעילויות חינוכיות לתלמידים ונוער בישראל ובעולם כולו.
- זו הייתה פעילות ראשונה בעברית מהחלל בהיקף כזה.
- המסר: משימת רקיע מקדמת את תחום החלל בישראל ומוכיחה שאין חלום רחוק מדי.

Questions:

```ts
[
  {
    id: 'rakia-q1',
    text: 'באיזה תאריך שוגרה משימת רקיע לחלל?',
    answers: ['1 באפריל 2022', '8 באפריל 2022', '17 באפריל 2022', '8 באפריל 2023'],
    correctIndex: 1
  },
  {
    id: 'rakia-q2',
    text: 'משימת רקיע הייתה חלק מאיזו משימה?',
    answers: ['Apollo 11', 'AX-1', 'Artemis I', 'Crew-1'],
    correctIndex: 1
  },
  {
    id: 'rakia-q3',
    text: 'מי היה האסטרונאוט הישראלי שהשתתף במשימת רקיע?',
    answers: ['אילן רמון', 'איתן סטיבה', 'יורי גגארין', 'סקוט קלי'],
    correctIndex: 1
  },
  {
    id: 'rakia-q4',
    text: 'כמה ימים נמשכה משימת רקיע?',
    answers: ['7 ימים', '10 ימים', '17 ימים', '30 ימים'],
    correctIndex: 2
  }
]
```

Show 2–3 questions per session randomly from this set, not necessarily all every time.

---

## 11.4 תחנת החלל הבינלאומית

Type: three-info-quiz.
Base score: 160.

Wall content summary:

- תחנת החלל הבינלאומית היא המעבדה המרחפת הגדולה ביותר בעולם.
- היא סובבת את כדור הארץ בנפילה חופשית, ולכן מתקיימים בה תנאי מיקרו־כבידה.
- התחנה מקיפה את כדור הארץ בערך כל שעה וחצי.
- אסטרונאוטים רואים בה כ־16 זריחות ושקיעות ביממה.
- אורכה בערך 100 מטר ורוחבה כ־35 מטרים, בערך גודל של מגרש כדורגל.
- התחנה היא שיתוף פעולה בין סוכנויות החלל של ארצות הברית, רוסיה, יפן, קנדה ואירופה.
- מגיעים אליה באמצעות חללית, למשל Dragon על גבי Falcon 9.
- יש בה מעבדות, אזורי מחיה, קופולה, פאנלים סולאריים ועוד.
- התחנה צפויה לסיים תפקידה לקראת/עד 2030 ולהישלח לאזור נקודת נמו.

Three.js requirements:

- Render a polished ISS model or procedural ISS if no GLB exists.
- Add clickable markers:
  - פאנלים סולאריים
  - מעבדות מחקר
  - אזור מחיה
  - קופולה
  - חללית עגונה
- Each marker opens a short Hebrew info card.
- After visiting at least 2 markers, allow quiz.

Questions:

```ts
[
  {
    id: 'iss-q1',
    text: 'בערך כל כמה זמן מקיפה תחנת החלל את כדור הארץ?',
    answers: ['כל 10 דקות', 'כל שעה וחצי', 'פעם ביום', 'פעם בשבוע'],
    correctIndex: 1
  },
  {
    id: 'iss-q2',
    text: 'מה הגודל המשוער של תחנת החלל הבינלאומית?',
    answers: ['כמו מכונית משפחתית', 'כמו חדר שינה', 'בערך כמו מגרש כדורגל', 'כמו עיר קטנה'],
    correctIndex: 2
  },
  {
    id: 'iss-q3',
    text: 'למה אסטרונאוטים מרחפים בתחנת החלל?',
    answers: ['כי אין בכלל כוח כבידה', 'כי התחנה נמצאת בנפילה חופשית סביב כדור הארץ', 'כי יש מגנטים ברצפה', 'כי האוויר דוחף אותם למעלה'],
    correctIndex: 1
  },
  {
    id: 'iss-q4',
    text: 'כמה זריחות ושקיעות בערך רואים בתחנת החלל ביממה?',
    answers: ['1', '2', '8', '16'],
    correctIndex: 3
  }
]
```

---

## 11.5 חללית דרגון

Type: ar-confirmation.
Base score: 50.

This station sends the visitor to the external Rakia app.

Do not build internal AR unless it is trivial. Default is external AR handoff.

UI text:

```text
חללית דרגון
פתחו את אפליקציית רקיע ובצעו את משימת ה־AR של חללית דרגון.
לאחר שסיימתם, חזרו לכאן ולחצו סיימתי.
```

Button:

```text
סיימתי
```

Optional source video reference for developer: “יום בחיי אסטרונאוט - סיור בחללית הדרגון”.

---

## 11.6 AR תחנת החלל

Type: ar-confirmation.
Base score: 50.

UI text:

```text
תחנת החלל ב־AR
פתחו את אפליקציית רקיע וצפו בתחנת החלל הבינלאומית ב־AR.
לאחר שסיימתם, חזרו לכאן ולחצו סיימתי.
```

Button:

```text
סיימתי
```

---

## 11.7 משיגור ועד נחיתה

Type: sort-game.
Base score: 150.

Important correction: the first step title is **ממריאים**, not “מסוראים”.

Wall content summary:

The wall describes the mission stages:

1. ממריאים — חברי הצוות עולים אל כן השיגור A39 שבנמל החלל קייפ קנוורל בפלורידה. איתן סטיבה נמנה עם האסטרונאוטים.
2. השיגור — המנועים ניצתים, וטיל Falcon 9 של SpaceX נושא את חללית Dragon.
3. מתנתקים — השלב הראשון של הטיל מתנתק וחוזר לנחיתה בכדור הארץ.
4. מתנתקים שוב — השלב השני מאיץ את החללית לכ־28,000 קמ״ש ומתנתק.
5. עוגנים בתחנת החלל הבינלאומית — החללית עוגנת בתחנה והאסטרונאוטים נכנסים אליה.
6. נוחתים על כדור הארץ — Dragon חוזרת לכדור הארץ ונוחתת באוקיינוס בעזרת ארבעה מצנחי ענק.

Game:

- Show shuffled cards with the six steps.
- User drags them into correct order.
- Provide feedback after submit.
- Allow retry.
- Award speed bonus after game starts.

Sort items:

```ts
[
  { id: 'launch-1', label: 'ממריאים', correctOrder: 1 },
  { id: 'launch-2', label: 'השיגור', correctOrder: 2 },
  { id: 'launch-3', label: 'מתנתקים', correctOrder: 3 },
  { id: 'launch-4', label: 'מתנתקים שוב', correctOrder: 4 },
  { id: 'launch-5', label: 'עוגנים בתחנת החלל הבינלאומית', correctOrder: 5 },
  { id: 'launch-6', label: 'נוחתים על כדור הארץ', correctOrder: 6 }
]
```

---

## 11.8 כושר בחלל

Type: video-quiz.
Base score: 120.

Wall content summary:

- בתנאי מיקרו־כבידה הלב ושאר השרירים בגוף עובדים פחות מאשר בכדור הארץ.
- כדי שהשרירים לא יתנוונו, אסטרונאוטים צריכים לבצע לפחות שעתיים פעילות גופנית ביום.

Video:

- Firebase Storage: `mission-videos/fitness-space.mp4`
- Source reference title: “A day in the life of an astronaut - Workout in Space” or “יום בחיי אסטרונאוט - אימונים בחלל”.
- Do not embed YouTube directly.

Questions:

```ts
[
  {
    id: 'fitness-q1',
    text: 'למה אסטרונאוטים צריכים להתאמן בחלל?',
    answers: [
      'כי בתחנת החלל חם מאוד',
      'כי במיקרו־כבידה השרירים והלב עובדים פחות ועלולים להיחלש',
      'כי אין מספיק חמצן בתחנה',
      'כי האימונים מפעילים את מנועי התחנה'
    ],
    correctIndex: 1
  },
  {
    id: 'fitness-q2',
    text: 'כמה זמן בערך אסטרונאוטים צריכים לבצע פעילות גופנית ביום?',
    answers: ['10 דקות', 'חצי שעה', 'שעתיים לפחות', 'אין צורך להתאמן'],
    correctIndex: 2
  }
]
```

---

## 11.9 ספירה לאחור AR

Type: ar-confirmation + mini interaction.
Base score: 70.

UI:

- Ask visitor to open Rakia app for countdown AR.
- Also include a polished in-app mini countdown interaction.

Interaction:

- Show numbers 10 to 1.
- User taps each number or holds a launch button.
- At 0 show “שיגור!”.
- Then allow “סיימתי”.

Do not build full internal AR unless easy. Main AR remains external Rakia app.

---

## 11.10 היגיינה בחלל

Type: quiz or sequence.
Base score: 120.

Important: This station comes before microgravity.

Wall content summary:

Two main topics:

1. איך מצחצחים שיניים בלי מים?
   - בתחנת החלל גם המים מרחפים.
   - כדי לצחצח שיניים האסטרונאוטים לוגמים שלוק מים.
   - לאחר הצחצוח הם בולעים את המשחה.

2. איך מתקלחים בחלל?
   - בתנאי מיקרו־כבידה המים לא זורמים כלפי מטה.
   - קשה להתקלח כמו בכדור הארץ.
   - משתמשים בסבון מיוחד, שקית מים ומגבת.

Physical station detail:

- The exhibit may distribute wipes.
- The point is saving water and adapting hygiene to microgravity.

Questions:

```ts
[
  {
    id: 'hygiene-q1',
    text: 'למה אי אפשר פשוט לפתוח ברז ולצחצח שיניים כמו בכדור הארץ?',
    answers: [
      'כי בתחנת החלל אין מברשות שיניים',
      'כי המים מרחפים ולא זורמים לכיור כמו בכדור הארץ',
      'כי אסור להשתמש במשחת שיניים',
      'כי אין אור בתחנה'
    ],
    correctIndex: 1
  },
  {
    id: 'hygiene-q2',
    text: 'מה עושים אסטרונאוטים בסיום צחצוח השיניים לפי הקיר?',
    answers: ['זורקים את המים מהחלון', 'בולעים את המשחה', 'שוטפים בכיור רגיל', 'מחכים שהמשחה תתאדה'],
    correctIndex: 1
  },
  {
    id: 'hygiene-q3',
    text: 'במה משתמשים כדי לשמור על היגיינה כשאין מקלחת רגילה?',
    answers: ['סבון מיוחד, שקית מים ומגבת', 'חול יבש', 'גז הליום', 'רק אוויר חם'],
    correctIndex: 0
  }
]
```

Optional sequence game:

- לגימה קטנה של מים
- צחצוח
- בליעת המשחה
- ניקוי/איסוף פסולת

---

## 11.11 מיקרו־כבידה

Type: three-game.
Base score: 180.

Wall content summary:

- בתנאי מיקרו־כבידה אפשר להזיז משקל של מאות קילוגרמים אפילו באצבע אחת.
- פעולות פשוטות כמו להניח חפץ על שולחן הופכות מורכבות כי חפצים מרחפים.
- הסקוץ׳ / ולקרו הוא מצרך חשוב במיוחד בתחנת החלל, כי הוא עוזר להצמיד חפצים שלא יעופו.

Game concept:

Three.js scene: inside a stylized space station cabin. Objects float slowly. User must drag/click/tap objects and stick them to Velcro zones.

Objects:

- שקית אוכל
- כפית
- מברשת שיניים
- מגבון
- אריזת קורנפלקס
- כלי קטן

Scoring:

- points for each object secured
- speed bonus
- mistakes only reduce bonus, not block completion

Questions after game:

```ts
[
  {
    id: 'microgravity-q1',
    text: 'למה סקוץ׳ חשוב בתחנת החלל?',
    answers: [
      'כדי לקשט את הקירות',
      'כדי להצמיד חפצים שלא ירחפו ויאבדו',
      'כדי לייצר חמצן',
      'כדי לחמם אוכל'
    ],
    correctIndex: 1
  },
  {
    id: 'microgravity-q2',
    text: 'מה קורה לחפצים בתנאי מיקרו־כבידה?',
    answers: ['הם תמיד נופלים מהר יותר', 'הם יכולים לרחף אם לא מקבעים אותם', 'הם נעלמים', 'הם נדבקים אוטומטית לרצפה'],
    correctIndex: 1
  }
]
```

---

## 11.12 עיצוב פאץ׳ חלל

Type: patch-designer.
Base score: 200.

No wall text required. This is a creative app station.

Requirements:

- Must look good enough for an exhibition.
- Not childish.
- Not a full Photoshop clone.

Design tool features:

- Select patch shape: circle, shield, mission badge, hexagon.
- Select background color/pattern.
- Add icons: rocket, ISS, Earth, star, astronaut helmet, orbit line.
- Add user name.
- Add mission text.
- Drag/resize icons and text.
- Optional simple free drawing layer.
- Export patch as PNG.
- Save to Firebase Storage.
- Show in final passport/PDF.

Completion condition:

- User must create and save a patch.

---

## 11.13 תכשיטי חלל

Type: jewelry-designer.
Base score: 200.

Important: This is a scientific/visual experiment, not just a decorative jewelry game.

Wall content summary:

- משימת רקיע כללה לא רק מדע וטכנולוגיה, אלא גם אמנות, מחקר תרבותי ותכנים חינוכיים.
- בתחנת “תכשיט על חלל” מוצג תכשיט של ד״ר שחר פרדי כסלו.
- מדובר בטבעת זהב עם כדוריות/חלקים שנועדו לפעול בתנאי מיקרו־כבידה.
- The concept: jewelry can behave visually and physically differently in microgravity.

Requirements:

- Create a polished 3D/canvas jewelry designer.
- User can choose:
  - ring / pendant / chain
  - material: gold, silver, titanium, glass/transparent
  - moving element: bead, spinner, small chain, orbiting element
  - color accent
- Show two modes:
  - כדור הארץ
  - מיקרו־כבידה
- In Earth mode, parts hang/fall subtly.
- In microgravity mode, elements float/orbit/spin slowly.
- The purpose is to demonstrate material/shape/movement behavior in space.
- Save a final rendered image to Firebase Storage.
- Show final jewelry image in PDF.

Completion condition:

- User designs one piece and presses “שמור תכשיט”.

---

## 11.14 תא שינה

Type: video-quiz.
Base score: 100.

No need for wall text. There is a physical sleep cell but no useful text to capture.

Content:

- In microgravity, astronauts do not need to lie down like on Earth.
- They sleep in a sleeping bag attached to a wall or fixed place.
- The body can float, so securing the sleeping area is important.

Video:

- Firebase Storage: `mission-videos/sleep-space.mp4`
- Source reference title: “יום בחיי אסטרונאוט - שינה בתחנת החלל”.

Questions:

```ts
[
  {
    id: 'sleep-q1',
    text: 'למה אסטרונאוטים לא חייבים לשכב כדי לישון בתחנת החלל?',
    answers: [
      'כי הגוף מרחף בתנאי מיקרו־כבידה',
      'כי אין לילה בתחנה',
      'כי אסור לעצום עיניים',
      'כי התחנה תמיד רועשת מדי'
    ],
    correctIndex: 0
  },
  {
    id: 'sleep-q2',
    text: 'למה מקבעים את שק השינה או אזור השינה?',
    answers: ['כדי שהאסטרונאוט לא ירחף ויתנגש בחפצים', 'כדי לחמם את התחנה', 'כדי לייצר מים', 'כדי להפעיל את התאורה'],
    correctIndex: 0
  }
]
```

---

## 11.15 תהיו הכוכב של החלומות שלכם

Type: dream-input.
Base score: 80.

User writes a dream.

UI:

```text
תהיו הכוכב של החלומות שלכם
כתבו חלום קצר שתרצו להגשים.
```

Fields:

- dream textarea, max 120 chars or configurable.

On submit:

- Run automatic profanity filter.
- Save to `dreams` with approved true/false.
- If approved, show on TV route.
- If rejected, tell the user to rewrite politely.

TV display uses:

- photo
- name
- dream
- score

---

## 11.16 ארוחה חללית

Type: video-quiz.
Base score: 100.

Video:

- Firebase Storage: `mission-videos/space-food.mp4`
- Source reference title: “יום בחיי אסטרונאוט - כיצד אוכלים ושותים בתחנת החלל”.

Content:

- Food and drinks in space must be adapted to microgravity.
- Open liquids and crumbs can be problematic.

Questions:

```ts
[
  {
    id: 'space-food-q1',
    text: 'למה אוכל בתחנת החלל צריך להיות מותאם במיוחד?',
    answers: [
      'כי במיקרו־כבידה פירורים ונוזלים יכולים לרחף ולגרום בעיות',
      'כי אסור לאכול יותר מפעם ביום',
      'כי אין חמצן ליד האוכל',
      'כי המזון חייב להיות קפוא תמיד'
    ],
    correctIndex: 0
  }
]
```

---

## 11.17 ארוחת בוקר שאפשר לעוף עליה

Type: classification-game.
Base score: 150.

Wall content summary:

- מזון אסטרונאוטים צריך להיות עמיד לאורך זמן.
- מזון לא צריך להתפורר, כי פירורים עלולים לגרום נזק למכשירים או להפריע בתחנה.
- בחלל לא שותים מכוסות רגילות או בקבוקים פתוחים.
- שותים משקיות מיוחדות עם קשית כדי שהנוזלים לא יתפזרו.
- בתמונות מופיעים פריטי מזון ארוזים: קופסאות, שקיות, תה עם סוכר, M&M’s, בר/אוכל ארוז ועוד.

Game:

User sorts breakfast items into:

- מתאים לחלל
- בעייתי בחלל

Classification items:

```ts
[
  { id: 'tortilla', label: 'טורטייה', category: 'space-ok' },
  { id: 'drink-pouch', label: 'שקית שתייה עם קשית', category: 'space-ok' },
  { id: 'sealed-snack', label: 'חטיף ארוז שלא מתפורר', category: 'space-ok' },
  { id: 'open-cereal', label: 'קערת קורנפלקס פתוחה', category: 'problematic' },
  { id: 'open-water-cup', label: 'כוס מים פתוחה', category: 'problematic' },
  { id: 'crumbly-bread', label: 'לחם מתפורר', category: 'problematic' },
  { id: 'sunny-egg', label: 'ביצת עין פתוחה', category: 'problematic' }
]
```

Question:

```ts
{
  id: 'breakfast-q1',
  text: 'מה הבעיה העיקרית בפירורים בתחנת החלל?',
  answers: ['הם עלולים לרחף ולהיכנס למכשירים או לעיניים', 'הם כבדים מדי', 'הם קופאים מיד', 'הם הופכים למים'],
  correctIndex: 0
}
```

---

## 11.18 חלון כדור הארץ

Type: three-info-quiz / live tracker.
Base score: 160.

Wall content summary:

- מחלון הקופולה האסטרונאוטים יכולים להביט אל כדור הארץ.
- אפשר לראות את האטמוספרה הדקיקה.
- אפשר לראות אזורים שונים בכדור הארץ, כולל ישראל כאשר התחנה חולפת מעל האזור.
- יש פעילות פיזית: “נסו להניח את האצבע: איפה אנחנו נמצאים עכשיו?”

Implementation:

- Render Earth in Three.js.
- Show ISS position in real time if API is available.
- If API fails, use fallback simulated orbit.
- Show:
  - location over Earth
  - approximate speed
  - approximate orbit time
  - over land/ocean if possible

Use lightweight approach. Do not make app dependent on one unreliable API.

Questions:

```ts
[
  {
    id: 'earth-window-q1',
    text: 'מה אפשר לראות מחלון הקופולה בתחנת החלל?',
    answers: ['את כדור הארץ והאטמוספרה שלו', 'את פנים הירח בלבד', 'את כל הכוכבים מקרוב', 'את מרכז כדור הארץ'],
    correctIndex: 0
  },
  {
    id: 'earth-window-q2',
    text: 'בערך כמה זמן לוקח לתחנת החלל להקיף את כדור הארץ?',
    answers: ['שעה וחצי', 'יום שלם', 'חודש', 'שנה'],
    correctIndex: 0
  }
]
```

---

## 11.19 ייצור אופטיקה בחלל באמצעות נוזלים

Type: three/liquid-demo + quiz.
Base score: 160.

Wall content summary:

- ניסוי של איתן סטיבה בתחנת החלל ניצל את מתח הפנים של נוזלים בתנאי מיקרו־כבידה.
- המטרה הייתה ליצור עדשה עשויה מים/נוזל.
- הטכנולוגיה פותחה במעבדה של פרופ׳ מורן ברקוביץ׳ בטכניון בשיתוף נאס״א.
- הרעיון: להתגבר על מגבלות גודל ומשקל של מכשירים קיימים ולאפשר בעתיד טלסקופי חלל גדולים במיוחד המבוססים על נוזלים.

Demo:

- Show a floating droplet.
- User adjusts liquid amount / surface tension slider.
- Droplet forms a smooth lens shape.
- Show light rays passing through the lens in a simple visual way.

Video optional:

- Firebase Storage: `mission-videos/liquid-optics.mp4`
- Source title: “ככה מייצרים עדשות בחלל”.

Questions:

```ts
[
  {
    id: 'optics-q1',
    text: 'איזה כוח/תופעה עוזרים לנוזל לקבל צורה מתאימה לעדשה בחלל?',
    answers: ['מתח פנים', 'רעש מנועים', 'חשמל סטטי בלבד', 'חיכוך עם הרצפה'],
    correctIndex: 0
  },
  {
    id: 'optics-q2',
    text: 'מה היתרון האפשרי של עדשות מנוזלים בחלל?',
    answers: [
      'אפשרות ליצור בעתיד אופטיקה גדולה מאוד בלי מגבלות ייצור רגילות',
      'הן תמיד צבעוניות יותר',
      'הן לא צריכות אור',
      'הן הופכות את התחנה למהירה יותר'
    ],
    correctIndex: 0
  },
  {
    id: 'optics-q3',
    text: 'באיזו מסגרת בוצע הניסוי שמוצג בתחנה?',
    answers: ['משימת רקיע', 'משחק מחשב', 'תחרות בישול', 'מסע ימי'],
    correctIndex: 0
  }
]
```

---

## 11.20 חדר בקרה

Type: confirmation-quiz.
Base score: 80.

No need for exact wall text. Use general mission-control content.

UI:

```text
חדר בקרה
התנסו בעמדת הבקרה ובדקו שלושה נתונים: תקשורת, מיקום משימה ומצב צוות.
```

Task:

- User checks three toggles:
  - תקשורת תקינה
  - מיקום ידוע
  - צוות כשיר למשימה

Question:

```ts
{
  id: 'control-q1',
  text: 'מה תפקידו המרכזי של חדר בקרה במשימת חלל?',
  answers: ['לעקוב אחרי מצב המשימה ולסייע בקבלת החלטות', 'לבשל אוכל לאסטרונאוטים', 'לצבוע את החללית', 'להחליף את כוח הכבידה'],
  correctIndex: 0
}
```

---

## 11.21 משימת רקיע במספרים

Type: quiz/matching.
Base score: 150.

Important correction: it is **380 ארגונים**, not “380 אירועים”.

Wall content numbers:

- 17 ימים בתחנת החלל הבינלאומית.
- מעל 100 הופעות בגלריות, פרסומים וכנסים.
- כ־50,000 מבקרים בארבע תערוכות המציגות את משימת רקיע.
- מעל 1,000,000 צפיות בתכני משימת רקיע ברשתות החברתיות ובאתר.
- 80 אמנים שתחנת החלל הייתה להם השראה ליצירה.
- 322 מדענים שלקחו חלק במשימה.
- 380 ארגונים שהשתתפו במשימה.
- מעל 15,000 תלמידים שהשתתפו בהרצאות של איתן סטיבה אחרי שחזר מהחלל.
- 95 תרומות ליעדי האו״ם לפיתוח בר־קיימא.

Game option:

Match number to meaning.

Questions:

```ts
[
  {
    id: 'numbers-q1',
    text: 'כמה ימים שהה איתן סטיבה בתחנת החלל במסגרת משימת רקיע?',
    answers: ['7', '10', '17', '30'],
    correctIndex: 2
  },
  {
    id: 'numbers-q2',
    text: 'כמה מדענים לקחו חלק במשימת רקיע לפי קיר המספרים?',
    answers: ['80', '95', '322', '15,000'],
    correctIndex: 2
  },
  {
    id: 'numbers-q3',
    text: 'מה מייצג המספר 80 בקיר המספרים?',
    answers: ['אמנים שקיבלו השראה מתחנת החלל', 'ימי משימה', 'מצנחים', 'תחנות חלל'],
    correctIndex: 0
  },
  {
    id: 'numbers-q4',
    text: 'כמה ארגונים השתתפו במשימה לפי הקיר?',
    answers: ['95', '100', '322', '380'],
    correctIndex: 3
  },
  {
    id: 'numbers-q5',
    text: 'כמה תלמידים השתתפו בהרצאות של איתן סטיבה אחרי שחזר מהחלל?',
    answers: ['מעל 1,000', 'מעל 15,000', '50,000', '100'],
    correctIndex: 1
  }
]
```

---

## 11.22 שירותים בחלל

Type: video-quiz.
Base score: 100.

No exact wall text needed. Use Rakia video and general ISS toilet explanation.

Video:

- Firebase Storage: `mission-videos/space-toilet.mp4`
- Source reference title: “יום בחיי אסטרונאוט - צחצוח שיניים, מקלחת ושימוש בשירותים”.

Content:

- In microgravity, waste does not fall down by gravity.
- Space toilets use airflow/suction to guide waste.
- Water is a precious resource and is recycled where possible.

Questions:

```ts
[
  {
    id: 'toilet-q1',
    text: 'למה שירותים בתחנת החלל לא עובדים כמו שירותים רגילים בכדור הארץ?',
    answers: ['כי אין נפילה רגילה של פסולת כלפי מטה במיקרו־כבידה', 'כי אין אסטרונאוטים בתחנה', 'כי המים רותחים מיד', 'כי השירותים נמצאים מחוץ לחללית'],
    correctIndex: 0
  },
  {
    id: 'toilet-q2',
    text: 'מה עוזר לכוון פסולת בשירותים בחלל?',
    answers: ['זרימת אוויר/שאיבה', 'מגנט ענק', 'אור שמש', 'פאנל סולארי'],
    correctIndex: 0
  }
]
```

---

## 11.23 מציאת אסטרואידים בגרובטק

Type: asteroid blinking game.
Base score: 180.

Wall content summary:

- גרובטק משתתפת במיזם IASC הבינלאומי לחיפוש אסטרואידים.
- משתמשים ברצף תמונות של קטע שמיים מטלסקופ.
- השיטה המרכזית נקראת Blinking: משווים כמה תמונות ברצף כדי לזהות נקודה שזזה ביחס לכוכבי שבת שנשארים במקום.
- המבקר צריך למצוא את גרם השמיים הזז.

Game:

- Show 3–4 frames of a star field.
- Most stars remain fixed.
- One dot moves slightly between frames.
- Animate blinking between frames.
- User taps the moving object.
- Provide retry.
- Give score based on correct click and speed.

If no real image assets exist, generate a procedural star field with one moving dot.

Questions:

```ts
[
  {
    id: 'asteroid-q1',
    text: 'מה מחפשים בשיטת Blinking?',
    answers: ['נקודה שזזה בין תמונות רצופות', 'כוכב שנשאר תמיד באותו מקום', 'ענן בצורת חללית', 'צבע הרקע של השמיים'],
    correctIndex: 0
  },
  {
    id: 'asteroid-q2',
    text: 'למה משווים כמה תמונות של אותו אזור שמיים?',
    answers: ['כדי לזהות עצם קטן שנע ביחס לכוכבים קבועים', 'כדי למדוד את גובה המבקר', 'כדי לבחור צבע לרקע', 'כדי להפעיל את תחנת החלל'],
    correctIndex: 0
  }
]
```

---

## 11.24 חזרה הביתה

Type: video-confirmation.
Base score: 60.

No wall text needed.

Content:

- The Dragon capsule returns to Earth.
- It re-enters, deploys parachutes and splashes down in the ocean.

Video:

- Firebase Storage: `mission-videos/return-home.mp4`
- Source can be a cut clip chosen by the user.

Button:

```text
צפיתי בחזרה הביתה
```

Question optional:

```ts
{
  id: 'return-q1',
  text: 'איך הקפסולה מאיטה לקראת הנחיתה הסופית?',
  answers: ['בעזרת מצנחים', 'בעזרת גלגלים כמו מטוס', 'בעזרת עוגן באדמה', 'היא לא מאטה'],
  correctIndex: 0
}
```

---

## 11.25 סיום והורדת PDF

Type: summary.
Base score: 0.

Show:

- user photo
- name
- score
- rank
- completed count
- skipped count
- stamp grid
- patch image
- jewelry image
- dream
- download PDF button

No score, no stamp.

---

# 12. Video Source Mapping

These are source references only. The app must not depend on YouTube playback. The actual videos will be cut by the project owner and uploaded to Firebase Storage.

Use config fields like `video.storagePath`, `video.sourceTitle`, `video.sourceReferenceUrl`.

```ts
export const videoSources = {
  introMission: {
    storagePath: 'mission-videos/intro-mission.mp4',
    sourceTitle: 'סרטון פתיחת משימת רקיע',
    sourceReferenceUrl: ''
  },
  dragonTour: {
    storagePath: 'mission-videos/dragon-tour.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - סיור בחללית הדרגון',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=5cxox29uzCw'
  },
  issTour: {
    storagePath: 'mission-videos/iss-tour.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - סיור בתחנת החלל הבינלאומית',
    sourceReferenceUrl: 'https://www.rakiamission.com/rakia-vod/day-in-the-life-tour-iss'
  },
  fitness: {
    storagePath: 'mission-videos/fitness-space.mp4',
    sourceTitle: 'A day in the life of an astronaut - Workout in Space',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=Uc5H8Pw2Dvo'
  },
  hygieneToilet: {
    storagePath: 'mission-videos/hygiene-toilet.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - צחצוח שיניים, מקלחת ושימוש בשירותים',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=pc_TaEVGl4o'
  },
  microgravity: {
    storagePath: 'mission-videos/microgravity.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - חוויית המיקרו־כבידה',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=ylXW_sYyvuc'
  },
  sleep: {
    storagePath: 'mission-videos/sleep-space.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - שינה בתחנת החלל',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=Ptadd44Nyeo'
  },
  food: {
    storagePath: 'mission-videos/space-food.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - כיצד אוכלים ושותים בתחנת החלל',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=DZy1L2rveLM'
  },
  earthWindow: {
    storagePath: 'mission-videos/earth-window.mp4',
    sourceTitle: 'מה רואים מתחנת החלל הבינלאומית?',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=F3FiYUtXopo'
  },
  liquidOptics: {
    storagePath: 'mission-videos/liquid-optics.mp4',
    sourceTitle: 'ככה מייצרים עדשות בחלל',
    sourceReferenceUrl: 'https://www.rakiamission.com/rakia-vod-he'
  },
  returnHome: {
    storagePath: 'mission-videos/return-home.mp4',
    sourceTitle: 'חזרה הביתה / נחיתת החללית',
    sourceReferenceUrl: ''
  }
}
```

---

# 13. TV Dream Wall

Route: `/tv/dreams`

Requirements:

- Connected to Firestore in real time.
- Shows only approved dreams.
- Each card shows:
  - photo
  - name
  - dream text
  - current score
- If many entries exist, scroll back and forth at medium pace.
- Should look like an elegant space wall, not a basic table.
- Must update live when new dreams are submitted.
- Should be readable from a TV.
- Landscape layout.

Automatic filtering:

- Use `data/forbiddenWords.ts`.
- Check Hebrew, English and basic Arabic profanity if possible.
- If rejected, do not show on TV.
- No admin approval UI.

---

# 14. PDF Export

Final PDF must be multi-page.

Do not generate a single one-page summary only.

Suggested PDF structure:

1. Cover page — “דרכון משימת רקיע”, name, photo, date.
2. Mission summary — score, rank, completed/skipped.
3. Stamp pages — grid of completed mission stamps, with empty/no stamp for skipped missions.
4. Creative page — patch design.
5. Scientific jewelry page — jewelry result image and short explanation.
6. Dream page — user dream.
7. Final page — “אין חלום רחוק מדי”.

Requirements:

- RTL text.
- Looks like a real passport document.
- Download button.
- Filename: `rakia-passport-<name-or-session>.pdf`.
- If generated image capture is used, ensure Hebrew renders correctly.
- PDF should include only stamps for completed missions; skipped missions should have no stamp.

---

# 15. PWA Requirements

- Installable PWA.
- App shell cached.
- No video precaching.
- Fast initial load.
- Manifest with Hebrew name.
- Icons.
- Works on iPhone/Android browsers.
- Touch-first UX.
- Use safe area insets.
- Handle refresh/reload by restoring session.

---

# 16. Error Handling

Handle:

- Firebase unavailable: show friendly retry.
- Camera permission denied: retry/upload/continue without photo.
- Video fails to load: show retry and continue option only if needed.
- Storage upload fails: retry.
- PDF generation fails: retry.
- Lost session: ask user to restart or recover if local session exists.

Do not crash to blank page.

---

# 17. Quality Bar

The app must feel exhibition-ready.

Minimum quality expectations:

- no default browser-looking UI
- no childish colors for adult audience
- consistent spacing
- clear Hebrew typography
- all text RTL
- page flip smooth
- stamp polished
- mobile gestures responsive
- TV wall readable
- PDF visually coherent
- all missions present
- all core data saved

---

# 18. Implementation Steps for Codex

Follow this order, but keep pursue-goal mode until complete:

1. Inspect repo.
2. If no app exists, create Nuxt 3 + TypeScript + PWA setup.
3. Add Firebase config integration using env variables.
4. Create mission config with every station above.
5. Build onboarding with camera/photo upload.
6. Build passport engine and page flip.
7. Build mission renderer and all mission component types.
8. Add scoring, skip, retry, stamps.
9. Add Firebase persistence for sessions/progress/dreams/creations.
10. Implement all station content and questions.
11. Implement Three.js scenes at functional polished level.
12. Implement patch designer.
13. Implement jewelry scientific designer.
14. Implement TV dreams route.
15. Implement PDF export.
16. Add PWA caching rules with no video precache.
17. Polish UI and RTL.
18. Test full path from onboarding to PDF.

---

# 19. Definition of Done

The task is complete only when:

- User can open app.
- User can enter name.
- User can take/upload photo.
- Session is saved.
- Passport opens.
- Page flip works forward and backward with edge dragging.
- Every station from the final order exists.
- Every station can be completed.
- Every station can be skipped.
- Skipped stations give 0 points and no stamp.
- User can return backward and complete skipped stations.
- Completed stations show green center stamp.
- Score updates.
- Rank updates.
- Videos load only from Firebase Storage config paths.
- No `public/videos` exists or is used.
- Dream submission works.
- Dream TV route updates live with photo, name, dream and score.
- Automatic forbidden word filtering exists.
- Patch designer saves image.
- Jewelry designer saves image.
- Final PDF downloads and includes multiple pages.
- PWA installs and app shell is lightweight.
- No core TODO placeholders remain.

---

# 20. Important Hebrew UI Strings

Use these exact strings where relevant:

```text
מוכן למשימה
התחל שאלון
סיימתי
דלג
חזור
המשך
ראיתי
צפיתי בחזרה הביתה
שמור פאץ׳
שמור תכשיט
הורדת פספורט
המשימה הושלמה
אין חותמת לתחנה שדולגה
```

Do not use the phrase “קראתי את הקיר — התחל שאלון”. Use only “התחל שאלון”.

---

# 21. Final Instruction

Build the full product. Do not reduce the scope to a demo. Do not remove stations. Do not replace complex stations with blank placeholders. Use simple but polished functional versions where needed, and keep all data/config extensible.

The goal is a real exhibition PWA passport for Rakia.
