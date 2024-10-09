function joiToJsonSchema (joiSchema) {
  const { error, value } = joiSchema.validate({});
  if (error) throw new Error('Joi schema is invalid.');

  return {
    $id: getLoginSchemaId(),
    type: 'object',
    properties: {
      username: { type: 'string' },
      password: { type: 'string' }
    },
    required: ['username', 'password']
  };
}
