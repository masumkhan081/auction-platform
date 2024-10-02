/* eslint-disable no-unused-vars */

const allowedRoles = {
  admin: "ADMIN",
  seller: "SELLER",
  user: "USER",
};

const operableEntities = {
  // ---------------------------------------------    product related
  product: "Products",
  product_request: "Product requests",
  // ----------------------------------------------     seller part
  category: "Category",
  sub_category: "Sub category",
  brand: "Brand",
  unit: "Unit",
  size: "Size",
  color: "Color",
  // -----------------------------------------  business setting  (admin)
  business_setup: "Business setup",
  shop_setting: "Shop setting",
  withdraw_setting: "Withdraw setting",
  delivery_charge: "Delivery charge",
  general_setting: "General setting",
  social_link: "Social link",
  quick_link: "Quick link",
  theme_color: "Theme color",
  ticket_type: "Ticket type",
  website_logo: "Website logo",
  textual_logo: "Textual logo",
  // --------------------------------------------------   legal-page  (admin)
  privacy_policy: "Privacy policy",
  terms_and_conditions: "Terms & condition",
  return_and_refund_policy: "Return & refund policy",
  shipping_and_delivery_policy: "Shipping & delivery policy",
  about_us: "About us",
  contact_us: "Contact us",
  // ------------------------------------------------   third-party  (admin)
  payment_gateway: "Payment gateway",
  sms_gateway: "SMS gateway",
  mail_config: "Mail configuration",
  // ------------------------------------------------  promotion management  (admin)
  ad: "Ad",
  banner: "Banner",
  coupon: "Coupon",
  notification: "Notification",
  // ------------------------------------------------  promotion management  (seller)
  shop_banner: "Shop banner",
  coupon_voucher: "Coupon voucher",
  //
  seller_profile: "Seller profile",
  user_profile: "User profile",
  rider: "Rider",
  shop: "Shop",
  order: "Order",
  delivery: "Delivery",
  users: "Users",
  customer: "Customer",
  sale: "Sale",
  sale_return: "Sale Return",
  support: "Support",
  staff: "Staff",
  profile: "Profile",
  user: "User",
};

const paginationFields = ["page", "limit", "sortBy", "sortOrder"];
const defaultViewLimit = 20;
const defaultSortOrder = "desc";

// may be changed based on the outcome expected
const map_default_sort_by = {
  [operableEntities.product]: "products",
  [operableEntities.product_category]: "product_category",
  [operableEntities.product_request]: "product_requests",
  [operableEntities.business_setup]: "business_setup",
  [operableEntities.delivery_charge]: "delivery_charge",
  [operableEntities.general_setting]: "general_setting",
  [operableEntities.social_link]: "social_link",
  [operableEntities.theme_color]: "theme_color",
  [operableEntities.contact_us]: "contact_us",
  [operableEntities.payment_gateway]: "payment_gateway",
  [operableEntities.sms_gateway]: "sms_gateway",
  [operableEntities.mail_config]: "mail_config",
  [operableEntities.ad]: "title",
  [operableEntities.banner]: "banner",
  [operableEntities.coupon]: "coupon",
  [operableEntities.notification]: "notification",
  [operableEntities.rider]: "full_name",
  [operableEntities.shop]: "shop",
  [operableEntities.order]: "order",
  [operableEntities.delivery]: "delivery",
  [operableEntities.users]: "users",
  [operableEntities.customer]: "customer",
  [operableEntities.sale]: "sale",
  [operableEntities.sale_return]: "sale_return",
  [operableEntities.support]: "support",
  [operableEntities.staff]: "staff",
  [operableEntities.brand]: "brand",
  [operableEntities.unit]: "units",
  [operableEntities.size]: "size",
  [operableEntities.color]: "color",
  [operableEntities.profile]: "profile",
  [operableEntities.user]: "user", // Adjusted for singular form if needed
};

const map_searchables = {
  [operableEntities.product]: ["name", "brand", "color", "category"],
  [operableEntities.product_category]: ["name"],
  [operableEntities.sub_category]: ["name"],
  [operableEntities.product_request]: ["request_id", "product_name"],
  [operableEntities.business_setup]: ["business_name", "address"],
  [operableEntities.delivery_charge]: ["charge_amount", "description"],
  [operableEntities.general_setting]: ["setting_name", "setting_value"],
  [operableEntities.social_link]: ["platform_name", "url"],
  [operableEntities.theme_color]: ["color_name", "hex_value"],
  [operableEntities.contact_us]: ["contact_type", "details"],
  [operableEntities.payment_gateway]: ["gateway_name", "api_key"],
  [operableEntities.sms_gateway]: ["provider_name", "api_key"],
  [operableEntities.mail_config]: ["smtp_host", "smtp_user"],
  [operableEntities.ad]: ["title"],
  [operableEntities.banner]: ["title", "banner_description"],
  [operableEntities.coupon]: ["coupon_code", "description"],
  [operableEntities.coupon_voucher]: ["code"],

  [operableEntities.notification]: [
    "notification_title",
    "notification_message",
  ],
  [operableEntities.rider]: ["full_name", "phone"],
  [operableEntities.shop]: ["title", "location"],
  [operableEntities.order]: ["order_id", "customer_name"],
  [operableEntities.delivery]: ["delivery_id", "delivery_address"],
  [operableEntities.users]: ["username", "email"],
  [operableEntities.customer]: ["name", "email"],
  [operableEntities.sale]: ["sale_id", "product_name"],
  [operableEntities.sale_return]: ["return_id", "sale_id"],
  [operableEntities.support]: ["ticket_id", "subject"],
  [operableEntities.staff]: ["staff_name", "staff_id"],
  [operableEntities.brand]: ["name"],
  [operableEntities.unit]: ["name"],
  [operableEntities.size]: ["name"],
  [operableEntities.color]: ["name"],
  [operableEntities.profile]: ["user_id", "name"],
  [operableEntities.user]: ["username", "email"], // Adding user as well
};

module.exports = {
  paginationFields,
  defaultViewLimit,
  map_searchables,
  defaultSortOrder,
  map_default_sort_by,
  operableEntities,
  allowedRoles,
  //
};
