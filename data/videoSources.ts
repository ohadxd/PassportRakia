const firebaseStorageUrl = (bucket: string, path: string, token: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`

const missionBucket = 'basicapp-dd04f.firebasestorage.app'

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
    storagePath: 'mission-models/Fitness-sapce.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/Fitness-sapce.mp4', '08d652d8-a723-4a75-9018-9d5c5333b622'),
    sourceTitle: 'כושר בחלל',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=Uc5H8Pw2Dvo'
  },
  spaceHygiene: {
    storagePath: 'mission-models/space-hygiene.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/space-hygiene.mp4', 'd66a49f0-c77a-4f9f-ae8d-df278cdadaee'),
    sourceTitle: 'היגיינה בחלל',
    sourceReferenceUrl: ''
  },
  hygieneToilet: {
    storagePath: 'mission-models/hygiene-toilet.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/hygiene-toilet.mp4', '043b266f-168d-4dcc-bdda-9477a7c3a960'),
    sourceTitle: 'שירותים בחלל',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=pc_TaEVGl4o'
  },
  hygieneShower: {
    storagePath: 'mission-models/hygiene-shower.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/hygiene-shower.mp4', 'dfe80d99-49bc-4bff-953c-55d35bdd6ebb'),
    sourceTitle: 'מקלחת בחלל',
    sourceReferenceUrl: ''
  },
  microgravity: {
    storagePath: 'mission-videos/microgravity.mp4',
    sourceTitle: 'יום בחיי אסטרונאוט - חוויית המיקרו־כבידה',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=ylXW_sYyvuc'
  },
  sleep: {
    storagePath: 'mission-models/sleep-space.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/sleep-space.mp4', '357fd3e7-6847-4d52-86d8-edc69c3ea309'),
    sourceTitle: 'יום בחיי אסטרונאוט - שינה בתחנת החלל',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=Ptadd44Nyeo'
  },
  food: {
    storagePath: 'mission-models/space-food.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/space-food.mp4', '01bfaa92-5ebb-4645-a6ef-a0793c5313a7'),
    sourceTitle: 'יום בחיי אסטרונאוט - כיצד אוכלים ושותים בתחנת החלל',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=DZy1L2rveLM'
  },
  earthWindow: {
    storagePath: 'mission-videos/earth-window.mp4',
    sourceTitle: 'מה רואים מתחנת החלל הבינלאומית?',
    sourceReferenceUrl: 'https://www.youtube.com/watch?v=F3FiYUtXopo'
  },
  liquidOptics: {
    storagePath: 'mission-models/liquid-optics.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/liquid-optics.mp4', '24cee5db-16e8-4dcb-bb2c-7edbffac9510'),
    sourceTitle: 'ככה מייצרים עדשות בחלל',
    sourceReferenceUrl: 'https://www.rakiamission.com/rakia-vod-he'
  },
  returnHome: {
    storagePath: 'mission-models/landing-return.mp4',
    url: firebaseStorageUrl(missionBucket, 'mission-models/landing-return.mp4', '828d7ccc-ebe1-4bb6-bf27-104d38a47e92'),
    sourceTitle: 'חזרה הביתה / נחיתת החללית',
    sourceReferenceUrl: ''
  }
} as const
