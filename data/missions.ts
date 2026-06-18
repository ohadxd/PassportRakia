import type { MissionConfig } from '~/types/mission'
import { videoSources } from './videoSources'

const v = (source: (typeof videoSources)[keyof typeof videoSources]) => ({
  ...source,
  loadMode: 'on-demand' as const
})

export const missions: MissionConfig[] = [
  {
    id: 'ready',
    order: 1,
    title: 'מוכן למשימה',
    type: 'transition',
    baseScore: 0,
    allowSkip: false,
    wallContentSummary: ['דרכון רקיע שלך נפתח. בכל תחנה תוכל להשלים משימה, לצבור ניקוד ולקבל חותמת.']
  },
  {
    id: 'intro-mission-video',
    order: 2,
    title: 'סרטון משימה',
    type: 'intro-video',
    baseScore: 40,
    allowSkip: true,
    actionText: 'ראיתי',
    video: v(videoSources.introMission),
    wallContentSummary: ['צפו בסרטון הפתיחה של משימת רקיע והמשיכו לתחנה הראשונה.']
  },
  {
    id: 'rakia-mission',
    order: 3,
    title: 'משימת רקיע',
    type: 'quiz',
    baseScore: 120,
    allowSkip: true,
    estimatedSeconds: 90,
    wallContentSummary: [
      'משימת רקיע שוגרה לחלל ב-8 באפריל 2022 כחלק ממשימת AX-1.',
      'זו הייתה טיסת החלל הפרטית הראשונה אל תחנת החלל הבינלאומית ובה השתתף איתן סטיבה.',
      'המשימה נמשכה 17 ימים וכללה ניסויים מדעיים, אמנות ופעילות חינוכית בעברית מהחלל.'
    ],
    questions: [
      { id: 'rakia-q1', text: 'באיזה תאריך שוגרה משימת רקיע לחלל?', answers: ['1 באפריל 2022', '8 באפריל 2022', '17 באפריל 2022', '8 באפריל 2023'], correctIndex: 1 },
      { id: 'rakia-q2', text: 'משימת רקיע הייתה חלק מאיזו משימה?', answers: ['Apollo 11', 'AX-1', 'Artemis I', 'Crew-1'], correctIndex: 1 },
      { id: 'rakia-q3', text: 'מי היה האסטרונאוט הישראלי שהשתתף במשימת רקיע?', answers: ['אילן רמון', 'איתן סטיבה', 'יורי גגארין', 'סקוט קלי'], correctIndex: 1 },
      { id: 'rakia-q4', text: 'כמה ימים נמשכה משימת רקיע?', answers: ['7 ימים', '10 ימים', '17 ימים', '30 ימים'], correctIndex: 2 }
    ]
  },
  {
    id: 'iss-station',
    order: 4,
    title: 'תחנת החלל הבינלאומית',
    type: 'three-info-quiz',
    baseScore: 160,
    allowSkip: true,
    estimatedSeconds: 120,
    wallContentSummary: [
      'תחנת החלל הבינלאומית היא מעבדה מרחפת גדולה המקיפה את כדור הארץ בערך כל שעה וחצי.',
      'אסטרונאוטים רואים כ-16 זריחות ושקיעות ביממה, והיא בערך בגודל של מגרש כדורגל.',
      'התחנה כוללת מעבדות, אזורי מחיה, קופולה, פאנלים סולאריים וחלליות עוגנות.'
    ],
    questions: [
      { id: 'iss-q1', text: 'בערך כל כמה זמן מקיפה תחנת החלל את כדור הארץ?', answers: ['כל 10 דקות', 'כל שעה וחצי', 'פעם ביום', 'פעם בשבוע'], correctIndex: 1 },
      { id: 'iss-q2', text: 'מה הגודל המשוער של תחנת החלל הבינלאומית?', answers: ['כמו מכונית משפחתית', 'כמו חדר שינה', 'בערך כמו מגרש כדורגל', 'כמו עיר קטנה'], correctIndex: 2 },
      { id: 'iss-q3', text: 'למה אסטרונאוטים מרחפים בתחנת החלל?', answers: ['כי אין בכלל כוח כבידה', 'כי התחנה נמצאת בנפילה חופשית סביב כדור הארץ', 'כי יש מגנטים ברצפה', 'כי האוויר דוחף אותם למעלה'], correctIndex: 1 },
      { id: 'iss-q4', text: 'כמה זריחות ושקיעות בערך רואים בתחנת החלל ביממה?', answers: ['1', '2', '8', '16'], correctIndex: 3 }
    ]
  },
  {
    id: 'dragon-ar',
    order: 5,
    title: 'חללית דרגון',
    type: 'ar-confirmation',
    baseScore: 50,
    allowSkip: true,
    actionText: 'סיימתי',
    arSlug: 'dragon',
    video: v(videoSources.dragonTour),
    wallContentSummary: ['פתחו את אפליקציית רקיע ובצעו את משימת ה-AR של חללית דרגון.', 'לאחר שסיימתם, חזרו לכאן ולחצו סיימתי.']
  },
  {
    id: 'iss-ar',
    order: 6,
    title: 'AR תחנת החלל',
    type: 'ar-confirmation',
    baseScore: 50,
    allowSkip: true,
    actionText: 'סיימתי',
    arSlug: 'iss',
    wallContentSummary: ['פתחו את אפליקציית רקיע וצפו בתחנת החלל הבינלאומית ב-AR.', 'לאחר שסיימתם, חזרו לכאן ולחצו סיימתי.']
  },
  {
    id: 'launch-to-landing',
    order: 7,
    title: 'משיגור ועד נחיתה',
    type: 'sort-game',
    baseScore: 150,
    allowSkip: true,
    estimatedSeconds: 110,
    wallContentSummary: ['סדרו את שלבי המשימה מהעלייה לכן השיגור ועד נחיתת Dragon באוקיינוס.'],
    sortItems: [
      { id: 'launch-1', label: 'ממריאים', correctOrder: 1 },
      { id: 'launch-2', label: 'השיגור', correctOrder: 2 },
      { id: 'launch-3', label: 'מתנתקים', correctOrder: 3 },
      { id: 'launch-4', label: 'מתנתקים שוב', correctOrder: 4 },
      { id: 'launch-5', label: 'עוגנים בתחנת החלל הבינלאומית', correctOrder: 5 },
      { id: 'launch-6', label: 'נוחתים על כדור הארץ', correctOrder: 6 }
    ]
  },
  {
    id: 'fitness-space',
    order: 8,
    title: 'כושר בחלל',
    type: 'video-quiz',
    baseScore: 120,
    allowSkip: true,
    estimatedSeconds: 90,
    video: v(videoSources.fitness),
    wallContentSummary: ['במיקרו-כבידה הלב והשרירים עובדים פחות, ולכן אסטרונאוטים מתאמנים לפחות שעתיים ביום.'],
    questions: [
      { id: 'fitness-q1', text: 'למה אסטרונאוטים צריכים להתאמן בחלל?', answers: ['כי בתחנת החלל חם מאוד', 'כי במיקרו-כבידה השרירים והלב עובדים פחות ועלולים להיחלש', 'כי אין מספיק חמצן בתחנה', 'כי האימונים מפעילים את מנועי התחנה'], correctIndex: 1 },
      { id: 'fitness-q2', text: 'כמה זמן בערך אסטרונאוטים צריכים לבצע פעילות גופנית ביום?', answers: ['10 דקות', 'חצי שעה', 'שעתיים לפחות', 'אין צורך להתאמן'], correctIndex: 2 }
    ]
  },
  {
    id: 'countdown-ar',
    order: 9,
    title: 'ספירה לאחור AR',
    type: 'ar-confirmation',
    baseScore: 70,
    allowSkip: true,
    actionText: 'סיימתי',
    arSlug: 'countdown',
    wallContentSummary: ['פתחו את משימת הספירה לאחור באפליקציית רקיע, ואז הפעילו כאן ספירה אינטראקטיבית עד שיגור.']
  },
  {
    id: 'space-hygiene',
    order: 10,
    title: 'היגיינה בחלל',
    type: 'quiz',
    baseScore: 120,
    allowSkip: true,
    estimatedSeconds: 90,
    wallContentSummary: [
      'בתחנת החלל גם המים מרחפים, ולכן צחצוח שיניים ומקלחת דורשים התאמות.',
      'אסטרונאוטים לוגמים מים, מצחצחים, ובולעים את המשחה.',
      'לשמירה על היגיינה משתמשים בסבון מיוחד, שקית מים ומגבת.'
    ],
    questions: [
      { id: 'hygiene-q1', text: 'למה אי אפשר פשוט לפתוח ברז ולצחצח שיניים כמו בכדור הארץ?', answers: ['כי בתחנת החלל אין מברשות שיניים', 'כי המים מרחפים ולא זורמים לכיור כמו בכדור הארץ', 'כי אסור להשתמש במשחת שיניים', 'כי אין אור בתחנה'], correctIndex: 1 },
      { id: 'hygiene-q2', text: 'מה עושים אסטרונאוטים בסיום צחצוח השיניים לפי הקיר?', answers: ['זורקים את המים מהחלון', 'בולעים את המשחה', 'שוטפים בכיור רגיל', 'מחכים שהמשחה תתאדה'], correctIndex: 1 },
      { id: 'hygiene-q3', text: 'במה משתמשים כדי לשמור על היגיינה כשאין מקלחת רגילה?', answers: ['סבון מיוחד, שקית מים ומגבת', 'חול יבש', 'גז הליום', 'רק אוויר חם'], correctIndex: 0 }
    ]
  },
  {
    id: 'microgravity-velcro',
    order: 11,
    title: 'מיקרו-כבידה',
    type: 'three-game',
    baseScore: 180,
    allowSkip: true,
    estimatedSeconds: 130,
    video: v(videoSources.microgravity),
    wallContentSummary: ['במיקרו-כבידה חפצים יכולים לרחף. סקוץ׳ / ולקרו עוזר להצמיד אותם כדי שלא יאבדו.'],
    questions: [
      { id: 'microgravity-q1', text: 'למה סקוץ׳ חשוב בתחנת החלל?', answers: ['כדי לקשט את הקירות', 'כדי להצמיד חפצים שלא ירחפו ויאבדו', 'כדי לייצר חמצן', 'כדי לחמם אוכל'], correctIndex: 1 },
      { id: 'microgravity-q2', text: 'מה קורה לחפצים בתנאי מיקרו-כבידה?', answers: ['הם תמיד נופלים מהר יותר', 'הם יכולים לרחף אם לא מקבעים אותם', 'הם נעלמים', 'הם נדבקים אוטומטית לרצפה'], correctIndex: 1 }
    ]
  },
  {
    id: 'patch-designer',
    order: 12,
    title: 'עיצוב פאץ׳',
    type: 'patch-designer',
    baseScore: 200,
    allowSkip: true,
    wallContentSummary: ['צרו פאץ׳ משימה אישי עם צורה, צבע, סמלי חלל ושם המשתתף.']
  },
  {
    id: 'space-jewelry',
    order: 13,
    title: 'תכשיטי חלל',
    type: 'jewelry-designer',
    baseScore: 200,
    allowSkip: true,
    wallContentSummary: ['תכשיט בחלל יכול להתנהג אחרת: חלקים שנופלים בכדור הארץ יכולים לרחף, להסתובב ולהקיף במיקרו-כבידה.']
  },
  {
    id: 'sleep-cell',
    order: 14,
    title: 'תא שינה',
    type: 'video-quiz',
    baseScore: 100,
    allowSkip: true,
    estimatedSeconds: 80,
    video: v(videoSources.sleep),
    wallContentSummary: ['בתנאי מיקרו-כבידה לא חייבים לשכב. ישנים בשק שינה מקובע כדי לא לרחף ולהתנגש בחפצים.'],
    questions: [
      { id: 'sleep-q1', text: 'למה אסטרונאוטים לא חייבים לשכב כדי לישון בתחנת החלל?', answers: ['כי הגוף מרחף בתנאי מיקרו-כבידה', 'כי אין לילה בתחנה', 'כי אסור לעצום עיניים', 'כי התחנה תמיד רועשת מדי'], correctIndex: 0 },
      { id: 'sleep-q2', text: 'למה מקבעים את שק השינה או אזור השינה?', answers: ['כדי שהאסטרונאוט לא ירחף ויתנגש בחפצים', 'כדי לחמם את התחנה', 'כדי לייצר מים', 'כדי להפעיל את התאורה'], correctIndex: 0 }
    ]
  },
  {
    id: 'dream-star',
    order: 15,
    title: 'תהיו הכוכב של החלומות שלכם',
    type: 'dream-input',
    baseScore: 80,
    allowSkip: true,
    wallContentSummary: ['כתבו חלום קצר שתרצו להגשים. חלומות מאושרים יופיעו במסך הטלוויזיה של התערוכה.']
  },
  {
    id: 'space-food',
    order: 16,
    title: 'ארוחה חללית',
    type: 'video-quiz',
    baseScore: 100,
    allowSkip: true,
    estimatedSeconds: 80,
    video: v(videoSources.food),
    wallContentSummary: ['אוכל ושתייה בחלל צריכים להיות מותאמים למיקרו-כבידה, כדי שפירורים ונוזלים לא יתפזרו.'],
    questions: [
      { id: 'space-food-q1', text: 'למה אוכל בתחנת החלל צריך להיות מותאם במיוחד?', answers: ['כי במיקרו-כבידה פירורים ונוזלים יכולים לרחף ולגרום בעיות', 'כי אסור לאכול יותר מפעם ביום', 'כי אין חמצן ליד האוכל', 'כי המזון חייב להיות קפוא תמיד'], correctIndex: 0 }
    ]
  },
  {
    id: 'space-breakfast',
    order: 17,
    title: 'ארוחת בוקר שאפשר לעוף עליה',
    type: 'classification-game',
    baseScore: 150,
    allowSkip: true,
    wallContentSummary: ['מיינו פריטי ארוחת בוקר לפי התאמה לחלל: מזון ארוז ויציב מתאים, פירורים ונוזלים פתוחים בעייתיים.'],
    classificationCategories: [
      { id: 'space-ok', label: 'מתאים לחלל' },
      { id: 'problematic', label: 'בעייתי בחלל' }
    ],
    classificationItems: [
      { id: 'tortilla', label: 'טורטייה', category: 'space-ok' },
      { id: 'drink-pouch', label: 'שקית שתייה עם קשית', category: 'space-ok' },
      { id: 'sealed-snack', label: 'חטיף ארוז שלא מתפורר', category: 'space-ok' },
      { id: 'open-cereal', label: 'קערת קורנפלקס פתוחה', category: 'problematic' },
      { id: 'open-water-cup', label: 'כוס מים פתוחה', category: 'problematic' },
      { id: 'crumbly-bread', label: 'לחם מתפורר', category: 'problematic' },
      { id: 'sunny-egg', label: 'ביצת עין פתוחה', category: 'problematic' }
    ],
    questions: [
      { id: 'breakfast-q1', text: 'מה הבעיה העיקרית בפירורים בתחנת החלל?', answers: ['הם עלולים לרחף ולהיכנס למכשירים או לעיניים', 'הם כבדים מדי', 'הם קופאים מיד', 'הם הופכים למים'], correctIndex: 0 }
    ]
  },
  {
    id: 'earth-window',
    order: 18,
    title: 'חלון כדור הארץ',
    type: 'three-info-quiz',
    baseScore: 160,
    allowSkip: true,
    estimatedSeconds: 100,
    video: v(videoSources.earthWindow),
    wallContentSummary: ['מחלון הקופולה אפשר לראות את כדור הארץ, האטמוספרה הדקיקה ואזורים שונים במסלול התחנה.'],
    questions: [
      { id: 'earth-window-q1', text: 'מה אפשר לראות מחלון הקופולה בתחנת החלל?', answers: ['את כדור הארץ והאטמוספרה שלו', 'את פנים הירח בלבד', 'את כל הכוכבים מקרוב', 'את מרכז כדור הארץ'], correctIndex: 0 },
      { id: 'earth-window-q2', text: 'בערך כמה זמן לוקח לתחנת החלל להקיף את כדור הארץ?', answers: ['שעה וחצי', 'יום שלם', 'חודש', 'שנה'], correctIndex: 0 }
    ]
  },
  {
    id: 'liquid-optics',
    order: 19,
    title: 'ייצור אופטיקה בחלל באמצעות נוזלים',
    type: 'three-info-quiz',
    baseScore: 160,
    allowSkip: true,
    estimatedSeconds: 110,
    video: v(videoSources.liquidOptics),
    wallContentSummary: ['ניסוי במשימת רקיע השתמש במתח פנים של נוזלים במיקרו-כבידה כדי ליצור עדשה נוזלית.'],
    questions: [
      { id: 'optics-q1', text: 'איזה כוח/תופעה עוזרים לנוזל לקבל צורה מתאימה לעדשה בחלל?', answers: ['מתח פנים', 'רעש מנועים', 'חשמל סטטי בלבד', 'חיכוך עם הרצפה'], correctIndex: 0 },
      { id: 'optics-q2', text: 'מה היתרון האפשרי של עדשות מנוזלים בחלל?', answers: ['אפשרות ליצור בעתיד אופטיקה גדולה מאוד בלי מגבלות ייצור רגילות', 'הן תמיד צבעוניות יותר', 'הן לא צריכות אור', 'הן הופכות את התחנה למהירה יותר'], correctIndex: 0 },
      { id: 'optics-q3', text: 'באיזו מסגרת בוצע הניסוי שמוצג בתחנה?', answers: ['משימת רקיע', 'משחק מחשב', 'תחרות בישול', 'מסע ימי'], correctIndex: 0 }
    ]
  },
  {
    id: 'control-room',
    order: 20,
    title: 'חדר בקרה',
    type: 'confirmation-quiz',
    baseScore: 80,
    allowSkip: true,
    wallContentSummary: ['התנסו בעמדת הבקרה ובדקו שלושה נתונים: תקשורת, מיקום משימה ומצב צוות.'],
    questions: [
      { id: 'control-q1', text: 'מה תפקידו המרכזי של חדר בקרה במשימת חלל?', answers: ['לעקוב אחרי מצב המשימה ולסייע בקבלת החלטות', 'לבשל אוכל לאסטרונאוטים', 'לצבוע את החללית', 'להחליף את כוח הכבידה'], correctIndex: 0 }
    ]
  },
  {
    id: 'rakia-numbers',
    order: 21,
    title: 'משימת רקיע במספרים',
    type: 'quiz',
    baseScore: 150,
    allowSkip: true,
    estimatedSeconds: 90,
    wallContentSummary: [
      '17 ימים בתחנת החלל, 322 מדענים, 380 ארגונים, 80 אמנים, מעל 15,000 תלמידים ומעל מיליון צפיות בתכני המשימה.'
    ],
    questions: [
      { id: 'numbers-q1', text: 'כמה ימים שהה איתן סטיבה בתחנת החלל במסגרת משימת רקיע?', answers: ['7', '10', '17', '30'], correctIndex: 2 },
      { id: 'numbers-q2', text: 'כמה מדענים לקחו חלק במשימת רקיע לפי קיר המספרים?', answers: ['80', '95', '322', '15,000'], correctIndex: 2 },
      { id: 'numbers-q3', text: 'מה מייצג המספר 80 בקיר המספרים?', answers: ['אמנים שקיבלו השראה מתחנת החלל', 'ימי משימה', 'מצנחים', 'תחנות חלל'], correctIndex: 0 },
      { id: 'numbers-q4', text: 'כמה ארגונים השתתפו במשימה לפי הקיר?', answers: ['95', '100', '322', '380'], correctIndex: 3 },
      { id: 'numbers-q5', text: 'כמה תלמידים השתתפו בהרצאות של איתן סטיבה אחרי שחזר מהחלל?', answers: ['מעל 1,000', 'מעל 15,000', '50,000', '100'], correctIndex: 1 }
    ]
  },
  {
    id: 'space-toilet',
    order: 22,
    title: 'שירותים בחלל',
    type: 'video-quiz',
    baseScore: 100,
    allowSkip: true,
    estimatedSeconds: 80,
    video: v(videoSources.spaceToilet),
    wallContentSummary: ['במיקרו-כבידה פסולת לא נופלת למטה. שירותים בתחנת החלל משתמשים בזרימת אוויר ושאיבה.'],
    questions: [
      { id: 'toilet-q1', text: 'למה שירותים בתחנת החלל לא עובדים כמו שירותים רגילים בכדור הארץ?', answers: ['כי אין נפילה רגילה של פסולת כלפי מטה במיקרו-כבידה', 'כי אין אסטרונאוטים בתחנה', 'כי המים רותחים מיד', 'כי השירותים נמצאים מחוץ לחללית'], correctIndex: 0 },
      { id: 'toilet-q2', text: 'מה עוזר לכוון פסולת בשירותים בחלל?', answers: ['זרימת אוויר/שאיבה', 'מגנט ענק', 'אור שמש', 'פאנל סולארי'], correctIndex: 0 }
    ]
  },
  {
    id: 'asteroid-blinking',
    order: 23,
    title: 'מציאת אסטרואידים בגרובטק',
    type: 'three-game',
    baseScore: 180,
    allowSkip: true,
    estimatedSeconds: 120,
    wallContentSummary: ['בשיטת Blinking משווים כמה תמונות של אותו אזור שמיים כדי לזהות נקודה שזזה ביחס לכוכבים קבועים.'],
    questions: [
      { id: 'asteroid-q1', text: 'מה מחפשים בשיטת Blinking?', answers: ['נקודה שזזה בין תמונות רצופות', 'כוכב שנשאר תמיד באותו מקום', 'ענן בצורת חללית', 'צבע הרקע של השמיים'], correctIndex: 0 },
      { id: 'asteroid-q2', text: 'למה משווים כמה תמונות של אותו אזור שמיים?', answers: ['כדי לזהות עצם קטן שנע ביחס לכוכבים קבועים', 'כדי למדוד את גובה המבקר', 'כדי לבחור צבע לרקע', 'כדי להפעיל את תחנת החלל'], correctIndex: 0 }
    ]
  },
  {
    id: 'return-home',
    order: 24,
    title: 'חזרה הביתה',
    type: 'video-confirmation',
    baseScore: 60,
    allowSkip: true,
    actionText: 'צפיתי בחזרה הביתה',
    video: v(videoSources.returnHome),
    wallContentSummary: ['קפסולת Dragon חוזרת לאטמוספרה, פורסת מצנחים ונוחתת באוקיינוס.'],
    questions: [
      { id: 'return-q1', text: 'איך הקפסולה מאיטה לקראת הנחיתה הסופית?', answers: ['בעזרת מצנחים', 'בעזרת גלגלים כמו מטוס', 'בעזרת עוגן באדמה', 'היא לא מאטה'], correctIndex: 0 }
    ]
  },
  {
    id: 'summary-export',
    order: 25,
    title: 'סיום והורדת PDF',
    type: 'summary',
    baseScore: 0,
    allowSkip: false,
    wallContentSummary: ['השלימו את הדרכון, בדקו את החותמות והורידו PDF רב-עמודי של מסע רקיע האישי.']
  }
]

export const missionById = Object.fromEntries(missions.map((mission) => [mission.id, mission])) as Record<string, MissionConfig>
