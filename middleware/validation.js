const Joi = require('joi');

// User validation schemas
exports.registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  full_name: Joi.string().required()
});

exports.loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

exports.updateProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  full_name: Joi.string().required()
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Product validation schemas
exports.productSchema = Joi.object({
  cat_id: Joi.number().required(),
  brand_id: Joi.number().required(),
  type_id: Joi.number().required(),
  name: Joi.string().required(),
  detail: Joi.string().required(),
  unit_name: Joi.string().required(),
  unit_value: Joi.number().required(),
  nutrition_weight: Joi.number().required(),
  price: Joi.number().required(),
  images: Joi.array().items(Joi.string()).min(1).required(),
  nutrition_info: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required()
    })
  ).required()
});

// Cart validation schemas
exports.addToCartSchema = Joi.object({
  user_id: Joi.number().required(),
  prod_id: Joi.number().required(),
  quantity: Joi.number().min(1).required()
});

exports.updateCartSchema = Joi.object({
  quantity: Joi.number().min(1).required()
});

// Order validation schemas
exports.checkoutSchema = Joi.object({
  user_id: Joi.number().required(),
  address: Joi.string().required(),
  payment_method: Joi.string().valid('cash', 'card').required(),
  cart_ids: Joi.array().items(Joi.number()).min(1).required()
});

// Address validation schemas
exports.addressSchema = Joi.object({
  address: Joi.string().required(),
  is_default: Joi.boolean().required()
});

// Admin validation schemas
exports.updateOrderStatusSchema = Joi.object({
  status: Joi.number().valid(1, 2, 3, 4).required() // 1: pending, 2: processing, 3: completed, 4: cancelled
});

exports.updateUserStatusSchema = Joi.object({
  status: Joi.number().valid(1, 2).required() // 1: active, 2: inactive
}); 