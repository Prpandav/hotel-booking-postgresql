import {
  createCustomer,
  deactivateCustomer,
  findAllCustomers,
  findCustomerById,
  updateCustomer,
} from "../repositories/customerRepository.js";

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

const hasOwn = (object, property) => {
  return Object.prototype.hasOwnProperty.call(
    object,
    property
  );
};

const parsePositiveInteger = (
  value,
  fieldName
) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw createError(
      `${fieldName} must be a positive integer`
    );
  }

  return number;
};

const parseNonNegativeInteger = (
  value,
  fieldName
) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw createError(
      `${fieldName} must be an integer greater than or equal to 0`
    );
  }

  return number;
};

const parseBooleanQuery = (
  value,
  fieldName
) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createError(
    `${fieldName} must be true or false`
  );
};

const validateFullName = (fullName) => {
  if (
    typeof fullName !== "string" ||
    fullName.trim().length < 2
  ) {
    throw createError(
      "full_name must contain at least 2 characters"
    );
  }

  if (fullName.trim().length > 100) {
    throw createError(
      "full_name cannot exceed 100 characters"
    );
  }

  return fullName.trim();
};

const validateEmail = (email) => {
  if (typeof email !== "string") {
    throw createError("email is required");
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    throw createError(
      "Provide a valid email address"
    );
  }

  if (normalizedEmail.length > 150) {
    throw createError(
      "email cannot exceed 150 characters"
    );
  }

  return normalizedEmail;
};

const validatePhone = (phone) => {
  if (phone === null) {
    return null;
  }

  if (typeof phone !== "string") {
    throw createError(
      "phone must be a string or null"
    );
  }

  const normalizedPhone = phone.trim();

  if (
    normalizedPhone.length < 7 ||
    normalizedPhone.length > 20
  ) {
    throw createError(
      "phone must contain between 7 and 20 characters"
    );
  }

  return normalizedPhone;
};

const validatePreferences = (preferences) => {
  if (
    typeof preferences !== "object" ||
    preferences === null ||
    Array.isArray(preferences)
  ) {
    throw createError(
      "preferences must be a JSON object"
    );
  }

  if (
    hasOwn(preferences, "preferred_floor")
  ) {
    parseNonNegativeInteger(
      preferences.preferred_floor,
      "preferences.preferred_floor"
    );
  }

  if (hasOwn(preferences, "bed_type")) {
    if (
      typeof preferences.bed_type !== "string" ||
      preferences.bed_type.trim() === ""
    ) {
      throw createError(
        "preferences.bed_type must be a non-empty string"
      );
    }

    preferences.bed_type =
      preferences.bed_type.trim().toLowerCase();
  }

  if (
    hasOwn(preferences, "smoking_room") &&
    typeof preferences.smoking_room !== "boolean"
  ) {
    throw createError(
      "preferences.smoking_room must be true or false"
    );
  }

  return preferences;
};

export const getCustomers = async (
  req,
  res,
  next
) => {
  try {
    const filters = {
      search: req.query.search,
      bedType: req.query.bed_type
        ?.trim()
        .toLowerCase(),
      includeInactive: parseBooleanQuery(
        req.query.include_inactive,
        "include_inactive"
      ) ?? false,
    };

    if (
      req.query.preferred_floor !== undefined
    ) {
      filters.preferredFloor =
        parseNonNegativeInteger(
          req.query.preferred_floor,
          "preferred_floor"
        );
    }

    if (
      req.query.smoking_room !== undefined
    ) {
      filters.smokingRoom =
        parseBooleanQuery(
          req.query.smoking_room,
          "smoking_room"
        );
    }

    const customers =
      await findAllCustomers(filters);

    res.status(200).json({
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req,
  res,
  next
) => {
  try {
    const customerId = parsePositiveInteger(
      req.params.id,
      "customer id"
    );

    const customer =
      await findCustomerById(customerId);

    if (!customer) {
      throw createError(
        "Customer not found",
        404
      );
    }

    res.status(200).json({
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const addCustomer = async (
  req,
  res,
  next
) => {
  try {
    const {
      full_name,
      email,
      phone = null,
      preferences = {},
    } = req.body;

    const customer = await createCustomer({
      fullName: validateFullName(full_name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      preferences:
        validatePreferences(preferences),
    });

    res.status(201).json({
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const editCustomer = async (
  req,
  res,
  next
) => {
  try {
    const customerId = parsePositiveInteger(
      req.params.id,
      "customer id"
    );

    const changes = {};

    if (hasOwn(req.body, "full_name")) {
      changes.fullName = validateFullName(
        req.body.full_name
      );
    }

    if (hasOwn(req.body, "email")) {
      changes.email = validateEmail(
        req.body.email
      );
    }

    if (hasOwn(req.body, "phone")) {
      changes.phone = validatePhone(
        req.body.phone
      );
    }

    if (hasOwn(req.body, "preferences")) {
      changes.preferences =
        validatePreferences(
          req.body.preferences
        );
    }

    if (Object.keys(changes).length === 0) {
      throw createError(
        "Provide at least one field to update"
      );
    }

    const customer = await updateCustomer(
      customerId,
      changes
    );

    if (!customer) {
      throw createError(
        "Active customer not found",
        404
      );
    }

    res.status(200).json({
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCustomer = async (
  req,
  res,
  next
) => {
  try {
    const customerId = parsePositiveInteger(
      req.params.id,
      "customer id"
    );

    const deletedCustomer =
      await deactivateCustomer(customerId);

    if (!deletedCustomer) {
      throw createError(
        "Active customer not found",
        404
      );
    }

    res.status(200).json({
      message:
        "Customer deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};