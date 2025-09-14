const express = require('express');
const TranslationService = require('../services/translationService');
const { anyAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Translate text to English
router.post('/to-english', anyAuth, async (req, res) => {
  try {
    const { text, context = 'product' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const translationService = new TranslationService();
    const translatedText = await translationService.translateToEnglish(text, context);

    res.json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        context
      }
    });

  } catch (error) {
    console.error('Translation to English error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Translate text to Chinese
router.post('/to-chinese', anyAuth, async (req, res) => {
  try {
    const { text, context = 'notification' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const translationService = new TranslationService();
    const translatedText = await translationService.translateToChinese(text, context);

    res.json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        context
      }
    });

  } catch (error) {
    console.error('Translation to Chinese error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Detect language of text
router.post('/detect', anyAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const translationService = new TranslationService();
    const detectedLanguage = await translationService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        text,
        detected_language: detectedLanguage
      }
    });

  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Language detection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Batch translate multiple texts
router.post('/batch', anyAuth, async (req, res) => {
  try {
    const { texts, target_language = 'en', context = 'product' } = req.body;

    if (!Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        message: 'Texts must be an array'
      });
    }

    const translationService = new TranslationService();
    const translations = await translationService.batchTranslate(texts, target_language, context);

    res.json({
      success: true,
      data: {
        original: texts,
        translated: translations,
        target_language,
        context
      }
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch translation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;