import type { Lang, LoanType } from '../types.ts'

const TYPES: LoanType[] = ['education', 'crop', 'business', 'personal']

const TYPE_WORDS: Record<LoanType, string[]> = {
  education: ['education', 'educaton', 'eduction', 'study', 'studies', 'college', 'tuition', 'student', 'school', 'university', 'படிப்பு', 'கல்வி', 'கல்லூரி', 'पढ़ाई', 'पढ़ाई', 'शिक्षा', 'कॉलेज', 'विद्यालय'],
  crop: ['crop', 'farm', 'farming', 'farmer', 'agriculture', 'agriculure', 'kisan', 'விவசாய', 'பயிர்', 'खेती', 'फसल', 'किसान'],
  business: ['business', 'bussiness', 'buisness', 'shop', 'gst', 'udyam', 'தொழில்', 'கடை', 'कारोबार', 'व्यापार', 'दुकान'],
  personal: ['personal', 'personnal', 'private', 'தனிப்பட்ட', 'निजी', 'व्यक्तिगत'],
}

const DOCUMENT_WORDS = ['document', 'documents', 'documnet', 'doc', 'paper', 'papers', 'bring', 'checklist', 'certificate', 'proof', 'ஆவண', 'சான்றிதழ்', 'दस्तावेज', 'कागज', 'कागजात']

const PAPERS: Record<Lang, Record<LoanType, { intro: string; items: string[] }>> = {
  en: {
    education: {
      intro: 'For an education loan, banks usually ask for these papers.',
      items: [
        'Admission or offer letter from the college',
        'Fee structure, or the college letter that shows the fees',
        'Mark sheets for class 10, class 12, and the latest course',
        'Aadhaar and PAN of the student',
        'Aadhaar, PAN, and a photo of the parent or guardian who will sign with you',
        'Income proof of that parent or guardian: salary slips, tax papers, or an income certificate',
        'Bank statement for the last 6 months',
        'Passport-size photographs',
        'If the course is abroad: passport, visa papers, and the college cost letter',
        'If the bank asks for security: the property papers they name',
      ],
    },
    crop: {
      intro: 'For a crop or farming loan, banks usually ask for these papers.',
      items: [
        'Aadhaar and PAN',
        'Land record, such as the patta, chitta, or record of rights',
        'A note on which crop you will grow this season',
        'Bank statement for the last 6 months',
        'Passport-size photographs',
        'Details of any farm loan you already have',
        'If the bank asks: a quotation for seeds, fertilizer, or equipment',
      ],
    },
    business: {
      intro: 'For a business loan, banks usually ask for these papers.',
      items: [
        'Aadhaar and PAN',
        'Business proof, such as GST, Udyam, or a shop license',
        'Bank statement for the last 6 months',
        'Income-tax papers, if you file them',
        'A short note on how this money will be used',
        'Quotations for stock, machinery, or the shop',
        'Passport-size photographs',
        'If the bank asks for security: the property papers they name',
      ],
    },
    personal: {
      intro: 'For a personal loan, banks usually ask for these papers.',
      items: [
        'Aadhaar and PAN',
        'Income proof, such as salary slips or tax papers',
        'Bank statement for the last 6 months',
        'Passport-size photographs',
        'A short note on what the money is for',
        'A list of loans you already repay',
        'If the bank asks for security: the property papers they name',
      ],
    },
  },
  ta: {
    education: {
      intro: 'படிப்பு கடனுக்கு வங்கிகள் வழக்கமாக இந்த ஆவணங்களை கேட்கும்.',
      items: [
        'கல்லூரியின் சேர்க்கை அல்லது ஒப்புதல் கடிதம்',
        'கட்டண விவரம், அல்லது கட்டணத்தை காட்டும் கல்லூரி கடிதம்',
        '10, 12 மற்றும் கடைசி படிப்பின் மதிப்பெண் பட்டியல்',
        'மாணவரின் ஆதார் மற்றும் பான்',
        'உடன் கையெழுத்திடும் பெற்றோர் அல்லது பாதுகாவலரின் ஆதார், பான், புகைப்படம்',
        'அவர்களின் வருமான ஆதாரம்: சம்பள சீட்டு, வரி ஆவணம், அல்லது வருமான சான்றிதழ்',
        'கடந்த 6 மாத வங்கி அறிக்கை',
        'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
        'வெளிநாட்டு படிப்பு என்றால்: பாஸ்போர்ட், விசா ஆவணம், கல்லூரி செலவு கடிதம்',
        'வங்கி பிணை கேட்டால்: அவர்கள் சொல்லும் சொத்து ஆவணங்கள்',
      ],
    },
    crop: {
      intro: 'விவசாய கடனுக்கு வங்கிகள் வழக்கமாக இந்த ஆவணங்களை கேட்கும்.',
      items: [
        'ஆதார் மற்றும் பான்',
        'நில ஆவணம், பட்டா, சிட்டா, அல்லது உரிமை பதிவு',
        'இந்த பருவத்தில் எந்த பயிர் என்ற குறிப்பு',
        'கடந்த 6 மாத வங்கி அறிக்கை',
        'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
        'ஏற்கனவே உள்ள விவசாய கடன் விவரம்',
        'வங்கி கேட்டால்: விதை, உரம், அல்லது கருவிக்கான மதிப்பீடு',
      ],
    },
    business: {
      intro: 'தொழில் கடனுக்கு வங்கிகள் வழக்கமாக இந்த ஆவணங்களை கேட்கும்.',
      items: [
        'ஆதார் மற்றும் பான்',
        'தொழில் ஆதாரம்: ஜிஎஸ்டி, உத்யம், அல்லது கடை உரிமம்',
        'கடந்த 6 மாத வங்கி அறிக்கை',
        'வரி ஆவணம், தாக்கல் செய்திருந்தால்',
        'இந்த பணத்தை எப்படி பயன்படுத்துவீர்கள் என்ற சிறு குறிப்பு',
        'சரக்கு, இயந்திரம், அல்லது கடைக்கான மதிப்பீடு',
        'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
        'வங்கி பிணை கேட்டால்: அவர்கள் சொல்லும் சொத்து ஆவணங்கள்',
      ],
    },
    personal: {
      intro: 'தனிப்பட்ட கடனுக்கு வங்கிகள் வழக்கமாக இந்த ஆவணங்களை கேட்கும்.',
      items: [
        'ஆதார் மற்றும் பான்',
        'வருமான ஆதாரம்: சம்பள சீட்டு அல்லது வரி ஆவணம்',
        'கடந்த 6 மாத வங்கி அறிக்கை',
        'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
        'பணம் எதற்கு என்ற சிறு குறிப்பு',
        'ஏற்கனவே கட்டும் கடன்களின் பட்டியல்',
        'வங்கி பிணை கேட்டால்: அவர்கள் சொல்லும் சொத்து ஆவணங்கள்',
      ],
    },
  },
  hi: {
    education: {
      intro: 'पढ़ाई के कर्ज के लिए बैंक आमतौर पर ये कागज माँगते हैं.',
      items: [
        'कॉलेज का दाखिला या ऑफर पत्र',
        'फीस का विवरण, या फीस दिखाने वाला कॉलेज पत्र',
        'कक्षा 10, 12 और आखिरी कोर्स की अंकतालिका',
        'छात्र का आधार और पैन',
        'साथ हस्ताक्षर करने वाले माता-पिता या अभिभावक का आधार, पैन और फोटो',
        'उनकी आय का प्रमाण: सैलरी स्लिप, टैक्स कागज, या आय प्रमाण पत्र',
        'पिछले 6 महीने का बैंक स्टेटमेंट',
        'पासपोर्ट आकार की तस्वीरें',
        'विदेश की पढ़ाई हो तो: पासपोर्ट, वीजा कागज और कॉलेज का खर्च पत्र',
        'बैंक जमानत माँगे तो: जो संपत्ति कागज वे बताएँ',
      ],
    },
    crop: {
      intro: 'खेती के कर्ज के लिए बैंक आमतौर पर ये कागज माँगते हैं.',
      items: [
        'आधार और पैन',
        'ज़मीन का रिकॉर्ड, जैसे पट्टा या अधिकार अभिलेख',
        'इस मौसम में कौन सी फसल होगी, उसकी एक टिप्पणी',
        'पिछले 6 महीने का बैंक स्टेटमेंट',
        'पासपोर्ट आकार की तस्वीरें',
        'पहले से चल रहे खेती कर्ज का विवरण',
        'बैंक माँगे तो: बीज, खाद या मशीन का कोटेशन',
      ],
    },
    business: {
      intro: 'कारोबार के कर्ज के लिए बैंक आमतौर पर ये कागज माँगते हैं.',
      items: [
        'आधार और पैन',
        'कारोबार का प्रमाण, जैसे जीएसटी, उद्यम या दुकान का लाइसेंस',
        'पिछले 6 महीने का बैंक स्टेटमेंट',
        'आयकर कागज, अगर आप दाखिल करते हैं',
        'यह पैसा कैसे उपयोग होगा, एक छोटा नोट',
        'सामान, मशीन या दुकान का कोटेशन',
        'पासपोर्ट आकार की तस्वीरें',
        'बैंक जमानत माँगे तो: जो संपत्ति कागज वे बताएँ',
      ],
    },
    personal: {
      intro: 'निजी कर्ज के लिए बैंक आमतौर पर ये कागज माँगते हैं.',
      items: [
        'आधार और पैन',
        'आय का प्रमाण, जैसे सैलरी स्लिप या टैक्स कागज',
        'पिछले 6 महीने का बैंक स्टेटमेंट',
        'पासपोर्ट आकार की तस्वीरें',
        'पैसा किस काम का है, एक छोटा नोट',
        'जो कर्ज आप पहले से चुका रहे हैं उनकी सूची',
        'बैंक जमानत माँगे तो: जो संपत्ति कागज वे बताएँ',
      ],
    },
  },
}

export interface DocumentAnswer {
  loanType: LoanType
  intro: string
  items: string[]
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function mentions(query: string, words: string[]): boolean {
  return words.some((word) => query.includes(word))
}

export function detectLoanType(query: string): LoanType | null {
  const text = normalize(query)
  let chosen: LoanType | null = null
  let best = 0
  for (const type of TYPES) {
    const score = TYPE_WORDS[type].filter((word) => text.includes(word)).length
    if (score > best) {
      best = score
      chosen = type
    }
  }
  return chosen
}

export function answerQuestion(query: string, current: LoanType, lang: Lang): DocumentAnswer | null {
  const text = normalize(query)
  if (!text) return null
  const named = detectLoanType(text)
  const aboutPapers = mentions(text, DOCUMENT_WORDS)
  if (!named && !aboutPapers) return null
  const loanType = named ?? current
  const pack = PAPERS[lang][loanType]
  return { loanType, intro: pack.intro, items: pack.items }
}

export function speakText(text: string, lang: Lang): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
  window.speechSynthesis.speak(utterance)
}
