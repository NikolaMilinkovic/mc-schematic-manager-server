const express = require('express');
const multer = require('multer');
const { body, check, validationResult } = require('express-validator');
const schematicsController = require('../controllers/schematics/schematicsController');

const router = express.Router();
const upload = multer();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
}

router.post(
  '/upload-fawe',
  upload.single('schematicFile'),
  schematicsController.uploadFawe,
);

router.post(
  '/upload',
  upload.single('schematicFile'),
  [
    body('tags').notEmpty().withMessage('Tags are required!'),
    body('schematicName').notEmpty().withMessage('Schematic name is required!').escape(),
    body('image').notEmpty().withMessage('Image is required!'),
  ],
  handleValidationErrors,
  schematicsController.uploadSchematic,
);

router.patch(
  '/:id',
  upload.single('schematicFile'),
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
    body('tags').notEmpty().withMessage('Tags are required'),
    body('schematicName').notEmpty().withMessage('Schematic name is required').escape(),
    body('blurHash').optional().escape(),
    body('blurHashWidth').optional().escape(),
    body('blurHashHeight').optional().escape(),
  ],
  handleValidationErrors,
  schematicsController.updateSchematic,
);

router.get(
  '/',
  schematicsController.getAllSchematics,
);

router.get(
  '/tags',
  schematicsController.getAllTags,
);

router.get(
  '/:id/file',
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
  ],
  handleValidationErrors,
  schematicsController.getSchematicFile,
);

router.get(
  '/:id/fawe-string',
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
  ],
  handleValidationErrors,
  schematicsController.getSchematicFAWEString,
);

router.get(
  '/:id/collections',
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
  ],
  handleValidationErrors,
  schematicsController.getSchematicsCurrentCollections,
);

router.get(
  '/:id/image-url',
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
  ],
  handleValidationErrors,
  schematicsController.getSchematicImageUrl,
);

router.get(
  '/:id',
  [
    check('id').notEmpty().withMessage('Parameter for schematic not found').escape(),
  ],
  handleValidationErrors,
  schematicsController.getSchematic,
);

router.delete(
  '/:id',
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
  ],
  handleValidationErrors,
  schematicsController.removeSchematic,
);

module.exports = router;
