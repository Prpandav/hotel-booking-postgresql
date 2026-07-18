import api from "./axios";

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

export const createCustomer = async (customerData) => {
  const response = await api.post("/customers", customerData);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Customer
|--------------------------------------------------------------------------
*/

export const getCustomerById = async (customerId) => {
  const response = await api.get(`/customers/${customerId}`);

  return response.data;
};
