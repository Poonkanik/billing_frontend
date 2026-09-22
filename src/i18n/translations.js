// ─────────────────────── Translation Strings ───────────────────────────
// Add new keys here and provide translations for each language.
// Access via: const { t } = useLanguage(); t('key')

const translations = {
  // ── Sidebar Navigation ──
  'nav.dashboard': {
    en: 'Dashboard', ta: 'டாஷ்போர்டு', hi: 'डैशबोर्ड', te: 'డాష్‌బోర్డ్', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', ml: 'ഡാഷ്‌ബോർഡ്',
  },
  'nav.openClose': {
    en: 'Open & Close Amount', ta: 'திறப்பு & முடிவு இருப்பு', hi: 'ओपनिंग और क्लोजिंग राशि', te: 'ఓపెనింగ్ & క్లోజింగ్ మొత్తం', kn: 'ಆರಂಭಿಕ & ಮುಕ್ತಾಯ ಮೊತ್ತ', ml: 'തുടക്ക & അവസാന തുക',
  },
  'nav.opening': {
    en: 'Opening Amount', ta: 'தொடக்க இருப்பு', hi: 'ओपनिंग राशि', te: 'ప్రారంభ మొత్తం', kn: 'ಆರಂಭಿಕ ಮೊತ್ತ', ml: 'തുടക്ക തുക',
  },
  'nav.closing': {
    en: 'Closing Amount', ta: 'முடிவு இருப்பு', hi: 'क्लोजिंग राशि', te: 'ముగింపు మొత్తం', kn: 'ಮುಕ್ತಾಯ ಮೊತ್ತ', ml: 'അവസാന തുക',
  },
  'nav.billing': {
    en: 'Billing', ta: 'பில்லிங்', hi: 'बिलिंग', te: 'బిల్లింగ్', kn: 'ಬಿಲ್ಲಿಂಗ್', ml: 'ബില്ലിംഗ്',
  },
  'nav.onlineOrders': {
    en: 'Online Orders', ta: 'ஆன்லைன் ஆர்டர்கள்', hi: 'ऑनलाइन ऑर्डर', te: 'ఆన్‌లైన్ ఆర్డర్లు', kn: 'ಆನ್‌ಲೈನ್ ಆದೇಶಗಳು', ml: 'ഓൺലൈൻ ഓർഡറുകൾ',
  },
  'nav.master': {
    en: 'Master', ta: 'மாஸ்டர்', hi: 'मास्टर', te: 'మాస్టర్', kn: 'ಮಾಸ್ಟರ್', ml: 'മാസ്റ്റർ',
  },
  'nav.departments': {
    en: 'Departments', ta: 'துறைகள்', hi: 'विभाग', te: 'విభాగాలు', kn: 'ವಿಭಾಗಗಳು', ml: 'വിഭാഗങ്ങൾ',
  },
  'nav.inventory': {
    en: 'Inventory', ta: 'சரக்கு இருப்பு', hi: 'इन्वेंटरी / स्टॉक', te: 'ఇన్వెంటరీ', kn: 'ದಾಸ್ತಾನು', ml: 'ഇൻവെന്ററി',
  },
  'nav.reports': {
    en: 'Reports', ta: 'அறிக்கைகள்', hi: 'रिपोर्ट', te: 'నివేదికలు', kn: 'ವರದಿಗಳು', ml: 'റിപ്പോർട്ടുകൾ',
  },
  'nav.options': {
    en: 'Options', ta: 'விருப்பங்கள்', hi: 'विकल्प', te: 'ఎంపికలు', kn: 'ಆಯ್ಕೆಗಳು', ml: 'ഓപ്ഷനുകൾ',
  },
  'nav.users': {
    en: 'Users', ta: 'பயனர்கள்', hi: 'उपयोगकर्ता', te: 'వినియోగదారులు', kn: 'ಬಳಕೆದಾರರು', ml: 'ഉപയോക്താക്കൾ',
  },
  'nav.devices': {
    en: 'Devices', ta: 'சாதனங்கள்', hi: 'उपकरण', te: 'పరికరాలు', kn: 'ಸಾಧನಗಳು', ml: 'ഉപകരണങ്ങൾ',
  },

  // ── Header / Topbar ──
  'header.online': {
    en: 'Online', ta: 'ஆன்லைன்', hi: 'ऑनलाइन', te: 'ఆన్‌లైన్', kn: 'ಆನ್‌ಲೈನ್', ml: 'ഓൺലൈൻ',
  },
  'header.devices': {
    en: 'Devices', ta: 'சாதனங்கள்', hi: 'उपकरण', te: 'పరికరాలు', kn: 'ಸಾಧನಗಳು', ml: 'ഉപകരണങ്ങൾ',
  },
  'header.loggedInAs': {
    en: 'Logged in as', ta: 'உள்நுழைந்தது', hi: 'लॉग इन', te: 'లాగిన్', kn: 'ಲಾಗಿನ್', ml: 'ലോഗിൻ',
  },
  'header.logout': {
    en: 'Logout', ta: 'வெளியேறு', hi: 'लॉग आउट', te: 'లాగ్ అవుట్', kn: 'ಲಾಗ್ ಔಟ್', ml: 'ലോഗൗട്ട്',
  },
  'header.selectLanguage': {
    en: 'Select Language', ta: 'மொழி தேர்வு', hi: 'भाषा चुनें', te: 'భాష ఎంచుకోండి', kn: 'ಭಾಷೆ ಆಯ್ಕೆ', ml: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
  },

  // ── Login Page ──
  'login.title': {
    en: 'Welcome Back', ta: 'மீண்டும் வருக', hi: 'वापस स्वागत है', te: 'తిరిగి స్వాగతం', kn: 'ಮತ್ತೆ ಸ್ವಾಗತ', ml: 'തിരികെ സ്വാഗതം',
  },
  'login.subtitle': {
    en: 'Sign in to your account', ta: 'உங்கள் கணக்கில் உள்நுழையவும்', hi: 'अपने खाते में साइन इन करें', te: 'మీ ఖాతాలో సైన్ ఇన్ చేయండి', kn: 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ', ml: 'നിങ്ങളുടെ അക്കൗണ്ടിൽ സൈൻ ഇൻ ചെയ്യുക',
  },
  'login.username': {
    en: 'Username', ta: 'பயனர்பெயர்', hi: 'उपयोगकर्ता नाम', te: 'వినియోగదారు పేరు', kn: 'ಬಳಕೆದಾರ ಹೆಸರು', ml: 'ഉപയോക്തൃനാമം',
  },
  'login.password': {
    en: 'Password', ta: 'கடவுச்சொல்', hi: 'पासवर्ड', te: 'పాస్‌వర్డ్', kn: 'ಪಾಸ್‌ವರ್ಡ್', ml: 'പാസ്‌വേഡ്',
  },
  'login.signIn': {
    en: 'Sign In', ta: 'உள்நுழை', hi: 'साइन इन', te: 'సైన్ ఇన్', kn: 'ಸೈನ್ ಇನ್', ml: 'സൈൻ ഇൻ',
  },
  'login.signingIn': {
    en: 'Signing In...', ta: 'உள்நுழைகிறது...', hi: 'साइन इन हो रहा है...', te: 'సైన్ ఇన్ అవుతోంది...', kn: 'ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ...', ml: 'സൈൻ ഇൻ ചെയ്യുന്നു...',
  },

  // ── Billing Page ──
  'billing.newBill': {
    en: 'New Bill', ta: 'புதிய பில்', hi: 'नया बिल', te: 'కొత్త బిల్', kn: 'ಹೊಸ ಬಿಲ್', ml: 'പുതിയ ബിൽ',
  },
  'billing.holdBill': {
    en: 'Hold Bill', ta: 'நிறுத்தி வை', hi: 'बिल होल्ड', te: 'బిల్ హోల్డ్', kn: 'ಬಿಲ್ ಹೋಲ್ಡ್', ml: 'ബിൽ ഹോൾഡ്',
  },
  'billing.printBill': {
    en: 'Print Bill', ta: 'பில் அச்சிடு', hi: 'बिल प्रिंट', te: 'బిల్ ప్రింట్', kn: 'ಬಿಲ್ ಪ್ರಿಂಟ್', ml: 'ബിൽ പ്രിന്റ്',
  },
  'billing.saveBill': {
    en: 'Save Bill', ta: 'பில் சேமி', hi: 'बिल सेव', te: 'బిల్ సేవ్', kn: 'ಬಿಲ್ ಸೇವ್', ml: 'ബിൽ സേവ്',
  },
  'billing.total': {
    en: 'Total', ta: 'மொத்தம்', hi: 'कुल', te: 'మొత్తం', kn: 'ಒಟ್ಟು', ml: 'ആകെ',
  },
  'billing.subtotal': {
    en: 'Subtotal', ta: 'உப மொத்தம்', hi: 'उप कुल', te: 'ఉప మొత్తం', kn: 'ಉಪ ಒಟ್ಟು', ml: 'ഉപ ആകെ',
  },
  'billing.discount': {
    en: 'Discount', ta: 'தள்ளுபடி', hi: 'छूट', te: 'తగ్గింపు', kn: 'ರಿಯಾಯಿತಿ', ml: 'കിഴിവ്',
  },
  'billing.tax': {
    en: 'Tax', ta: 'வரி', hi: 'कर', te: 'పన్ను', kn: 'ತೆರಿಗೆ', ml: 'നികുതി',
  },
  'billing.grandTotal': {
    en: 'Grand Total', ta: 'மொத்த தொகை', hi: 'कुल योग', te: 'గ్రాండ్ టోటల్', kn: 'ಗ್ರಾಂಡ್ ಟೋಟಲ್', ml: 'ഗ്രാൻഡ് ടോട്ടൽ',
  },
  'billing.qty': {
    en: 'Qty', ta: 'எண்ணிக்கை', hi: 'मात्रा', te: 'పరిమాణం', kn: 'ಪ್ರಮಾಣ', ml: 'അളവ്',
  },
  'billing.rate': {
    en: 'Rate', ta: 'விலை', hi: 'दर', te: 'రేటు', kn: 'ದರ', ml: 'നിരക്ക്',
  },
  'billing.amount': {
    en: 'Amount', ta: 'தொகை', hi: 'राशि', te: 'మొత్తం', kn: 'ಮೊತ್ತ', ml: 'തുക',
  },
  'billing.item': {
    en: 'Item', ta: 'பொருள்', hi: 'आइटम', te: 'ఐటెం', kn: 'ಐಟಂ', ml: 'ഐറ്റം',
  },
  'billing.items': {
    en: 'Items', ta: 'பொருட்கள்', hi: 'आइटम', te: 'ఐటెమ్‌లు', kn: 'ಐಟಂಗಳು', ml: 'ഐറ്റങ്ങൾ',
  },
  'billing.search': {
    en: 'Search products...', ta: 'பொருட்கள் தேடு...', hi: 'उत्पाद खोजें...', te: 'ఉత్పత్తులు వెతకండి...', kn: 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...', ml: 'ഉൽപ്പന്നങ്ങൾ തിരയുക...',
  },
  'billing.cash': {
    en: 'Cash', ta: 'பணம்', hi: 'नकद', te: 'నగదు', kn: 'ನಗದು', ml: 'പണം',
  },
  'billing.card': {
    en: 'Card', ta: 'கார்டு', hi: 'कार्ड', te: 'కార్డు', kn: 'ಕಾರ್ಡ್', ml: 'കാർഡ്',
  },
  'billing.upi': {
    en: 'UPI', ta: 'UPI', hi: 'UPI', te: 'UPI', kn: 'UPI', ml: 'UPI',
  },
  'billing.dineIn': {
    en: 'Dine In', ta: 'உள்ளே சாப்பிடு', hi: 'डाइन इन', te: 'డైన్ ఇన్', kn: 'ಡೈನ್ ಇನ್', ml: 'ഡൈൻ ഇൻ',
  },
  'billing.takeaway': {
    en: 'Takeaway', ta: 'பார்சல்', hi: 'टेकअवे', te: 'టేకావే', kn: 'ಟೇಕ್‌ಅವೇ', ml: 'ടേക്ക്‌അവേ',
  },
  'billing.parcel': {
    en: 'Parcel', ta: 'பார்சல்', hi: 'पार्सल', te: 'పార్సెల్', kn: 'ಪಾರ್ಸೆಲ್', ml: 'പാർസൽ',
  },
  'billing.delivery': {
    en: 'Delivery', ta: 'டெலிவரி', hi: 'डिलीवरी', te: 'డెలివరీ', kn: 'ಡೆಲಿವರಿ', ml: 'ഡെലിവറി',
  },
  'billing.customer': {
    en: 'Customer', ta: 'வாடிக்கையாளர்', hi: 'ग्राहक', te: 'కస్టమర్', kn: 'ಗ್ರಾಹಕ', ml: 'ഉപഭോക്താവ്',
  },
  'billing.waiter': {
    en: 'Waiter', ta: 'பணியாளர்', hi: 'वेटर', te: 'వెయిటర్', kn: 'ವೇಟರ್', ml: 'വെയിറ്റർ',
  },
  'billing.table': {
    en: 'Table', ta: 'மேஜை', hi: 'टेबल', te: 'టేబుల్', kn: 'ಟೇಬಲ್', ml: 'ടേബിൾ',
  },
  'billing.captain': {
    en: 'Captain', ta: 'கேப்டன்', hi: 'कैप्टन', te: 'కెప్టెన్', kn: 'ಕ್ಯಾಪ್ಟನ್', ml: 'ക്യാപ്റ്റൻ',
  },
  'billing.paymentMode': {
    en: 'Payment Mode', ta: 'கட்டண முறை', hi: 'भुगतान विधि', te: 'చెల్లింపు విధానం', kn: 'ಪಾವತಿ ವಿಧಾನ', ml: 'പേയ്മെന്റ് രീതി',
  },

  // ── Dashboard ──
  'dashboard.todaySales': {
    en: "Today's Sales", ta: 'இன்றைய விற்பனை', hi: 'आज की बिक्री', te: 'నేటి అమ్మకాలు', kn: 'ಇಂದಿನ ಮಾರಾಟ', ml: 'ഇന്നത്തെ വിൽപ്പന',
  },
  'dashboard.totalBills': {
    en: 'Total Bills', ta: 'மொத்த பில்கள்', hi: 'कुल बिल', te: 'మొత్తం బిల్లులు', kn: 'ಒಟ್ಟು ಬಿಲ್‌ಗಳು', ml: 'ആകെ ബില്ലുകൾ',
  },
  'dashboard.avgBillValue': {
    en: 'Avg Bill Value', ta: 'சராசரி பில் மதிப்பு', hi: 'औसत बिल मूल्य', te: 'సగటు బిల్ విలువ', kn: 'ಸರಾಸರಿ ಬಿಲ್ ಮೌಲ್ಯ', ml: 'ശരാശരി ബിൽ മൂല്യം',
  },
  'dashboard.topItems': {
    en: 'Top Items', ta: 'சிறந்த பொருட்கள்', hi: 'शीर्ष आइटम', te: 'టాప్ ఐటెమ్స్', kn: 'ಟಾಪ್ ಐಟಂಗಳು', ml: 'ടോപ്പ് ഐറ്റങ്ങൾ',
  },

  // ── Master Page Tabs ──
  'master.company': {
    en: 'Company', ta: 'நிறுவனம்', hi: 'कंपनी', te: 'కంపెనీ', kn: 'ಕಂಪನಿ', ml: 'കമ്പനി',
  },
  'master.branches': {
    en: 'Branches', ta: 'கிளைகள்', hi: 'शाखाएं', te: 'శాఖలు', kn: 'ಶಾಖೆಗಳು', ml: 'ശാഖകൾ',
  },
  'master.groups': {
    en: 'Groups', ta: 'குழுக்கள்', hi: 'समूह', te: 'సమూహాలు', kn: 'ಗುಂಪುಗಳು', ml: 'ഗ്രൂപ്പുകൾ',
  },
  'master.products': {
    en: 'Products', ta: 'பொருட்கள்', hi: 'उत्पाद', te: 'ఉత్పత్తులు', kn: 'ಉತ್ಪನ್ನಗಳು', ml: 'ഉൽപ്പന്നങ്ങൾ',
  },
  'master.tables': {
    en: 'Tables', ta: 'மேஜைகள்', hi: 'टेबल', te: 'టేబుళ్ళు', kn: 'ಟೇಬಲ್‌ಗಳು', ml: 'ടേബിളുകൾ',
  },
  'master.customers': {
    en: 'Customers', ta: 'வாடிக்கையாளர்கள்', hi: 'ग्राहक', te: 'కస్టమర్లు', kn: 'ಗ್ರಾಹಕರು', ml: 'ഉപഭോക്താക്കൾ',
  },
  'master.waiters': {
    en: 'Waiters', ta: 'பணியாளர்கள்', hi: 'वेटर', te: 'వెయిటర్లు', kn: 'ವೇಟರ್‌ಗಳು', ml: 'വെയിറ്റർമാർ',
  },
  'master.captains': {
    en: 'Captains', ta: 'கேப்டன்கள்', hi: 'कैप्टन', te: 'కెప్టెన్లు', kn: 'ಕ್ಯಾಪ್ಟನ್‌ಗಳು', ml: 'ക്യാപ്റ്റൻമാർ',
  },
  'master.rateInfo': {
    en: 'Rate Info', ta: 'விலை தகவல்', hi: 'दर जानकारी', te: 'రేటు సమాచారం', kn: 'ದರ ಮಾಹಿತಿ', ml: 'നിരക്ക് വിവരം',
  },
  'master.salesModes': {
    en: 'Sales Modes', ta: 'விற்பனை முறைகள்', hi: 'बिक्री मोड', te: 'అమ్మకపు విధానాలు', kn: 'ಮಾರಾಟ ವಿಧಾನಗಳು', ml: 'വിൽപ്പന രീതികൾ',
  },

  // ── Common Actions ──
  'action.save': {
    en: 'Save', ta: 'சேமி', hi: 'सेव करें', te: 'సేవ్', kn: 'ಉಳಿಸಿ', ml: 'സേവ് ചെയ്യുക',
  },
  'action.cancel': {
    en: 'Cancel', ta: 'ரத்து', hi: 'रद्द करें', te: 'రద్దు', kn: 'ರದ್ದುಮಾಡಿ', ml: 'റദ്ദാക്കുക',
  },
  'action.delete': {
    en: 'Delete', ta: 'நீக்கு', hi: 'हटाएं', te: 'తొలగించు', kn: 'ಅಳಿಸಿ', ml: 'ഇല്ലാതാക്കുക',
  },
  'action.edit': {
    en: 'Edit', ta: 'திருத்து', hi: 'संपादित करें', te: 'సవరించు', kn: 'ಸಂಪಾದಿಸಿ', ml: 'എഡിറ്റ് ചെയ്യുക',
  },
  'action.add': {
    en: 'Add', ta: 'சேர்', hi: 'जोड़ें', te: 'జోడించు', kn: 'ಸೇರಿಸಿ', ml: 'ചേർക്കുക',
  },
  'action.search': {
    en: 'Search', ta: 'தேடு', hi: 'खोजें', te: 'వెతకండి', kn: 'ಹುಡುಕಿ', ml: 'തിരയുക',
  },
  'action.filter': {
    en: 'Filter', ta: 'வடிகட்டு', hi: 'फ़िल्टर', te: 'ఫిల్టర్', kn: 'ಫಿಲ್ಟರ್', ml: 'ഫിൽട്ടർ',
  },
  'action.export': {
    en: 'Export', ta: 'ஏற்றுமதி', hi: 'निर्यात', te: 'ఎగుమతి', kn: 'ರಫ್ತು', ml: 'എക്‌സ്‌പോർട്ട്',
  },
  'action.print': {
    en: 'Print', ta: 'அச்சிடு', hi: 'प्रिंट', te: 'ప్రింట్', kn: 'ಮುದ್ರಿಸಿ', ml: 'പ്രിന്റ്',
  },
  'action.close': {
    en: 'Close', ta: 'மூடு', hi: 'बंद करें', te: 'మూసివేయి', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക',
  },
  'action.confirm': {
    en: 'Confirm', ta: 'உறுதிசெய்', hi: 'पुष्टि करें', te: 'నిర్ధారించు', kn: 'ದೃಢೀಕರಿಸಿ', ml: 'സ്ഥിരീകരിക്കുക',
  },
  'action.yes': {
    en: 'Yes', ta: 'ஆம்', hi: 'हाँ', te: 'అవును', kn: 'ಹೌದು', ml: 'അതെ',
  },
  'action.no': {
    en: 'No', ta: 'இல்லை', hi: 'नहीं', te: 'కాదు', kn: 'ಇಲ್ಲ', ml: 'ഇല്ല',
  },
  'action.loading': {
    en: 'Loading...', ta: 'ஏற்றுகிறது...', hi: 'लोड हो रहा है...', te: 'లోడ్ అవుతోంది...', kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', ml: 'ലോഡ് ചെയ്യുന്നു...',
  },

  // ── Common Labels ──
  'label.name': {
    en: 'Name', ta: 'பெயர்', hi: 'नाम', te: 'పేరు', kn: 'ಹೆಸರು', ml: 'പേര്',
  },
  'label.code': {
    en: 'Code', ta: 'குறியீடு', hi: 'कोड', te: 'కోడ్', kn: 'ಕೋಡ್', ml: 'കോഡ്',
  },
  'label.status': {
    en: 'Status', ta: 'நிலை', hi: 'स्थिति', te: 'స్థితి', kn: 'ಸ್ಥಿತಿ', ml: 'സ്ഥിതി',
  },
  'label.active': {
    en: 'Active', ta: 'செயலில்', hi: 'सक्रिय', te: 'యాక్టివ్', kn: 'ಸಕ್ರಿಯ', ml: 'സജീവം',
  },
  'label.inactive': {
    en: 'Inactive', ta: 'செயலற்ற', hi: 'निष्क्रिय', te: 'నిష్క్రియ', kn: 'ನಿಷ್ಕ್ರಿಯ', ml: 'നിഷ്‌ക്രിയം',
  },
  'label.date': {
    en: 'Date', ta: 'தேதி', hi: 'तारीख', te: 'తేదీ', kn: 'ದಿನಾಂಕ', ml: 'തീയതി',
  },
  'label.time': {
    en: 'Time', ta: 'நேரம்', hi: 'समय', te: 'సమయం', kn: 'ಸಮಯ', ml: 'സമയം',
  },
  'label.price': {
    en: 'Price', ta: 'விலை', hi: 'कीमत', te: 'ధర', kn: 'ಬೆಲೆ', ml: 'വില',
  },
  'label.description': {
    en: 'Description', ta: 'விவரம்', hi: 'विवरण', te: 'వివరణ', kn: 'ವಿವರಣೆ', ml: 'വിവരണം',
  },
  'label.phone': {
    en: 'Phone', ta: 'தொலைபேசி', hi: 'फ़ोन', te: 'ఫోన్', kn: 'ಫೋನ್', ml: 'ഫോൺ',
  },
  'label.address': {
    en: 'Address', ta: 'முகவரி', hi: 'पता', te: 'చిరునామా', kn: 'ವಿಳಾಸ', ml: 'വിലാസം',
  },
  'label.email': {
    en: 'Email', ta: 'மின்னஞ்சல்', hi: 'ईमेल', te: 'ఇమెయిల్', kn: 'ಇಮೇಲ್', ml: 'ഇമെയിൽ',
  },

  // ── Reports ──
  'reports.salesReport': {
    en: 'Sales Report', ta: 'விற்பனை அறிக்கை', hi: 'बिक्री रिपोर्ट', te: 'అమ్మకాల నివేదిక', kn: 'ಮಾರಾಟ ವರದಿ', ml: 'വിൽപ്പന റിപ്പോർട്ട്',
  },
  'reports.billHistory': {
    en: 'Bill History', ta: 'பில் வரலாறு', hi: 'बिल इतिहास', te: 'బిల్ చరిత్ర', kn: 'ಬಿಲ್ ಇತಿಹಾಸ', ml: 'ബിൽ ചരിത്രം',
  },
  'reports.fromDate': {
    en: 'From Date', ta: 'தேதி முதல்', hi: 'दिनांक से', te: 'తేదీ నుండి', kn: 'ದಿನಾಂಕದಿಂದ', ml: 'തീയതി മുതൽ',
  },
  'reports.toDate': {
    en: 'To Date', ta: 'தேதி வரை', hi: 'तारीख तक', te: 'తేదీ వరకు', kn: 'ದಿನಾಂಕದವರೆಗೆ', ml: 'തീയതി വരെ',
  },
};

export default translations;
