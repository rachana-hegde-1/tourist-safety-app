import { Translate } from '@google-cloud/translate/build/src/v2';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Google Translate client
const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Languages to translate to
const languages = [
  { code: 'hi', name: 'Hindi', nativeName: 'Hindi' },
  { code: 'bn', name: 'Bengali', nativeName: 'Bangla' },
  { code: 'ta', name: 'Tamil', nativeName: 'Tamil' },
  { code: 'te', name: 'Telugu', nativeName: 'Telugu' },
  { code: 'kn', name: 'Kannada', nativeName: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'Malayalam' },
  { code: 'mr', name: 'Marathi', nativeName: 'Marathi' },
  { code: 'gu', name: 'Gujarati', nativeName: 'Gujarati' },
  { code: 'or', name: 'Odia', nativeName: 'Odia' },
  { code: 'as', name: 'Assamese', nativeName: 'Assamese' }
];

// Load the English translation file
const englishTranslationsPath = path.join(__dirname, '../public/locales/en/common.json');
const englishTranslations = JSON.parse(fs.readFileSync(englishTranslationsPath, 'utf8'));

// Function to translate a single string
async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error(`Error translating "${text}" to ${targetLanguage}:`, error);
    return text; // Return original text if translation fails
  }
}

// Function to translate all keys in an object recursively
async function translateObject(obj: Record<string, unknown>, targetLanguage: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Skip very short strings and technical terms
      if (value.length < 2 || /^[A-Z_]+$/.test(value)) {
        result[key] = value;
      } else {
        result[key] = await translateText(value, targetLanguage);
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value as Record<string, unknown>, targetLanguage);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Main function to generate all translations
async function generateAllTranslations() {
  console.log('Starting translation generation...');
  
  for (const lang of languages) {
    console.log(`Translating to ${lang.nativeName} (${lang.code})...`);
    
    try {
      const translatedContent = await translateObject(englishTranslations, lang.code);
      
      // Create directory if it doesn't exist
      const dirPath = path.join(__dirname, `../public/locales/${lang.code}`);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write translation file
      const filePath = path.join(dirPath, 'common.json');
      fs.writeFileSync(filePath, JSON.stringify(translatedContent, null, 2), 'utf8');
      
      console.log(`Completed translation for ${lang.nativeName}`);
    } catch (error) {
      console.error(`Failed to translate to ${lang.nativeName}:`, error);
    }
  }
  
  console.log('Translation generation completed!');
}

// Function to manually review and fix specific translations
function manualReviewAndFix() {
  console.log('Performing manual review and fixes for critical languages...');
  
  // Hindi fixes
  const hindiPath = path.join(__dirname, '../public/locales/hi/common.json');
  if (fs.existsSync(hindiPath)) {
    const hindiTranslations = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));
    
    // Manual fixes for Hindi
    hindiTranslations.buttons.panic = "PANIC"; // Keep PANIC in English for recognition
    hindiTranslations.panic_button.press_for_emergency = "Emergency ke liye dabayein";
    hindiTranslations.panic_button.hold_to_activate = "Activate karne ke liye dabaye rakhein";
    hindiTranslations.panic_button.emergency_activated = "Emergency activate ho gaya";
    hindiTranslations.panic_button.emergency_cancelled = "Emergency cancel ho gaya";
    hindiTranslations.panic_button.confirm_emergency = "Emergency alert confirm karein?";
    hindiTranslations.panic_button.emergency_confirmation_message = "Ye emergency contacts aur authorities ko notify karega. Kya aap sure hain?";
    hindiTranslations.panic_button.yes_activate_emergency = "Haan, Emergency Activate karein";
    hindiTranslations.panic_button.no_cancel = "Nahi, Cancel karein";
    hindiTranslations.panic_button.emergency_services_notified = "Emergency services ko inform kar diya gaya hai";
    hindiTranslations.panic_button.contacts_notified = "Aapke emergency contacts ko inform kar diya gaya hai";
    hindiTranslations.panic_button.stay_calm = "Shant rahiye, madad aa rahi hai";
    
    fs.writeFileSync(hindiPath, JSON.stringify(hindiTranslations, null, 2), 'utf8');
    console.log('Hindi translations manually reviewed and fixed');
  }
  
  // Bengali fixes
  const bengaliPath = path.join(__dirname, '../public/locales/bn/common.json');
  if (fs.existsSync(bengaliPath)) {
    const bengaliTranslations = JSON.parse(fs.readFileSync(bengaliPath, 'utf8'));
    
    // Manual fixes for Bengali
    bengaliTranslations.buttons.panic = "PANIC"; // Keep PANIC in English for recognition
    bengaliTranslations.panic_button.press_for_emergency = "Emergency-er jonno chapun";
    bengaliTranslations.panic_button.hold_to_activate = "Activate korar jonno chap-e rakhen";
    bengaliTranslations.panic_button.emergency_activated = "Emergency activate hoye geche";
    bengaliTranslations.panic_button.emergency_cancelled = "Emergency cancel hoye geche";
    bengaliTranslations.panic_button.confirm_emergency = "Emergency alert confirm korben?";
    bengaliTranslations.panic_button.emergency_confirmation_message = "Eta emergency contacts ar authorities ke notify korbe. Apni ki suren?";
    bengaliTranslations.panic_button.yes_activate_emergency = "Haan, Emergency Activate korun";
    bengaliTranslations.panic_button.no_cancel = "Na, Cancel korun";
    bengaliTranslations.panic_button.emergency_services_notified = "Emergency services ke inform kora hoyeche";
    bengaliTranslations.panic_button.contacts_notified = "Apnar emergency contacts ke inform kora hoyeche";
    bengaliTranslations.panic_button.stay_calm = "Shanto thakun, madad aschhe";
    
    fs.writeFileSync(bengaliPath, JSON.stringify(bengaliTranslations, null, 2), 'utf8');
    console.log('Bengali translations manually reviewed and fixed');
  }
}

// Run the translation generation
if (require.main === module) {
  generateAllTranslations()
    .then(() => {
      manualReviewAndFix();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Translation generation failed:', error);
      process.exit(1);
    });
}

export { generateAllTranslations, manualReviewAndFix };
