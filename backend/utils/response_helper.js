// utils/response_helper.js
export const success = (res, data = {}, msg = "OK") => res.json({ success: true, message: msg, data });
export const error = (res, msg = "Error", code = 500) => res.status(code).json({ success: false, message: msg });
