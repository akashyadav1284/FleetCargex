const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    // If it's a Zod Error, format cleanly
    if (error.issues) {
      // Map issues to generic "Invalid input" or precise safe validation messages
      const errorMap = error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return res.status(400).json({ 
        message: 'Input validation failed', 
        errors: errorMap 
      });
    }
    return res.status(400).json({ message: 'Bad request' });
  }
};

module.exports = validate;
