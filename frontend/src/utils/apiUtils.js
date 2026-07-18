export const unwrapData = (response) => {
  return response?.data ?? response;
};

export const unwrapEntity = (response, entityName) => {
  const data = unwrapData(response);

  return data?.[entityName] ?? data;
};

export const unwrapArray = (response, key) => {
  const data = unwrapData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (key && Array.isArray(data?.[key])) {
    return data[key];
  }

  return [];
};
