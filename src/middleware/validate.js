// Generic validation middleware. Give it zod schemas for the parts of the
// request you care about; it checks them and either stores the clean values in
// `req.valid` or stops with a 400 that lists every problem field.
//   router.post('/', validate({ body: createTaskSchema }), controller.create)
const AppError = require('../utils/AppError');

function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    const details = [];

    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        req.valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ field: issue.path.join('.') || part, message: issue.message });
        }
      }
    }

    if (details.length) return next(AppError.badRequest('Validation failed', details));
    next();
  };
}

module.exports = validate;
