const OpenAI = require('openai');

class TranslationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async translateToEnglish(chineseText, context = 'product') {
    try {
      if (!chineseText || typeof chineseText !== 'string') {
        return chineseText;
      }

      // Check if text is already in English (basic check)
      const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
      if (!chineseRegex.test(chineseText)) {
        return chineseText; // Already in English or no Chinese characters
      }

      const contextPrompts = {
        product: {
          system: "You are a professional translator specializing in e-commerce and smoking accessories. Translate Chinese product information to English with accuracy and commercial appeal. Maintain technical accuracy while making the translation sound natural and appealing to English-speaking customers.",
          user: `Translate this Chinese product information to English. Keep the translation professional and commercially appealing:\n\n${chineseText}`
        },
        description: {
          system: "You are a professional translator for e-commerce product descriptions. Translate Chinese product descriptions to English, maintaining technical accuracy while creating compelling marketing copy that appeals to English-speaking customers.",
          user: `Translate this Chinese product description to English. Make it compelling and professional:\n\n${chineseText}`
        },
        message: {
          system: "You are a professional translator for business communications. Translate Chinese business messages to English while maintaining the professional tone and intent.",
          user: `Translate this Chinese business message to English:\n\n${chineseText}`
        },
        category: {
          system: "You are a translator specializing in product categories and classifications. Translate Chinese product categories to their standard English equivalents used in e-commerce.",
          user: `Translate this Chinese product category to English:\n\n${chineseText}`
        }
      };

      const prompt = contextPrompts[context] || contextPrompts.product;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: prompt.system
          },
          {
            role: "user",
            content: prompt.user
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent translations
        top_p: 0.9
      });

      const translation = response.choices[0].message.content.trim();

      console.log(`🌐 Translated (${context}): "${chineseText.substring(0, 50)}..." -> "${translation.substring(0, 50)}..."`);

      return translation;

    } catch (error) {
      console.error('Translation error:', error.message);
      // Return original text if translation fails
      return chineseText;
    }
  }

  async translateToChinese(englishText, context = 'product') {
    try {
      if (!englishText || typeof englishText !== 'string') {
        return englishText;
      }

      // Check if text is already in Chinese
      const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
      if (chineseRegex.test(englishText)) {
        return englishText; // Already contains Chinese characters
      }

      const contextPrompts = {
        notification: {
          system: "You are a professional translator for business notifications. Translate English notifications to simplified Chinese, maintaining the professional tone and clarity for Chinese business users.",
          user: `Translate this English notification to simplified Chinese:\n\n${englishText}`
        },
        email: {
          system: "You are a professional translator for business emails. Translate English email content to simplified Chinese, maintaining professionalism and cultural appropriateness.",
          user: `Translate this English email content to simplified Chinese:\n\n${englishText}`
        },
        ui: {
          system: "You are a translator for user interface text. Translate English UI text to simplified Chinese, keeping it concise and user-friendly.",
          user: `Translate this English UI text to simplified Chinese:\n\n${englishText}`
        }
      };

      const prompt = contextPrompts[context] || contextPrompts.notification;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: prompt.system
          },
          {
            role: "user",
            content: prompt.user
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 0.9
      });

      const translation = response.choices[0].message.content.trim();

      console.log(`🌐 Translated to Chinese (${context}): "${englishText.substring(0, 50)}..." -> "${translation.substring(0, 50)}..."`);

      return translation;

    } catch (error) {
      console.error('Chinese translation error:', error.message);
      return englishText;
    }
  }

  async translateProductData(productData, targetLanguage = 'en') {
    try {
      const fieldsToTranslate = ['name', 'description', 'details'];
      const translatedData = { ...productData };

      for (const field of fieldsToTranslate) {
        if (translatedData[field]) {
          if (targetLanguage === 'en') {
            translatedData[field] = await this.translateToEnglish(translatedData[field], field === 'name' ? 'product' : 'description');
          } else if (targetLanguage === 'zh') {
            translatedData[field] = await this.translateToChinese(translatedData[field], field === 'name' ? 'product' : 'description');
          }
        }
      }

      // Translate variants if they exist
      if (translatedData.variants && Array.isArray(translatedData.variants)) {
        for (const variant of translatedData.variants) {
          if (variant.name) {
            if (targetLanguage === 'en') {
              variant.name = await this.translateToEnglish(variant.name, 'product');
            } else if (targetLanguage === 'zh') {
              variant.name = await this.translateToChinese(variant.name, 'product');
            }
          }
        }
      }

      return translatedData;

    } catch (error) {
      console.error('Product data translation error:', error.message);
      return productData; // Return original data if translation fails
    }
  }

  async detectLanguage(text) {
    try {
      if (!text || typeof text !== 'string') {
        return 'unknown';
      }

      // Simple regex-based detection for Chinese characters
      const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
      const englishRegex = /^[a-zA-Z0-9\s\.,!?;:'"\-()&%$#@\[\]{}\/\\+*=<>|`~_^]+$/;

      const hasChineseChars = chineseRegex.test(text);
      const isEnglishOnly = englishRegex.test(text.trim());

      if (hasChineseChars) {
        return 'zh';
      } else if (isEnglishOnly) {
        return 'en';
      }

      // For ambiguous cases, use OpenAI to detect
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a language detection assistant. Respond with only 'en' for English, 'zh' for Chinese, or 'unknown' for unclear cases."
          },
          {
            role: "user",
            content: `Detect the language of this text: "${text}"`
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      return response.choices[0].message.content.trim().toLowerCase();

    } catch (error) {
      console.error('Language detection error:', error.message);
      return 'unknown';
    }
  }

  async batchTranslate(textArray, targetLanguage = 'en', context = 'product') {
    try {
      const translations = [];

      // Process in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < textArray.length; i += batchSize) {
        const batch = textArray.slice(i, i + batchSize);
        const batchPromises = batch.map(text =>
          targetLanguage === 'en'
            ? this.translateToEnglish(text, context)
            : this.translateToChinese(text, context)
        );

        const batchResults = await Promise.all(batchPromises);
        translations.push(...batchResults);

        // Small delay between batches
        if (i + batchSize < textArray.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return translations;

    } catch (error) {
      console.error('Batch translation error:', error.message);
      return textArray; // Return original array if translation fails
    }
  }
}

module.exports = TranslationService;