function toResponse(notification) {
  const obj = notification.toJSON();
  obj.read = Boolean(obj.read);
  return obj;
}

module.exports = {
  toResponse,
};
